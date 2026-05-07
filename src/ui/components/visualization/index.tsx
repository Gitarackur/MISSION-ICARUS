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
  buildIntensityBarPayload,
  invokePythonBarPlot,
  invokeRBarPlot,
} from "./model";




const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  volcanoData,
  intensityDist,
}) => {
  const s = visualizationStyles();
  const [pythonImage, setPythonImage] = useState<string | null>(null);
  const [rImage, setRImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const intensityPayload = useMemo(
    () => buildIntensityBarPayload(intensityDist),
    [intensityDist]
  );

  const renderPythonPlot = useCallback(async () => {
    try {
      setError(null);
      setPythonImage(await invokePythonBarPlot(intensityPayload));
    } catch (err) {
      setError(`Python visualization failed: ${(err as Error).message || err}`);
    }
  }, [intensityPayload]);

  const renderRPlot = useCallback(async () => {
    try {
      setError(null);
      setRImage(await invokeRBarPlot(intensityPayload));
    } catch (err) {
      setError(`R visualization failed: ${(err as Error).message || err}`);
    }
  }, [intensityPayload]);

  return (
    <div>
      <VisualizationTab
        visualizations={[]}
        activeVisualizationId={""}
        setActiveVisualizationId={function (): void {
          throw new Error("Function not implemented.");
        }}
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
          <h3 className={s.heading()}>Python Intensity Plot</h3>
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
          <h3 className={s.heading()}>R Intensity Plot</h3>
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
