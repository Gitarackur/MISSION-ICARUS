BinaryMatrixStore <- setRefClass(
  "BinaryMatrixStore",
  methods = list(
    required_path = function(payload, key) {
      value <- payload[[key]]
      if (is.null(value) || length(value) != 1 || !nzchar(as.character(value))) {
        stop(sprintf("%s is required", key), call. = FALSE)
      }
      normalizePath(as.character(value), mustWork = FALSE)
    },
    load = function(payload) {
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
        stop(
          "Scientific input buffer size does not match its shape",
          call. = FALSE
        )
      }
      result <- matrix(values, nrow = row_count, ncol = length(column_names))
      colnames(result) <- column_names
      result
    },
    write = function(payload, output) {
      output_path <- required_path(payload, "outputPath")
      connection <- file(output_path, open = "wb")
      on.exit(close(connection), add = TRUE)
      writeBin(as.double(output), connection, size = 8, endian = "little")
    }
  )
)
