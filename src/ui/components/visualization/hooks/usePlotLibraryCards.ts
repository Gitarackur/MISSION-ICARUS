import { PlotAxisSelection } from "@/domain/visualization/index.types";
import {
  VisualizationKind,
  VisualizationRenderer,
} from "@/domain/workflow/main.types";
import {
  PlotAvailabilityMap,
  PlotSelectionState,
  RenderJob,
} from "@/app-layer/visualization/types";
import { PlotLibraryCard } from "@/ui/components/visualization/types/index.types";

const getDisabledReason = (
  duplicate: boolean,
  availabilityReason?: string
) =>
  duplicate
    ? "Already created for this matrix with this renderer and axis selection."
    : availabilityReason;

export const usePlotLibraryCards = ({
  columnOptions,
  hasSavedVisualization,
  isRendering,
  plotAvailability,
  plotSelections,
  renderingJob,
  renderBarPlot,
  renderBoxPlot,
  renderHeatmap,
  renderMissingValuesPlot,
  renderPcaPlot,
  renderQcPlot,
  renderScatterPlot,
  renderVolcanoPlot,
  setPlotSelection,
}: {
  columnOptions: { allColumns: string[]; numericColumns: string[] };
  hasSavedVisualization: (
    visualizationType: VisualizationKind,
    renderer?: VisualizationRenderer,
    inputColumnNames?: string[]
  ) => boolean;
  isRendering: boolean;
  plotAvailability: PlotAvailabilityMap;
  plotSelections: PlotSelectionState;
  renderingJob: RenderJob | null;
  renderBarPlot: (renderer?: VisualizationRenderer) => void | Promise<void>;
  renderBoxPlot: (renderer?: VisualizationRenderer) => void | Promise<void>;
  renderHeatmap: (renderer?: VisualizationRenderer) => void | Promise<void>;
  renderMissingValuesPlot: (
    renderer?: VisualizationRenderer
  ) => void | Promise<void>;
  renderPcaPlot: (renderer?: VisualizationRenderer) => void | Promise<void>;
  renderQcPlot: (renderer?: VisualizationRenderer) => void | Promise<void>;
  renderScatterPlot: (renderer?: VisualizationRenderer) => void | Promise<void>;
  renderVolcanoPlot: (renderer?: VisualizationRenderer) => void | Promise<void>;
  setPlotSelection: (
    kind: keyof PlotSelectionState,
    selection: Partial<PlotAxisSelection>
  ) => void;
}) => {
  const barColumns = [
    plotSelections.bar.xAxis ?? "",
    ...(plotSelections.bar.yAxes ?? []),
  ].filter(Boolean);
  const boxColumns = plotSelections.box.yAxes ?? [];
  const scatterColumns = [
    plotSelections.scatter.xAxis ?? "",
    ...(plotSelections.scatter.yAxes ?? []),
  ].filter(Boolean);
  const heatmapColumns = plotSelections.heatmap.columns ?? [];
  const volcanoColumns = [
    plotSelections.volcano.xAxis ?? "",
    ...(plotSelections.volcano.yAxes ?? []),
  ].filter(Boolean);
  const qcColumns = plotSelections.qc.yAxes ?? [];
  const missingValueColumns = plotSelections["missing-values"].columns ?? [];
  const pcaColumns = plotSelections.pca.columns ?? [];

  const buildDuplicateState = (
    kind: VisualizationKind,
    renderer: VisualizationRenderer | undefined,
    columns: string[]
  ) => hasSavedVisualization(kind, renderer, columns);

  const cards: PlotLibraryCard[] = [
    {
      id: "bar",
      eyebrow: "Summary",
      title: "Bar Plot",
      description: "Plot one x-axis against one or more numeric series.",
      disabled:
        isRendering ||
        !plotAvailability.bar.ready ||
        buildDuplicateState("bar", plotSelections.bar.renderer, barColumns),
      disabledReason: getDisabledReason(
        buildDuplicateState("bar", plotSelections.bar.renderer, barColumns),
        plotAvailability.bar.reason
      ),
      onRender: () => renderBarPlot(plotSelections.bar.renderer ?? "python"),
      isLoading: renderingJob === "python-bar" || renderingJob === "r-bar",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.bar.renderer ?? "python",
      selection: plotSelections.bar,
      xAxisOptions: columnOptions.allColumns,
      yAxisOptions: columnOptions.numericColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer) => setPlotSelection("bar", { renderer }),
      onSelectionChange: (selection) => setPlotSelection("bar", selection),
    },
    {
      id: "box",
      eyebrow: "Distribution",
      title: "Box Plot",
      description: "Summarize spread and outliers across numeric columns.",
      disabled:
        isRendering ||
        !plotAvailability.box.ready ||
        buildDuplicateState("box", plotSelections.box.renderer, boxColumns),
      disabledReason: getDisabledReason(
        buildDuplicateState("box", plotSelections.box.renderer, boxColumns),
        plotAvailability.box.reason
      ),
      onRender: () => renderBoxPlot(plotSelections.box.renderer ?? "python"),
      isLoading: renderingJob === "box",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.box.renderer ?? "python",
      selection: plotSelections.box,
      yAxisOptions: columnOptions.numericColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer) => setPlotSelection("box", { renderer }),
      onSelectionChange: (selection) => setPlotSelection("box", selection),
    },
    {
      id: "scatter",
      eyebrow: "Relationship",
      title: "Scatter Plot",
      description: "Plot paired numeric values from the active matrix.",
      disabled:
        isRendering ||
        !plotAvailability.scatter.ready ||
        buildDuplicateState("scatter", plotSelections.scatter.renderer, scatterColumns),
      disabledReason: getDisabledReason(
        buildDuplicateState("scatter", plotSelections.scatter.renderer, scatterColumns),
        plotAvailability.scatter.reason
      ),
      onRender: () =>
        renderScatterPlot(plotSelections.scatter.renderer ?? "python"),
      isLoading: renderingJob === "scatter",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.scatter.renderer ?? "python",
      selection: plotSelections.scatter,
      xAxisOptions: columnOptions.numericColumns,
      yAxisOptions: columnOptions.numericColumns.filter(
        (column) => column !== plotSelections.scatter.xAxis
      ),
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer) => setPlotSelection("scatter", { renderer }),
      onSelectionChange: (selection) => setPlotSelection("scatter", selection),
    },
    {
      id: "heatmap",
      eyebrow: "Correlation",
      title: "Heatmap",
      description: "Create a correlation heatmap for the active matrix.",
      disabled:
        isRendering ||
        !plotAvailability.heatmap.ready ||
        buildDuplicateState("heatmap", plotSelections.heatmap.renderer, heatmapColumns),
      disabledReason: getDisabledReason(
        buildDuplicateState("heatmap", plotSelections.heatmap.renderer, heatmapColumns),
        plotAvailability.heatmap.reason
      ),
      onRender: () => renderHeatmap(plotSelections.heatmap.renderer ?? "python"),
      isLoading: renderingJob === "heatmap",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.heatmap.renderer ?? "python",
      selection: plotSelections.heatmap,
      yAxisOptions: columnOptions.numericColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer) => setPlotSelection("heatmap", { renderer }),
      onSelectionChange: (selection) => setPlotSelection("heatmap", selection),
    },
    {
      id: "volcano",
      eyebrow: "Significance",
      title: "Volcano Plot",
      description: "Visualize fold change against significance.",
      disabled:
        isRendering ||
        !plotAvailability.volcano.ready ||
        buildDuplicateState("volcano", plotSelections.volcano.renderer, volcanoColumns),
      disabledReason: getDisabledReason(
        buildDuplicateState("volcano", plotSelections.volcano.renderer, volcanoColumns),
        plotAvailability.volcano.reason
      ),
      onRender: () =>
        renderVolcanoPlot(plotSelections.volcano.renderer ?? "python"),
      isLoading: renderingJob === "volcano",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.volcano.renderer ?? "python",
      selection: plotSelections.volcano,
      xAxisOptions: columnOptions.numericColumns,
      yAxisOptions: columnOptions.numericColumns.filter(
        (column) => column !== plotSelections.volcano.xAxis
      ),
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer) => setPlotSelection("volcano", { renderer }),
      onSelectionChange: (selection) => setPlotSelection("volcano", selection),
    },
    {
      id: "qc",
      eyebrow: "Quality",
      title: "QC Plot",
      description: "Use box-plot style quality control across selected numeric columns.",
      disabled:
        isRendering ||
        !plotAvailability.qc.ready ||
        buildDuplicateState("qc", plotSelections.qc.renderer, qcColumns),
      disabledReason: getDisabledReason(
        buildDuplicateState("qc", plotSelections.qc.renderer, qcColumns),
        plotAvailability.qc.reason
      ),
      onRender: () => renderQcPlot(plotSelections.qc.renderer ?? "python"),
      isLoading: renderingJob === "qc",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.qc.renderer ?? "python",
      selection: plotSelections.qc,
      yAxisOptions: columnOptions.numericColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer) => setPlotSelection("qc", { renderer }),
      onSelectionChange: (selection) => setPlotSelection("qc", selection),
    },
    {
      id: "pca",
      eyebrow: "Dimensionality",
      title: "PCA Plot",
      description: "Project the active matrix into principal components.",
      disabled:
        isRendering ||
        !plotAvailability.pca.ready ||
        buildDuplicateState("pca", plotSelections.pca.renderer, pcaColumns),
      disabledReason: getDisabledReason(
        buildDuplicateState("pca", plotSelections.pca.renderer, pcaColumns),
        plotAvailability.pca.reason
      ),
      onRender: () => renderPcaPlot(plotSelections.pca.renderer ?? "python"),
      isLoading: renderingJob === "pca",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.pca.renderer ?? "python",
      selection: plotSelections.pca,
      yAxisOptions: columnOptions.numericColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer) => setPlotSelection("pca", { renderer }),
      onSelectionChange: (selection) => setPlotSelection("pca", selection),
    },
    {
      id: "missing-values",
      eyebrow: "Quality",
      title: "Missing Values Plot",
      description: "Visualize missing-value counts across selected columns.",
      disabled:
        isRendering ||
        !plotAvailability["missing-values"].ready ||
        buildDuplicateState(
          "missing-values",
          plotSelections["missing-values"].renderer,
          missingValueColumns
        ),
      disabledReason: getDisabledReason(
        buildDuplicateState(
          "missing-values",
          plotSelections["missing-values"].renderer,
          missingValueColumns
        ),
        plotAvailability["missing-values"].reason
      ),
      onRender: () =>
        renderMissingValuesPlot(
          plotSelections["missing-values"].renderer ?? "python"
        ),
      isLoading: renderingJob === "missing-values",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections["missing-values"].renderer ?? "python",
      selection: plotSelections["missing-values"],
      yAxisOptions: columnOptions.allColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer) =>
        setPlotSelection("missing-values", { renderer }),
      onSelectionChange: (selection) =>
        setPlotSelection("missing-values", selection),
    },
  ];

  return {
    plotActions: cards,
  };
};
