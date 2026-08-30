import { tv } from "tailwind-variants"


const columnStyles = tv({
  slots: {
    string:
      "inline-block h-5 w-5 rounded-full border-2 border-yellow-300 bg-yellow-100 dark:border-yellow-500/70 dark:bg-yellow-900/60",
    number:
      "inline-block h-5 w-5 rounded-full border-2 border-green-300 bg-green-100 dark:border-green-500/70 dark:bg-green-900/60",
    boolean:
      "inline-block h-5 w-5 rounded-full border-2 border-red-300 bg-red-100 dark:border-red-500/70 dark:bg-red-900/60",

    // column analysis  instructions styles
    container:
      "mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-slate-900",
    headingText: "mb-2 font-semibold text-blue-800 dark:text-blue-200",
    listText: "space-y-1 text-sm text-blue-700 dark:text-slate-300",
    listItem: "font-bold flex items-center gap-2",
  },
  variants: {
    columnType: {
      string:
        "inline-block h-5 w-5 rounded-full border-2 border-yellow-300 bg-yellow-100 dark:border-yellow-500/70 dark:bg-yellow-900/60",
      number:
        "inline-block h-5 w-5 rounded-full border-2 border-green-300 bg-green-100 dark:border-green-500/70 dark:bg-green-900/60",
      boolean:
        "inline-block h-5 w-5 rounded-full border-2 border-red-300 bg-red-100 dark:border-red-500/70 dark:bg-red-900/60",
    }
  }
})


const StatisticalAnalysisInstructions = () => {
  const styles = columnStyles()

  return (
    <div>
      <div className={styles.container()}>
        <h4 className={styles.headingText()}>Column Analysis:</h4>
        <ul className={styles.listText()}>
          <li>• Data Preview page is Paginated.</li>
          <li>• Click on a Menu option to perform Analysis on Columns across <b>ALL</b> pages</li>
          <li className={styles.listItem()}>
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
