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

input_arg <- getOption("icarus.renderer.input", args[1])

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

display_settings <- payload$displaySettings %||% list()

setting_number <- function(name, default, minimum, maximum) {
  value <- suppressWarnings(as.numeric(display_settings[[name]] %||% default)[1])
  if (is.na(value)) value <- default
  min(maximum, max(minimum, value))
}

plot_width <- setting_number("plotWidth", 1000, 640, 2400)
plot_height <- setting_number("plotHeight", 800, 400, 1800)
max_x_ticks <- as.integer(setting_number("maxXTicks", 12, 2, 30))
max_y_ticks <- as.integer(setting_number("maxYTicks", 8, 2, 20))
x_label_length <- as.integer(setting_number("xMaxLabelLength", 16, 4, 60))
y_label_length <- as.integer(setting_number("yMaxLabelLength", 12, 4, 40))
auto_rotate_x_labels <- isTRUE(display_settings$autoRotateXLabels %||% TRUE)
x_tick_angle <- setting_number("xTickAngle", 0, -90, 90)
y_tick_angle <- setting_number("yTickAngle", 0, -90, 90)
tick_font_size <- setting_number("tickFontSize", 10, 6, 24)
axis_label_font_size <- setting_number("axisLabelFontSize", 12, 8, 32)
point_size <- setting_number("pointSize", 4, 1, 16)
show_grid <- isTRUE(display_settings$showGrid %||% TRUE)
plot_colors <- as.character(unlist(display_settings$plotColors %||% c(
  "#2563eb", "#7c3aed", "#db2777", "#059669", "#ea580c", "#0891b2"
)))

if (length(plot_colors) == 0) {
  plot_colors <- c("#2563eb", "#7c3aed", "#db2777", "#059669", "#ea580c", "#0891b2")
}

truncate_label <- function(value, max_length) {
  value <- as.character(value)
  if (nchar(value) <= max_length) value else paste0(substr(value, 1, max(3, max_length - 1)), "…")
}

sample_breaks <- function(values, max_ticks) {
  values <- unique(as.character(values))
  if (length(values) <= max_ticks) return(values)
  indices <- unique(c(seq(1, length(values), by = ceiling(length(values) / max_ticks)), length(values)))
  values[indices]
}

axis_label <- function(name, fallback) {
  display_settings[[name]] %||% fallback
}

resolve_x_tick_angle <- function(labels = NULL) {
  if (!auto_rotate_x_labels) return(x_tick_angle)
  if (is.null(labels) || length(labels) <= 1) return(0)

  displayed_labels <- vapply(
    as.character(labels),
    truncate_label,
    character(1),
    max_length = x_label_length
  )
  widest_label <- max(nchar(displayed_labels)) * tick_font_size * 1.05
  label_height <- tick_font_size * 2
  available_width <- max(16, (plot_width - 160) / max(1, length(displayed_labels) - 1) - 8)

  for (angle in c(0, 30, 45, 60)) {
    radians <- abs(angle) * pi / 180
    projected_width <- widest_label * cos(radians) + label_height * sin(radians)
    if (projected_width <= available_width) return(angle)
  }

  60
}

plot_theme <- function(x_labels = NULL) {
  effective_x_tick_angle <- resolve_x_tick_angle(x_labels)
  grid_theme <- if (show_grid) {
    theme(panel.grid.major = element_line(color = "#e5e7eb", linewidth = 0.35))
  } else {
    theme(panel.grid = element_blank())
  }

  theme_minimal(base_size = tick_font_size) +
    theme(
      axis.text.x = element_text(
        angle = effective_x_tick_angle,
        hjust = if (effective_x_tick_angle == 0) 0.5 else 1
      ),
      axis.text.y = element_text(angle = y_tick_angle, hjust = 1),
      axis.title = element_text(size = axis_label_font_size),
      legend.position = "bottom",
      legend.box = "horizontal",
      legend.text = element_text(size = tick_font_size)
    ) +
    grid_theme
}

