`%||%` <- function(value, fallback) {
  if (is.null(value) || length(value) == 0 || is.na(value[[1]])) {
    fallback
  } else {
    value[[1]]
  }
}

ScientificActionHandler <- setRefClass(
  "ScientificActionHandler",
  fields = list(
    action = "character",
    required_package = "character",
    store = "ANY",
    protocol = "ANY"
  ),
  methods = list(
    initialize = function(
      action_name,
      package_name,
      matrix_store,
      worker_protocol
    ) {
      action <<- action_name
      required_package <<- package_name
      store <<- matrix_store
      protocol <<- worker_protocol
      callSuper()
    },
    run = function(payload, request_id) {
      stop(sprintf("Handler for '%s' is not implemented", action), call. = FALSE)
    },
    is_available = function() {
      requireNamespace(required_package, quietly = TRUE)
    }
  )
)

LimmaActionHandler <- setRefClass(
  "LimmaActionHandler",
  contains = "ScientificActionHandler",
  methods = list(
    initialize = function(matrix_store, worker_protocol) {
      callSuper(
        action_name = "limma",
        package_name = "limma",
        matrix_store = matrix_store,
        worker_protocol = worker_protocol
      )
    },
    run = function(payload, request_id) {
      if (!requireNamespace("limma", quietly = TRUE)) {
        stop("R package 'limma' is unavailable", call. = FALSE)
      }
      input <- store$load(payload)
      treatment_names <- as.character(
        unlist(payload$treatmentColumns, use.names = FALSE)
      )
      control_names <- as.character(
        unlist(payload$controlColumns, use.names = FALSE)
      )
      treatment_indices <- match(treatment_names, colnames(input), nomatch = 0)
      control_indices <- match(control_names, colnames(input), nomatch = 0)
      treatment_indices <- treatment_indices[treatment_indices > 0]
      control_indices <- control_indices[control_indices > 0]
      if (length(treatment_indices) < 1 || length(control_indices) < 1) {
        stop("LIMMA requires treatment and control columns", call. = FALSE)
      }

      protocol$progress(request_id, 0.1, "Fitting LIMMA linear model")
      expression <- cbind(
        input[, treatment_indices, drop = FALSE],
        input[, control_indices, drop = FALSE]
      )
      group <- factor(
        c(
          rep("treatment", length(treatment_indices)),
          rep("control", length(control_indices))
        ),
        levels = c("control", "treatment")
      )
      design <- stats::model.matrix(~0 + group)
      colnames(design) <- c("control", "treatment")
      fit <- limma::lmFit(expression, design)
      contrast <- limma::makeContrasts(treatment - control, levels = design)
      fit <- limma::eBayes(limma::contrasts.fit(fit, contrast))
      adjustment <- if (
        identical(as.character(payload$adjustmentMethod), "bonferroni")
      ) {
        "bonferroni"
      } else {
        "BH"
      }
      table <- limma::topTable(
        fit,
        number = nrow(expression),
        sort.by = "none",
        adjust.method = adjustment
      )
      output <- cbind(table$logFC, table$P.Value, table$adj.P.Val)
      store$write(payload, output)
      protocol$progress(request_id, 1, "LIMMA empirical-Bayes model complete")
      list(
        outputColumnNames = c(
          "log2_fold_change",
          "p_value",
          "adjusted_p_value"
        ),
        outputColumnCount = 3,
        outputRowCount = nrow(output),
        granularity = "row-aligned",
        metadata = list(
          executionBackend = "r-bioconductor-limma",
          rVersion = R.version.string,
          limmaVersion = as.character(utils::packageVersion("limma")),
          adjustmentMethod = adjustment,
          treatmentColumns = treatment_names,
          controlColumns = control_names
        )
      )
    }
  )
)

WgcnaActionHandler <- setRefClass(
  "WgcnaActionHandler",
  contains = "ScientificActionHandler",
  methods = list(
    initialize = function(matrix_store, worker_protocol) {
      callSuper(
        action_name = "wgcna-analysis",
        package_name = "WGCNA",
        matrix_store = matrix_store,
        worker_protocol = worker_protocol
      )
    },
    run = function(payload, request_id) {
      if (!requireNamespace("WGCNA", quietly = TRUE)) {
        stop("R package 'WGCNA' is unavailable", call. = FALSE)
      }
      input <- store$load(payload)
      if (ncol(input) < 4 || nrow(input) < 3) {
        stop(
          "WGCNA requires at least four sample columns and three data rows",
          call. = FALSE
        )
      }
      for (row_index in seq_len(nrow(input))) {
        missing <- !is.finite(input[row_index, ])
        observed <- input[row_index, !missing]
        replacement <- if (length(observed) > 0) {
          stats::median(observed)
        } else {
          0
        }
        input[row_index, missing] <- replacement
      }
      # Icarus rows are features and columns are samples. WGCNA expects the
      # opposite orientation.
      expression <- t(input)
      variable <- apply(expression, 2, stats::var) > 0
      if (sum(variable) < 3) {
        stop(
          "WGCNA requires at least three non-constant variables",
          call. = FALSE
        )
      }
      soft_threshold <- max(
        1,
        min(30, as.integer(payload$softThreshold %||% 6))
      )
      threads <- max(1, min(4, as.integer(payload$workers %||% 1)))
      try(WGCNA::allowWGCNAThreads(nThreads = threads), silent = TRUE)
      dat_expr <- expression[, variable, drop = FALSE]
      minimum_module_size <- max(2, min(30, floor(ncol(dat_expr) / 5)))

      protocol$progress(
        request_id,
        0.1,
        "Constructing WGCNA adjacency and TOM"
      )
      network <- WGCNA::blockwiseModules(
        dat_expr,
        power = soft_threshold,
        TOMType = "unsigned",
        minModuleSize = minimum_module_size,
        mergeCutHeight = 0.25,
        numericLabels = TRUE,
        pamRespectsDendro = FALSE,
        verbose = 0
      )
      module_ids <- numeric(ncol(expression))
      module_ids[variable] <- as.numeric(network$colors)
      connectivity <- numeric(ncol(expression))
      connectivity[variable] <- as.numeric(
        WGCNA::softConnectivity(dat_expr, power = soft_threshold, verbose = 0)
      )
      output <- cbind(module_ids, connectivity)
      store$write(payload, output)
      protocol$progress(request_id, 1, "WGCNA modules complete")
      list(
        outputColumnNames = c("module_id", "connectivity"),
        outputColumnCount = 2,
        outputRowCount = nrow(output),
        granularity = "row-aligned",
        metadata = list(
          executionBackend = "r-wgcna",
          rVersion = R.version.string,
          wgcnaVersion = as.character(utils::packageVersion("WGCNA")),
          softThreshold = soft_threshold,
          moduleCount = length(unique(module_ids[module_ids > 0])),
          sampleColumns = colnames(input),
          workers = threads
        )
      )
    }
  )
)
