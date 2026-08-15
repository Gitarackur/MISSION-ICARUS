import type { NativeVisualizationRendererProps } from "../types/index.types";
import { NativeChart } from "./native-chart";

export function NativeVisualizationRenderer({
  alt,
  className,
  imageSource,
  model,
  settings,
}: NativeVisualizationRendererProps) {
  if (model) {
    return (
      <NativeChart
        className={className}
        content={{
          type: "chart",
          categoryKey: model.categoryKey,
          data: model.data,
          kind: model.kind,
          series: model.series,
          settings,
        }}
      />
    );
  }

  if (!imageSource) return null;

  return (
    <NativeChart
      className={className}
      content={{ type: "image", alt, source: imageSource }}
    />
  );
}
