#!/usr/bin/env Rscript

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("No data argument provided")
}

suppressPackageStartupMessages({
  library(jsonlite)
  library(ggplot2)
})

`%||%` <- function(a, b) {
  if (is.null(a) || length(a) == 0 || identical(a, "")) b else a
}

input_arg <- args[1]

if (file.exists(input_arg)) {
  input <- fromJSON(input_arg, simplifyVector = FALSE)
} else {
  input <- fromJSON(input_arg, simplifyVector = FALSE)
}

plot_type <- input$plotType
payload <- input$payload

if (is.null(plot_type)) {
  plot_type <- "bar"
  payload <- list(
    categories = names(input),
    series = list(list(name = "Series", values = unname(input)))
  )
}

build_bar_plot <- function(data) {
  categories <- as.character(unlist(data$categories))

  frames <- lapply(data$series, function(series_item) {
    values <- as.numeric(unlist(series_item$values))

    data.frame(
      category = factor(categories, levels = categories),
      value = values,
      series = rep(series_item$name %||% "Series", length(values)),
      stringsAsFactors = FALSE
    )
  })

  df <- do.call(rbind, frames)

  ggplot(df, aes(x = category, y = value, fill = series)) +
    geom_col(position = position_dodge(width = 0.75), width = 0.65) +
    labs(
      title = data$title %||% "Bar Plot",
      x = data$xAxisLabel %||% "X Axis",
      y = data$yAxisLabel %||% "Y Axis"
    ) +
    theme_minimal(base_size = 12) +
    theme(axis.text.x = element_text(angle = 35, hjust = 1))
}

build_box_plot <- function(data) {
  frames <- lapply(data$series, function(series_item) {
    values <- as.numeric(unlist(series_item$values))

    data.frame(
      series = rep(series_item$name %||% "Series", length(values)),
      value = values,
      stringsAsFactors = FALSE
    )
  })

  df <- do.call(rbind, frames)

  ggplot(df, aes(x = series, y = value, fill = series)) +
    geom_boxplot(show.legend = FALSE) +
    labs(
      title = data$title %||% "Box Plot",
      x = "",
      y = data$yAxisLabel %||% "Values"
    ) +
    theme_minimal(base_size = 12) +
    theme(axis.text.x = element_text(angle = 35, hjust = 1))
}

build_scatter_plot <- function(data) {
  frames <- lapply(data$series, function(series_item) {
    x_values <- as.numeric(unlist(series_item$x))
    y_values <- as.numeric(unlist(series_item$y))

    data.frame(
      x = x_values,
      y = y_values,
      series = rep(series_item$name %||% "Series", length(x_values)),
      stringsAsFactors = FALSE
    )
  })

  df <- do.call(rbind, frames)

  ggplot(df, aes(x = x, y = y, color = series)) +
    geom_point(alpha = 0.7, size = 2.2) +
    labs(
      title = data$title %||% "Scatter Plot",
      x = data$xAxisLabel %||% "X Axis",
      y = data$yAxisLabel %||% "Y Axis"
    ) +
    theme_minimal(base_size = 12)
}

build_heatmap_plot <- function(data) {
  rows <- as.character(unlist(data$row_labels))
  cols <- as.character(unlist(data$col_labels))
  values <- do.call(rbind, lapply(data$matrix, function(row) as.numeric(unlist(row))))

  df <- expand.grid(row = rows, col = cols, stringsAsFactors = FALSE)
  df$value <- as.vector(values)

  ggplot(df, aes(x = col, y = row, fill = value)) +
    geom_tile() +
    scale_fill_gradient2(
      low = "#2563eb",
      mid = "#f8fafc",
      high = "#dc2626",
      midpoint = 0
    ) +
    labs(
      title = data$title %||% "Heatmap",
      x = "",
      y = ""
    ) +
    theme_minimal(base_size = 12) +
    theme(axis.text.x = element_text(angle = 45, hjust = 1))
}

