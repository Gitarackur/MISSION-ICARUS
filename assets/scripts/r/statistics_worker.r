#!/usr/bin/env Rscript

suppressPackageStartupMessages(library(jsonlite))

emit_message <- function(message) {
  cat(toJSON(message, auto_unbox = TRUE, null = "null", digits = NA), "\n", sep = "")
  flush(stdout())
}

emit_progress <- function(request_id, progress, detail) {
  emit_message(list(
    id = request_id,
    type = "progress",
    progress = max(0, min(1, progress)),
    detail = detail
  ))
}

required_path <- function(payload, key) {
  value <- payload[[key]]
  if (is.null(value) || length(value) != 1 || !nzchar(as.character(value))) {
    stop(sprintf("%s is required", key), call. = FALSE)
  }
  normalizePath(as.character(value), mustWork = FALSE)
}

load_matrix <- function(payload) {
  input_path <- required_path(payload, "inputPath")
  if (!file.exists(input_path) || dir.exists(input_path)) {
    stop("Scientific input file does not exist", call. = FALSE)
  }
  column_names <- as.character(unlist(payload$columnNames, use.names = FALSE))
  row_count <- as.integer(payload$rowCount)
  if (length(column_names) < 1 || is.na(row_count) || row_count < 1) {
    stop("Scientific matrix shape is invalid", call. = FALSE)
  }
  values <- readBin(
    input_path,
    what = "double",
    n = length(column_names) * row_count,
    size = 8,
    endian = "little"
  )
  if (length(values) != length(column_names) * row_count) {
    stop("Scientific input buffer size does not match its shape", call. = FALSE)
  }
  matrix <- matrix(values, nrow = row_count, ncol = length(column_names))
  colnames(matrix) <- column_names
  matrix
}

write_matrix <- function(payload, output) {
  output_path <- required_path(payload, "outputPath")
  connection <- file(output_path, open = "wb")
  on.exit(close(connection), add = TRUE)
  writeBin(as.double(output), connection, size = 8, endian = "little")
}

run_limma <- function(payload, request_id) {
  if (!requireNamespace("limma", quietly = TRUE)) {
    stop("R package 'limma' is unavailable", call. = FALSE)
  }
  input <- load_matrix(payload)
  treatment_names <- as.character(unlist(payload$treatmentColumns, use.names = FALSE))
  control_names <- as.character(unlist(payload$controlColumns, use.names = FALSE))
  treatment_indices <- match(treatment_names, colnames(input), nomatch = 0)
  control_indices <- match(control_names, colnames(input), nomatch = 0)
  treatment_indices <- treatment_indices[treatment_indices > 0]
  control_indices <- control_indices[control_indices > 0]
  if (length(treatment_indices) < 1 || length(control_indices) < 1) {
    stop("LIMMA requires treatment and control columns", call. = FALSE)
  }

  emit_progress(request_id, 0.1, "Fitting LIMMA linear model")
  expression <- cbind(
    input[, treatment_indices, drop = FALSE],
    input[, control_indices, drop = FALSE]
  )
  group <- factor(
    c(rep("treatment", length(treatment_indices)), rep("control", length(control_indices))),
    levels = c("control", "treatment")
  )
  design <- stats::model.matrix(~0 + group)
  colnames(design) <- c("control", "treatment")
  fit <- limma::lmFit(expression, design)
  contrast <- limma::makeContrasts(treatment - control, levels = design)
  fit <- limma::eBayes(limma::contrasts.fit(fit, contrast))
  adjustment <- if (identical(as.character(payload$adjustmentMethod), "bonferroni")) {
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
  write_matrix(payload, output)
  emit_progress(request_id, 1, "LIMMA empirical-Bayes model complete")
  list(
    outputColumnNames = c("log2_fold_change", "p_value", "adjusted_p_value"),
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

run_wgcna <- function(payload, request_id) {
  if (!requireNamespace("WGCNA", quietly = TRUE)) {
    stop("R package 'WGCNA' is unavailable", call. = FALSE)
  }
  input <- load_matrix(payload)
  if (ncol(input) < 4 || nrow(input) < 3) {
    stop("WGCNA requires at least four sample columns and three data rows", call. = FALSE)
  }
  for (row_index in seq_len(nrow(input))) {
    missing <- !is.finite(input[row_index, ])
    observed <- input[row_index, !missing]
    replacement <- if (length(observed) > 0) stats::median(observed) else 0
    input[row_index, missing] <- replacement
  }
  # Icarus input rows are genes/features and selected columns are samples;
  # WGCNA expects samples in rows and genes/features in columns.
  expression <- t(input)
  variable <- apply(expression, 2, stats::var) > 0
  if (sum(variable) < 3) {
    stop("WGCNA requires at least three non-constant variables", call. = FALSE)
  }
  soft_threshold <- max(1, min(30, as.integer(payload$softThreshold %||% 6)))
  threads <- max(1, min(4, as.integer(payload$workers %||% 1)))
  try(WGCNA::allowWGCNAThreads(nThreads = threads), silent = TRUE)
  dat_expr <- expression[, variable, drop = FALSE]
  minimum_module_size <- max(2, min(30, floor(ncol(dat_expr) / 5)))

  emit_progress(request_id, 0.1, "Constructing WGCNA adjacency and TOM")
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
  write_matrix(payload, output)
  emit_progress(request_id, 1, "WGCNA modules complete")
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

`%||%` <- function(value, fallback) {
  if (is.null(value) || length(value) == 0 || is.na(value[[1]])) fallback else value[[1]]
}

emit_message(list(type = "ready"))
input_connection <- file("stdin", open = "r")

repeat {
  line <- readLines(con = input_connection, n = 1, warn = FALSE)
  if (length(line) == 0) break
  if (!nzchar(trimws(line))) next
  request <- tryCatch(
    fromJSON(line, simplifyVector = FALSE),
    error = function(error) {
      message("Ignoring invalid statistics worker request: ", conditionMessage(error))
      NULL
    }
  )
  if (!is.list(request) || is.null(request$id) || !is.numeric(request$id)) next

  request_id <- request$id
  tryCatch(
    {
      payload <- request$payload
      action <- as.character(payload$action)
      result <- if (identical(action, "limma")) {
        run_limma(payload, request_id)
      } else if (identical(action, "wgcna-analysis")) {
        run_wgcna(payload, request_id)
      } else {
        stop(sprintf("Unsupported R scientific action: %s", action), call. = FALSE)
      }
      emit_message(list(id = request_id, ok = TRUE, result = result))
    },
    error = function(error) {
      emit_message(list(
        id = request_id,
        ok = FALSE,
        error = paste(class(error)[1], conditionMessage(error), sep = ": ")
      ))
    }
  )
}
