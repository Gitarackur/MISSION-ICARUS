#!/usr/bin/env Rscript

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("No data argument provided")
}

library(jsonlite)

data_arg <- args[1]

if (file.exists(data_arg)) {
  data <- fromJSON(data_arg)
} else {
  data <- fromJSON(data_arg)
}

# Suppress any messages, warnings, and output during plotting
suppressMessages({
  suppressWarnings({
    invisible(capture.output({
      png(filename = "plot.png", width = 600, height = 400)
      barplot(unlist(data), names.arg = names(data), main = "R Bar Chart")
      dev.off()
    }))
  })
})

# Read image file as raw vector
img_data <- readBin("plot.png", what = "raw", n = file.info("plot.png")$size)

unlink("plot.png")

# Print ONLY the base64 string with no extra whitespace or newline
cat(jsonlite::base64_enc(img_data), sep = "")
