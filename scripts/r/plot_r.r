args <- commandArgs(trailingOnly=TRUE)
library(jsonlite)
library(ggplot2)
library(base64enc)

data_file <- args[1]
data <- fromJSON(data_file)

df <- data.frame(
  label = names(data),
  value = as.numeric(unlist(data))
)

p <- ggplot(df, aes(x=label, y=value)) +
  geom_bar(stat="identity", fill="steelblue") +
  ggtitle("R Bar Chart") +
  theme_minimal()

# Save to a temp PNG file
tmp_png <- tempfile(fileext=".png")
ggsave(tmp_png, plot=p, width=6, height=4, units="in")

# Encode PNG to base64 and print to stdout
img_base64 <- base64enc::base64encode(tmp_png)
cat(img_base64)
