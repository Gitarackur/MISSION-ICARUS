import React from 'react';
import { tv } from 'tailwind-variants';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';
import ScatterTooltip from '@/ui/components/scatter/tooltip';

type VisualizationPanelProps = { 
  volcanoData: { x: number; y: number; protein: string; significant: boolean }[]; 
  intensityDist: { sample: string; meanIntensity: number; count: number }[] 
}

const container = tv({
  base: 'space-y-6',
});

const card = tv({
  base: 'bg-white rounded-lg shadow p-6',
});

const heading = tv({
  base: 'text-lg font-semibold mb-4',
});

const plotContainer = tv({
  base: 'h-80',
});

const placeholderBox = tv({
  base: 'bg-gray-100 h-64 rounded-lg flex items-center justify-center',
});

const placeholderText = tv({
  base: 'text-gray-500',
});

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({ volcanoData }) => {
  return (
    <div className={container()}>
      <div className={card()}>
        <h3 className={heading()}>Volcano Plot</h3>
        <div className={plotContainer()}>
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

      <div className={card()}>
        <h3 className={heading()}>Sample Correlation Heatmap</h3>
        <div className={placeholderBox()}>
          <p className={placeholderText()}>
            Correlation heatmap would be rendered here (placeholder)
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPanel;
