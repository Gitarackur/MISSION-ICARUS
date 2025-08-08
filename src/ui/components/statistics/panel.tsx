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
import { Stats } from '@/domain/proteins/index.types';


const StatisticsPanel: React.FC<{ stats: Stats; intensityDist: { sample: string; meanIntensity: number; count: number }[] }> = ({ stats, intensityDist }) => {
  if (!stats) return null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Proteins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProteins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Intensity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageIntensity.toExponential(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calculator className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CV</p>
              <p className="text-2xl font-bold text-gray-900">{(stats.coefficientOfVariation * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Missing Values</p>
              <p className="text-2xl font-bold text-gray-900">{stats.missingValues}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
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