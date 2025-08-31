import { ColumnType } from "@/domain/shared/index.types"
import clsx from "clsx"



const StatisticalAnalysisInstructions = () => {
  const columnStyles = (value: ColumnType) => clsx("rounded-full h-5 w-5 inline-block border-2 border-black", {
    "bg-yellow-100": value === "string",
    "bg-green-100": value === "number",
    "bg-red-100": value === "boolean",
  })
  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Column Analysis:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Numeric columns are highlighted in light green</li>
          <li>• Click on a numeric column header to analyze and highlight the entire column across ALL pages</li>
          <li>• Double Click on the numeric column header to remove highlight on the entire column</li>
          <li>• Highlighted cells will remain visible when navigating between pages</li>
          <li className="font-bold flex items-center gap-2">
            <span className={columnStyles("string")}></span> • String Columns 
            <span className={columnStyles("number")}></span> • Numerical Columns 
            <span className={columnStyles("boolean")}></span>• Boolean Columns 
          </li>
        </ul>
      </div>
    </div>
  )
}

export default StatisticalAnalysisInstructions