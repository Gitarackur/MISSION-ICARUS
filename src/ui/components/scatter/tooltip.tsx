import React from 'react';
import { TooltipProps } from 'recharts';
import { tv } from 'tailwind-variants';

type PayloadData = {
  protein: string;
  x: number;
  y: number;
};

interface ScatterTooltipProps extends TooltipProps<number, string> {
  payload?: {
    payload: PayloadData;
  }[];
}

const styles = tv({
  slots: {
    container: 'bg-white p-3 border border-gray-300 rounded shadow',
    proteinName: 'font-medium',
    statText: '',
  },
});

const ScatterTooltip: React.FC<ScatterTooltipProps> = ({ active, payload }) => {
  const s = styles();

  if (!(active && payload && payload.length)) return null;

  const d = payload[0].payload;

  return (
    <div className={s.container()}>
      <p className={s.proteinName()}>{d.protein}</p>
      <p className={s.statText()}>Log2 FC: {d.x.toFixed(2)}</p>
      <p className={s.statText()}>-Log10 p: {d.y.toFixed(2)}</p>
    </div>
  );
};

export default ScatterTooltip;
