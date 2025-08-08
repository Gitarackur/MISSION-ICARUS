import React from 'react';
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

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({ volcanoData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Volcano Plot</h3>
        <div className="h-80">
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

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Sample Correlation Heatmap</h3>
        <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Correlation heatmap would be rendered here (placeholder)</p>
        </div>
      </div>
    </div>
  );
};


export default VisualizationPanel;
