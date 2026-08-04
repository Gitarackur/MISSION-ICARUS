#!/usr/bin/env Rscript

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("No renderer script path provided")
}

suppressPackageStartupMessages({
  library(jsonlite)
  library(ggplot2)
})

plot_script <- args[1]

emit_message <- function(message) {
  cat(toJSON(message, auto_unbox = TRUE, null = "null"), "\n", sep = "")
  flush.console()
}

render_request <- function(payload) {
  previous_options <- options(icarus.renderer.input = payload)
  on.exit(options(previous_options), add = TRUE)

  output <- capture.output(
    source(plot_script, local = new.env(parent = globalenv()), echo = FALSE)
  )
  rendered_output <- paste(output, collapse = "")
  marker_match <- regexec(
    "ICARUS_BASE64_BEGIN([A-Za-z0-9+/=[:space:]]+)ICARUS_BASE64_END",
    rendered_output
  )
  marker_parts <- regmatches(rendered_output, marker_match)[[1]]

  if (length(marker_parts) < 2) {
    stop("R renderer returned no valid image")
  }

  gsub("[[:space:]]", "", marker_parts[2])
}

emit_message(list(type = "ready"))
input_connection <- file("stdin", open = "r")

repeat {
  line <- readLines(con = input_connection, n = 1, warn = FALSE)
  if (length(line) == 0) break
  if (!nzchar(trimws(line))) next

  request_id <- NULL
  tryCatch(
    {
      request <- fromJSON(line, simplifyVector = FALSE)
      request_id <- request$id
      result <- render_request(request$payload)
      emit_message(list(id = request_id, ok = TRUE, result = result))
    },
    error = function(error) {
      while (dev.cur() > 1) {
        try(dev.off(), silent = TRUE)
      }
      emit_message(list(
        id = request_id,
        ok = FALSE,
        error = paste(class(error)[1], conditionMessage(error), sep = ": ")
      ))
    }
  )
}
