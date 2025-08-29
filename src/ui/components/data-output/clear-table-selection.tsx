import { BarChart3 } from 'lucide-react'
import { dataOutputStyles } from './variants/data-output.variant';

const ClearTableSelection = ({
  selectedColumnsDisplay,
  clearAnalysisSelection
}: {
  selectedColumnsDisplay: string,
  clearAnalysisSelection: () => void
}) => {
  // styles for data preview table
  const s = dataOutputStyles();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold flex items-center">
          <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
          Column Statistics: {selectedColumnsDisplay}
        </h4>
        <button
          onClick={() => clearAnalysisSelection()}
          className={s.clearAnalysisSelection()}
        >
          Clear Selection
        </button>
      </div>
    </div>
  )
}

export default ClearTableSelection