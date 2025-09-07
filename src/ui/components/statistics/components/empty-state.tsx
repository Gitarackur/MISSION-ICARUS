import { BarChart3 } from "lucide-react";
import { statisticsStyles } from "../style-variants";


const StatisticsEmptyState = () => {
    const style = statisticsStyles();

  return (
    <div className={style.emptyState()}>
        <BarChart3 className="w-12 h-12 text-gray-300" />
        <p className="text-lg font-semibold text-gray-700">
          Data relating to LFQ Intensity unavailable in Dataset.
        </p>
        <p className="text-sm text-gray-500 max-w-md">
          Once you import or process your protein dataset, and the values are present,
          Key statistics and visualizations will appear here.
        </p>
    </div>
  )
}

export default StatisticsEmptyState