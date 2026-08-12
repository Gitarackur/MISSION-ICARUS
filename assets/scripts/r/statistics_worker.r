#!/usr/bin/env Rscript

suppressPackageStartupMessages(library(jsonlite))

worker_argument <- grep("^--file=", commandArgs(trailingOnly = FALSE), value = TRUE)
if (length(worker_argument) != 1) {
  stop("Unable to resolve the R statistics worker directory", call. = FALSE)
}
worker_path <- normalizePath(
  sub("^--file=", "", worker_argument[[1]]),
  winslash = "/",
  mustWork = TRUE
)
module_directory <- file.path(dirname(worker_path), "statistics")
source(file.path(module_directory, "worker_protocol.r"), local = TRUE)
source(file.path(module_directory, "binary_matrix_store.r"), local = TRUE)
source(file.path(module_directory, "action_handlers.r"), local = TRUE)
source(file.path(module_directory, "action_registry.r"), local = TRUE)

protocol <- WorkerProtocol$new()
matrix_store <- BinaryMatrixStore$new()
registry <- ScientificActionRegistry$new(list(
  LimmaActionHandler$new(matrix_store, protocol),
  WgcnaActionHandler$new(matrix_store, protocol)
))

protocol$emit(list(type = "ready"))
input_connection <- file("stdin", open = "r")

repeat {
  line <- readLines(con = input_connection, n = 1, warn = FALSE)
  if (length(line) == 0) break
  if (!nzchar(trimws(line))) next
  request <- tryCatch(
    jsonlite::fromJSON(line, simplifyVector = FALSE),
    error = function(error) {
      message(
        "Ignoring invalid statistics worker request: ",
        conditionMessage(error)
      )
      NULL
    }
  )
  if (!is.list(request) || is.null(request$id) || !is.numeric(request$id)) next

  request_id <- request$id
  tryCatch(
    {
      result <- registry$run(request$payload, request_id)
      protocol$emit(list(id = request_id, ok = TRUE, result = result))
    },
    error = function(error) {
      protocol$emit(list(
        id = request_id,
        ok = FALSE,
        error = paste(class(error)[1], conditionMessage(error), sep = ": ")
      ))
    }
  )
}
