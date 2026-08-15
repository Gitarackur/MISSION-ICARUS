import type { PlotAxisSelection } from "@/domain/visualization/index.types";
import type { VisualizationRenderer } from "@/domain/workflow/main.types";

export const getVisualizationRendererLabel = (
  renderer: VisualizationRenderer
) =>
  renderer === "recharts"
    ? "Native"
    : renderer === "fsharp"
      ? "F#"
      : renderer.toUpperCase();

export const toVisualizationSelectOptions = (values?: string[]) =>
  (values ?? []).map((value) => ({ value, label: value }));

export const getPlotDisabledReason = (
  duplicate: boolean,
  availabilityReason?: string
) =>
  duplicate
    ? "Already created for this matrix with this renderer and axis selection."
    : availabilityReason;

export const getSelectedXAxisColumns = (selection: PlotAxisSelection) =>
  selection.xAxes?.length
    ? selection.xAxes
    : selection.xAxis
      ? [selection.xAxis]
      : [];

export const getSelectedLabelColumns = (selection: PlotAxisSelection) =>
  selection.labelAxes?.length
    ? selection.labelAxes
    : selection.labelAxis
      ? [selection.labelAxis]
      : [];
