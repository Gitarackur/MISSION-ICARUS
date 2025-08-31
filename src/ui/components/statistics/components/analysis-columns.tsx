import { tv } from "tailwind-variants";
import { ColumnStats } from "@/domain/statistics/index.types";


const statisticalAnalysisColumns = tv({
  slots: {
    container: "mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm",
    grid: "grid grid-cols-2 md:grid-cols-4 gap-4",
    item: "bg-gray-50 p-3 rounded",
    label: "text-sm text-gray-600",
    value: "text-lg font-semibold text-gray-800",
  },
});

const { container, grid, item, label, value } = statisticalAnalysisColumns();

const StatisticalAnalysisColumns = ({
  stats
}: {
  stats: ColumnStats;
}) => {
  return (
    <div className={container()}>
      <div className={grid()}>
        <div className={item()}>
          <div className={label()}>Mean</div>
          <div className={value()}>{stats.mean.toFixed(3)}</div>
        </div>
        <div className={item()}>
          <div className={label()}>Median</div>
          <div className={value()}>{stats.median.toFixed(3)}</div>
        </div>
        <div className={item()}>
          <div className={label()}>Std Dev</div>
          <div className={value()}>{stats.standardDeviation.toFixed(3)}</div>
        </div>
        <div className={item()}>
          <div className={label()}>Count</div>
          <div className={value()}>{stats.count}</div>
        </div>
      </div>
    </div>
  )
}

export default StatisticalAnalysisColumns;