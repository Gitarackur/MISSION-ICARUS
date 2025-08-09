import React from 'react';
import {
  FileText,
  Calculator,
  TrendingUp,
  Database,
} from 'lucide-react';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
} from 'recharts';
import { tv } from 'tailwind-variants';
import { Stats } from '@/domain/proteins/index.types';

type StatisticsPanelProps = {
  stats: Stats;
  intensityDist: { sample: string; meanIntensity: number; count: number }[];
};

const styles = tv({
  slots: {
    container: 'space-y-6',
    grid: 'grid grid-cols-1 md:grid-cols-4 gap-6',
    card: 'bg-white rounded-lg shadow p-6',
    iconWrapper: 'p-3 rounded-full flex items-center justify-center',
    iconColor: 'w-6 h-6',
    title: 'text-sm font-medium text-gray-600',
    value: 'text-2xl font-bold text-gray-900',
    intensityTitle: 'text-lg font-semibold mb-4',
    intensityChartWrapper: 'h-64',
  },
  variants: {
    color: {
      blue: {
        iconWrapper: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      green: {
        iconWrapper: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      yellow: {
        iconWrapper: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
      },
      red: {
        iconWrapper: 'bg-red-100',
        iconColor: 'text-red-600',
      },
    },
  },
});




const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  stats,
  intensityDist,
}) => {
  const style = styles();

  const ColorIcon: React.FC<{
    color: 'blue' | 'green' | 'yellow' | 'red';
    Icon: React.ComponentType<{ className?: string }>;
  }> = ({ color, Icon }) => {
    const style = styles({ color });
    return (
      <div className={style.iconWrapper()}>
        <Icon className={style.iconColor()} />
      </div>
    );
  };

  if (!stats) return null;

  return (
    <div className={style.container()}>
      <div className={style.grid()}>
        {/* Total Proteins */}
        <div className={style.card()}>
          <div className="flex items-center">
            <ColorIcon color="blue" Icon={Database} />
            <div className="ml-4">
              <p className={style.title()}>Total Proteins</p>
              <p className={style.value()}>{stats.totalProteins}</p>
            </div>
          </div>
        </div>

        {/* Avg Intensity */}
        <div className={style.card()}>
          <div className="flex items-center">
            <ColorIcon color="green" Icon={TrendingUp} />
            <div className="ml-4">
              <p className={style.title()}>Avg Intensity</p>
              <p className={style.value()}>
                {stats.averageIntensity?.toExponential(2)}
              </p>
            </div>
          </div>
        </div>

        {/* CV */}
        <div className={style.card()}>
          <div className="flex items-center">
            <ColorIcon color="yellow" Icon={Calculator} />
            <div className="ml-4">
              <p className={style.title()}>CV</p>
              <p className={style.value()}>
                {(stats.coefficientOfVariation * 100)?.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Missing Values */}
        <div className={style.card()}>
          <div className="flex items-center">
            <ColorIcon color="red" Icon={FileText} />
            <div className="ml-4">
              <p className={style.title()}>Missing Values</p>
              <p className={style.value()}>{stats.missingValues}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={style.card()}>
        <h3 className={style.intensityTitle()}>Intensity Distribution</h3>
        <div className={style.intensityChartWrapper()}>
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={intensityDist}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sample" />
              <YAxis
                label={{ value: 'Mean Log10 Intensity', angle: -90, position: 'insideLeft' }}
              />
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