build_bar_plot <- function(data) {
  categories <- as.character(unlist(data$categories))
  breaks <- sample_breaks(categories, max_x_ticks)

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
    scale_x_discrete(
      breaks = breaks,
      labels = function(values) vapply(values, truncate_label, character(1), max_length = x_label_length)
    ) +
    scale_y_continuous(n.breaks = max_y_ticks) +
    scale_fill_manual(values = rep(plot_colors, length.out = length(unique(df$series)))) +
    labs(
      title = data$title %||% "Bar Plot",
      x = axis_label("xAxisLabel", data$xAxisLabel %||% "X Axis"),
      y = axis_label("yAxisLabel", data$yAxisLabel %||% "Y Axis")
    ) +
    plot_theme(breaks)
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
  breaks <- sample_breaks(unique(df$series), max_x_ticks)

  ggplot(df, aes(x = series, y = value, fill = series)) +
    geom_boxplot(show.legend = FALSE) +
    scale_x_discrete(
      breaks = breaks,
      labels = function(values) vapply(values, truncate_label, character(1), max_length = x_label_length)
    ) +
    scale_y_continuous(n.breaks = max_y_ticks) +
    scale_fill_manual(values = rep(plot_colors, length.out = length(unique(df$series)))) +
    labs(
      title = data$title %||% "Box Plot",
      x = axis_label("xAxisLabel", data$xAxisLabel %||% "Columns"),
      y = axis_label("yAxisLabel", data$yAxisLabel %||% "Values")
    ) +
    plot_theme(breaks)
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
    geom_point(alpha = 0.7, size = point_size) +
    scale_x_continuous(n.breaks = max_x_ticks) +
    scale_y_continuous(n.breaks = max_y_ticks) +
    scale_color_manual(values = rep(plot_colors, length.out = length(unique(df$series)))) +
    labs(
      title = data$title %||% "Scatter Plot",
      x = axis_label("xAxisLabel", data$xAxisLabel %||% "X Axis"),
      y = axis_label("yAxisLabel", data$yAxisLabel %||% "Y Axis")
    ) +
    plot_theme()
}

build_heatmap_plot <- function(data) {
  rows <- as.character(unlist(data$row_labels))
  cols <- as.character(unlist(data$col_labels))
  values <- do.call(rbind, lapply(data$matrix, function(row) as.numeric(unlist(row))))

  df <- expand.grid(row = rows, col = cols, stringsAsFactors = FALSE)
  df$value <- as.vector(values)
  df$row <- factor(df$row, levels = rev(rows))
  df$col <- factor(df$col, levels = cols)
  x_breaks <- sample_breaks(cols, max_x_ticks)
  y_breaks <- sample_breaks(rows, max_y_ticks)

  ggplot(df, aes(x = col, y = row, fill = value)) +
    geom_tile() +
    scale_fill_gradient2(
      low = plot_colors[1],
      mid = "#f8fafc",
      high = plot_colors[(2 %% length(plot_colors)) + 1],
      midpoint = 0
    ) +
    scale_x_discrete(
      breaks = x_breaks,
      labels = function(items) vapply(items, truncate_label, character(1), max_length = x_label_length)
    ) +
    scale_y_discrete(
      breaks = y_breaks,
      labels = function(items) vapply(items, truncate_label, character(1), max_length = y_label_length)
    ) +
    labs(
      title = data$title %||% "Heatmap",
      x = axis_label("xAxisLabel", data$xAxisLabel %||% "Columns"),
      y = axis_label("yAxisLabel", data$yAxisLabel %||% "Rows")
    ) +
    plot_theme(x_breaks)
}

