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
import { Stats } from '@/domain/proteins/index.types';
import { statisticsStyles } from '../style-variants';
import StatisticsEmptyState from './empty-state';



type StatisticsPanelProps = {
  stats?: Stats;
  intensityDist?: { sample: string; meanIntensity: number; count: number }[];
};



const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  stats,
  intensityDist,
}) => {
  const style = statisticsStyles();

  const ColorIcon: React.FC<{
    color: 'blue' | 'green' | 'yellow' | 'red';
    Icon: React.ComponentType<{ className?: string }>;
  }> = ({ color, Icon }) => {
    const style = statisticsStyles({ color });
    return (
      <div className={style.iconWrapper()}>
        <Icon className={style.iconColor()} />
      </div>
    );
  };

  // Empty state
  // !stats || !intensityDist || intensityDist.length === 0
  if (!stats || stats === null || !intensityDist || intensityDist.length === 0) {
    return (
      <StatisticsEmptyState />
    );
  }

  console.log(stats, intensityDist)

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

      {/* Chart */}
      <div className={style.card()}>
        <h3 className={style.intensityTitle()}>Intensity Distribution</h3>
        <div className={style.intensityChartWrapper()}>
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={intensityDist}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sample" tick={{ fontSize: 12 }} />
              <YAxis
                label={{
                  value: 'Mean Log10 Intensity',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 12,
                }}
              />
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="meanIntensity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
