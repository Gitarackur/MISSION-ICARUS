


const StatisticalAnalysisInstructions = () => {
  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Column Analysis:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Numeric columns are highlighted in light green</li>
          <li>• Click on a numeric column header to analyze and highlight the entire column across ALL pages</li>
          <li>• Highlighted cells will remain visible when navigating between pages</li>
          <li>• Check the browser console for detailed column values and statistics</li>
        </ul>
      </div>
    </div>
  )
}

export default StatisticalAnalysisInstructions