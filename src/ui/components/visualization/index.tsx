import React from "react";
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
// import VisualizationExternal from "./external";
import VisualizationTest from "@/tests/visualization-test";
import VisualizationTab from "@/ui/components/header/visualization-tab";
import { VisualizationPanelProps } from "./types/index.types";
import { visualizationStyles } from "./variants/visualization.variants";




const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  volcanoData,
}) => {
  const s = visualizationStyles();

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
          <h3 className={s.heading()}>Bar Plot</h3>
          <div className={s.plotContainer()}>
            <div className={s.placeholderBox()}>
              <p className={s.placeholderText()}>
                Bar Plots would be rendered here (placeholder)
              </p>
            </div>
          </div>
        </div>

        <div className={s.card()}>
          <h3 className={s.heading()}>Bar Plot</h3>
          <div className={s.plotContainer()}>
            <VisualizationTest />
          </div>
        </div>

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