build_volcano_plot <- function(data) {
  x <- as.numeric(unlist(data$x))
  y <- as.numeric(unlist(data$y))

  if (!is.null(data$yTransform) && identical(data$yTransform, "negative-log10")) {
    y <- -log10(pmax(y, 1e-300))
  }

  x_threshold <- as.numeric(data$xThreshold %||% 1)
  threshold_y <- NULL

  if (!is.null(data$yThreshold)) {
    threshold_y <- as.numeric(data$yThreshold)

    if (!is.null(data$yTransform) && identical(data$yTransform, "negative-log10")) {
      threshold_y <- -log10(max(threshold_y, 1e-300))
    }
  }

  passes_y_threshold <- if (is.null(threshold_y)) rep(TRUE, length(y)) else y > threshold_y
  category <- rep("not_significant", length(x))
  category[x > x_threshold & passes_y_threshold] <- "positive"
  category[x < -x_threshold & passes_y_threshold] <- "negative"

  legend_labels <- data$legendLabels %||% list()
  legend_label <- function(value, fallback) {
    normalized <- trimws(as.character(value %||% "")[1])
    if (nchar(normalized) > 0) normalized else fallback
  }
  category_labels <- c(
    not_significant = legend_label(legend_labels$notSignificant, "Not significant"),
    positive = legend_label(legend_labels$positive, "Above + threshold"),
    negative = legend_label(legend_labels$negative, "Below − threshold")
  )

  df <- data.frame(
    x = x,
    y = y,
    category = factor(category, levels = names(category_labels)),
    stringsAsFactors = FALSE
  )

  plot_obj <- ggplot(df, aes(x = x, y = y, color = category)) +
    geom_point(alpha = 0.7, size = point_size) +
    scale_x_continuous(n.breaks = max_x_ticks) +
    scale_y_continuous(n.breaks = max_y_ticks) +
    scale_color_manual(
      values = c(
        not_significant = plot_colors[(4 %% length(plot_colors)) + 1],
        positive = plot_colors[(2 %% length(plot_colors)) + 1],
        negative = plot_colors[1]
      ),
      breaks = names(category_labels),
      labels = unname(category_labels),
      drop = FALSE
    ) +
    labs(
      title = data$title %||% "Volcano Plot",
      x = axis_label("xAxisLabel", data$xAxisLabel %||% "X Axis"),
      y = axis_label("yAxisLabel", data$yAxisLabel %||% "Y Axis"),
      color = NULL
    ) +
    plot_theme()

  if (!is.null(data$xThreshold)) {
    plot_obj <- plot_obj +
      geom_vline(
        xintercept = c(-as.numeric(data$xThreshold), as.numeric(data$xThreshold)),
        linetype = "dashed",
        color = "black",
        alpha = 0.5
      )
  }

  if (!is.null(threshold_y)) {
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
  # Raw feature matrix (rows = samples, columns = features) is provided by the
  # app; PCA must be computed here (as Python with sklearn and F# with
  # FSharp.Stats do) instead of plotting raw columns directly.
  features <- do.call(rbind, lapply(data$data, function(row) as.numeric(unlist(row))))

  if (is.null(features) || nrow(features) < 2 || ncol(features) < 2) {
    stop("PCA plot needs at least 2 rows and 2 numeric columns")
  }

  n_components <- as.integer(data$n_components %||% 2)

  pca <- prcomp(features, center = TRUE, scale. = FALSE)
  components <- pca$x[, seq_len(n_components), drop = FALSE]

  variance_ratio <- pca$sdev^2 / sum(pca$sdev^2)
  variance_ratio <- variance_ratio[seq_len(n_components)]

  group <- if (!is.null(data$groups)) as.character(unlist(data$groups)) else rep("PCA", nrow(components))

  df <- data.frame(
    x = components[, 1],
    y = components[, 2],
    group = group,
    stringsAsFactors = FALSE
  )

  x_label <- sprintf("PC1 (%.2f%% variance)", variance_ratio[1] * 100)
  y_label <- sprintf("PC2 (%.2f%% variance)", variance_ratio[2] * 100)

  ggplot(df, aes(x = x, y = y, color = group)) +
    geom_point(alpha = 0.75, size = point_size) +
    scale_x_continuous(n.breaks = max_x_ticks) +
    scale_y_continuous(n.breaks = max_y_ticks) +
    scale_color_manual(values = rep(plot_colors, length.out = length(unique(df$group)))) +
    labs(
      title = data$title %||% "PCA Plot",
      x = axis_label("xAxisLabel", x_label),
      y = axis_label("yAxisLabel", y_label)
    ) +
    plot_theme()
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

open_plot_device <- function(filename, width = 1000, height = 800) {
  if (requireNamespace("ragg", quietly = TRUE)) {
    ragg::agg_png(
      filename = filename,
      width = width,
      height = height,
      units = "px",
      res = 144,
      scaling = 1
    )
    return("ragg")
  }

  png_type <- "cairo"

  if (.Platform$OS.type == "unix" && Sys.info()[["sysname"]] == "Darwin") {
    png_type <- "quartz"
  }

  grDevices::png(
    filename = filename,
    width = width,
    height = height,
    type = png_type
  )

  png_type
}

output_file <- tempfile(pattern = "icarus-plot-", fileext = ".png")
output_dir <- dirname(output_file)

dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)

if (!dir.exists(output_dir)) {
  stop(sprintf("Output directory does not exist: %s", output_dir))
}

if (file.access(output_dir, 2) != 0) {
  stop(sprintf("Output directory is not writable: %s", output_dir))
}

device_used <- open_plot_device(
  filename = output_file,
  width = plot_width,
  height = plot_height
)

print(plot_obj)

dev_result <- tryCatch(
  {
    invisible(dev.off())
    TRUE
  },
  error = function(e) {
    stop(
      sprintf(
        "Failed to close %s plot device: %s",
        device_used,
        conditionMessage(e)
      ),
      call. = FALSE
    )
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