build_volcano_plot <- function(data) {
  y <- as.numeric(unlist(data$y))

  if (!is.null(data$yTransform) && identical(data$yTransform, "negative-log10")) {
    y <- -log10(pmax(y, 1e-300))
  }

  df <- data.frame(
    x = as.numeric(unlist(data$x)),
    y = y,
    stringsAsFactors = FALSE
  )

  plot_obj <- ggplot(df, aes(x = x, y = y)) +
    geom_point(alpha = 0.7, color = "#2563eb", size = 2.2) +
    labs(
      title = data$title %||% "Volcano Plot",
      x = data$xAxisLabel %||% "X Axis",
      y = data$yAxisLabel %||% "Y Axis"
    ) +
    theme_minimal(base_size = 12)

  if (!is.null(data$xThreshold)) {
    plot_obj <- plot_obj +
      geom_vline(
        xintercept = c(-as.numeric(data$xThreshold), as.numeric(data$xThreshold)),
        linetype = "dashed",
        color = "black",
        alpha = 0.5
      )
  }

  if (!is.null(data$yThreshold)) {
    threshold_y <- as.numeric(data$yThreshold)

    if (!is.null(data$yTransform) && identical(data$yTransform, "negative-log10")) {
      threshold_y <- -log10(max(threshold_y, 1e-300))
    }

    plot_obj <- plot_obj +
      geom_hline(
        yintercept = threshold_y,
        linetype = "dashed",
        color = "black",
        alpha = 0.5
      )
  }

  plot_obj
}

build_pca_plot <- function(data) {
  df <- data.frame(
    x = vapply(data$data, function(row) as.numeric(row[[1]]), numeric(1)),
    y = vapply(data$data, function(row) as.numeric(row[[2]]), numeric(1)),
    group = if (!is.null(data$groups)) as.character(unlist(data$groups)) else "PCA",
    stringsAsFactors = FALSE
  )

  ggplot(df, aes(x = x, y = y, color = group)) +
    geom_point(alpha = 0.75, size = 2.5) +
    labs(
      title = data$title %||% "PCA Plot",
      x = "PC1",
      y = "PC2"
    ) +
    theme_minimal(base_size = 12)
}

plot_obj <- switch(
  plot_type,
  bar = build_bar_plot(payload),
  box = build_box_plot(payload),
  scatter = build_scatter_plot(payload),
  heatmap = build_heatmap_plot(payload),
  volcano = build_volcano_plot(payload),
  pca = build_pca_plot(payload),
  stop(sprintf("Unsupported R plot type: %s", plot_type))
)

output_file <- tempfile(pattern = "icarus-plot-", fileext = ".png")
output_dir <- dirname(output_file)

dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)

if (!dir.exists(output_dir)) {
  stop(sprintf("Output directory does not exist: %s", output_dir))
}

if (file.access(output_dir, 2) != 0) {
  stop(sprintf("Output directory is not writable: %s", output_dir))
}

png(
  filename = output_file,
  width = 1000,
  height = 800,
  type = "cairo"
)

print(plot_obj)

dev_result <- tryCatch(
  {
    invisible(dev.off())
    TRUE
  },
  error = function(e) {
    stop(sprintf("Failed to close PNG device: %s", conditionMessage(e)), call. = FALSE)
  }
)

if (!file.exists(output_file)) {
  stop(sprintf("Plot file was not created: %s", output_file))
}

file_size <- file.info(output_file)$size

if (is.na(file_size) || file_size <= 0) {
  stop(sprintf("Plot file is empty: %s", output_file))
}

img_data <- readBin(output_file, what = "raw", n = file_size)

unlink(output_file, force = TRUE)

cat("ICARUS_BASE64_BEGIN", sep = "")
cat(jsonlite::base64_enc(img_data), sep = "")
cat("ICARUS_BASE64_END", sep = "")