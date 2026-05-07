import React, { useCallback, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import ScatterTooltip from "@/ui/components/scatter/tooltip";
import VisualizationTab from "@/ui/components/header/visualization-tab";
import { VisualizationPanelProps } from "./types/index.types";
import { visualizationStyles } from "./variants/visualization.variants";
import {
  buildMatrixBarPayload,
  buildIntensityBarPayload,
  invokePythonBarPlot,
  invokeRBarPlot,
} from "./model";




const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  volcanoData,
  intensityDist,
  activeSession,
  activeMatrix,
  saveVisualizationInWorkflow,
}) => {
  const s = visualizationStyles();
  const [pythonImage, setPythonImage] = useState<string | null>(null);
  const [rImage, setRImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeVisualizationId, setActiveVisualizationId] = useState("");

  const intensityPayload = useMemo(
    () =>
      activeMatrix
        ? buildMatrixBarPayload(activeMatrix)
        : buildIntensityBarPayload(intensityDist),
    [activeMatrix, intensityDist]
  );

  const visualizationTitle = activeMatrix
    ? `${activeMatrix.columns.join(", ")} summary`
    : "Sample intensity distribution";

  const saveRenderedVisualization = useCallback(
    async (renderer: "python" | "r", image: string) => {
      if (!activeSession || !activeMatrix || !saveVisualizationInWorkflow) {
        return;
      }

      await saveVisualizationInWorkflow({
        sourceMatrixId: activeMatrix.id,
        inputMatrixReferences: activeMatrix.id,
        inputColumnNames: activeMatrix.columns,
        renderer,
        visualizationType: "bar",
        title: visualizationTitle,
        data: {
          image,
          payload: intensityPayload,
          matrixId: activeMatrix.id,
          columns: activeMatrix.columns,
        },
        outputMetrics: {
          pointCount: Object.keys(intensityPayload).length,
        },
      });
    },
    [
      activeMatrix,
      activeSession,
      intensityPayload,
      saveVisualizationInWorkflow,
      visualizationTitle,
    ]
  );

  const renderPythonPlot = useCallback(async () => {
    try {
      setError(null);
      const image = await invokePythonBarPlot(intensityPayload);
      setPythonImage(image);
      await saveRenderedVisualization("python", image);
    } catch (err) {
      setError(`Python visualization failed: ${(err as Error).message || err}`);
    }
  }, [intensityPayload, saveRenderedVisualization]);

  const renderRPlot = useCallback(async () => {
    try {
      setError(null);
      const image = await invokeRBarPlot(intensityPayload);
      setRImage(image);
      await saveRenderedVisualization("r", image);
    } catch (err) {
      setError(`R visualization failed: ${(err as Error).message || err}`);
    }
  }, [intensityPayload, saveRenderedVisualization]);

  return (
    <div>
      <VisualizationTab
        visualizations={activeSession?.visualizations ?? []}
        activeVisualizationId={activeVisualizationId}
        setActiveVisualizationId={setActiveVisualizationId}
      />

      <div className={s.container()}>
        <div className={s.card()}>
          <h3 className={s.heading()}>Volcano Plot</h3>
          <div className={s.plotContainer()}>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name="Log2 Fold Change" />
                <YAxis dataKey="y" name="-Log10 p-value" />
                <RechartsTooltip content={<ScatterTooltip />} />
                <Scatter data={volcanoData} fill="#6B7280" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={s.card()}>
          <h3 className={s.heading()}>Python Matrix Plot</h3>
          <div className={s.plotContainer()}>
            {pythonImage ? (
              <img
                src={pythonImage}
                alt="Python intensity visualization"
                className="h-full w-full object-contain"
              />
            ) : (
              <button className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white" onClick={renderPythonPlot}>
                Render Python Plot
              </button>
            )}
          </div>
        </div>

        <div className={s.card()}>
          <h3 className={s.heading()}>R Matrix Plot</h3>
          <div className={s.plotContainer()}>
            {rImage ? (
              <img
                src={rImage}
                alt="R intensity visualization"
                className="h-full w-full object-contain"
              />
            ) : (
              <button className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white" onClick={renderRPlot}>
                Render R Plot
              </button>
            )}
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className={s.card()}>
          <h3 className={s.heading()}>Sample Correlation Heatmap</h3>
          <div className={s.placeholderBox()}>
            <p className={s.placeholderText()}>
              Correlation heatmap would be rendered here (placeholder)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPanel;
