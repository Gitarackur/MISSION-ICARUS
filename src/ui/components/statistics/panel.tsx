import React from 'react';
import {
  FileText,
  Calculator,
  TrendingUp,
  Database
} from 'lucide-react';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar
} from 'recharts';
import { tv } from 'tailwind-variants';
import { Stats } from '@/domain/proteins/index.types';

type StatisticsPanelProps = { 
  stats: Stats; 
  intensityDist: { sample: string; meanIntensity: number; count: number }[] 
}

// Base card style variant
const card = tv({
  base: 'bg-white rounded-lg shadow p-6',
});

// Icon container styles by color variant
const iconWrapper = tv({
  base: 'p-3 rounded-full',
  variants: {
    color: {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      yellow: 'bg-yellow-100',
      red: 'bg-red-100',
    },
  },
});

// Icon color variants
const iconColor = tv({
  variants: {
    color: {
      blue: 'text-blue-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600',
    },
  },
});

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ stats, intensityDist }) => {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Proteins */}
        <div className={card()}>
          <div className="flex items-center">
            <div className={iconWrapper({ color: 'blue' })}>
              <Database className={iconColor({ color: 'blue' })} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Proteins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProteins}</p>
            </div>
          </div>
        </div>

        {/* Avg Intensity */}
        <div className={card()}>
          <div className="flex items-center">
            <div className={iconWrapper({ color: 'green' })}>
              <TrendingUp className={iconColor({ color: 'green' })} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Intensity</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageIntensity?.toExponential(2)}
              </p>
            </div>
          </div>
        </div>

        {/* CV */}
        <div className={card()}>
          <div className="flex items-center">
            <div className={iconWrapper({ color: 'yellow' })}>
              <Calculator className={iconColor({ color: 'yellow' })} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CV</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.coefficientOfVariation * 100)?.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Missing Values */}
        <div className={card()}>
          <div className="flex items-center">
            <div className={iconWrapper({ color: 'red' })}>
              <FileText className={iconColor({ color: 'red' })} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Missing Values</p>
              <p className="text-2xl font-bold text-gray-900">{stats.missingValues}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={card()}>
        <h3 className="text-lg font-semibold mb-4">Intensity Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={intensityDist}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sample" />
              <YAxis label={{ value: 'Mean Log10 Intensity', angle: -90, position: 'insideLeft' }} />
              <RechartsTooltip />
              <Bar dataKey="meanIntensity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
