import { tv } from "tailwind-variants"


const columnStyles = tv({
  slots: {
    string: "rounded-full h-5 w-5 inline-block border-2 border-black bg-yellow-100 dark:bg-yellow-950/30",
    number: "rounded-full h-5 w-5 inline-block border-2 border-black bg-green-100 dark:bg-green-950/30",
    boolean: "rounded-full h-5 w-5 inline-block border-2 border-black bg-red-100 dark:bg-red-950/30"
  },
  variants: {
    columnType: {
      string: "rounded-full h-5 w-5 inline-block border-2 border-black bg-yellow-100 dark:bg-yellow-950/30",
      number: "rounded-full h-5 w-5 inline-block border-2 border-black bg-green-100 dark:bg-green-950/30",
      boolean: "rounded-full h-5 w-5 inline-block border-2 border-black bg-red-100 dark:bg-red-950/30"
    }
  }
})


const StatisticalAnalysisInstructions = () => {
  const styles = columnStyles()

  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Column Analysis:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Data Preview page is Paginated.</li>
          <li>• Click on a Menu option to perform Analysis on Columns across <b>ALL</b> pages</li>
          <li className="font-bold flex items-center gap-2">
            <span className={styles.string()}></span> String Columns
            <span className={styles.number()}></span> Numerical Columns
            <span className={styles.boolean()}></span> Boolean Columns
          </li>
        </ul>
      </div>
    </div>
  )
}

export default StatisticalAnalysisInstructions