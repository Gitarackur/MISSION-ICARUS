import React from "react";
import { tv } from "tailwind-variants";
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

type VisualizationPanelProps = {
  volcanoData: {
    x: number;
    y: number;
    protein: string;
    significant: boolean;
  }[];
  intensityDist: { sample: string; meanIntensity: number; count: number }[];
};

const styles = tv({
  slots: {
    container: "space-y-6",
    card: "bg-white rounded-lg shadow p-6",
    heading: "text-lg font-semibold mb-4",
    plotContainer: "",
    placeholderBox:
      "bg-gray-100 h-64 rounded-lg flex items-center justify-center",
    placeholderText: "text-gray-500",
  },
});

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  volcanoData,
}) => {
  const s = styles();

  return (
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
  );
};

export default VisualizationPanel;
