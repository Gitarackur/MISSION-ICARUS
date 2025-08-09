#!/usr/bin/env Rscript

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("No data argument provided")
}

library(jsonlite)

data_arg <- args[1]

# If the arg is a path to an existing file, read from file
if (file.exists(data_arg)) {
  data <- fromJSON(data_arg)
} else {
  # Otherwise, assume it's JSON text
  data <- fromJSON(data_arg)
}

# Basic bar plot
png(filename = "plot.png", width = 600, height = 400)
barplot(
  unlist(data),
  names.arg = names(data),
  main = "R Bar Chart"
)
dev.off()

# Read image as raw binary
img_data <- readBin("plot.png", what = "raw", n = file.info("plot.png")$size)
unlink("plot.png") # cleanup

# Output base64 string with no extra whitespace or newlines
cat(jsonlite::base64_enc(img_data), sep = "")
