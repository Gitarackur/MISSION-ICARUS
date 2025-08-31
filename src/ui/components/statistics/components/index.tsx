import { StatisticalAction } from "@/domain/statistics/index.types";
import { TableColumns } from "@/domain/workflow/main.types";

// Common styles for consistency
const containerClass = "bg-white rounded-xl";
//  p-6 shadow-sm border border-gray-200
const headingClass = "text-2xl font-semibold text-gray-800 mb-2";
const descriptionClass = "text-gray-600 mb-6";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";
const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
const selectClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors";
const dangerButtonClass = "px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors";

// --- UI COMPONENTS FOR EACH STATISTICAL ACTION ---
export const Count = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Count All Values</h1>
    <p className={descriptionClass}>Counts the total number of values in a column.</p>
    <div className="mb-6">
      <label htmlFor="count-column" className={labelClass}>Select Column</label>
      <select id="count-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Count</button>
    </div>
  </div>
);

export const CountMissing = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Count Missing Values</h1>
    <p className={descriptionClass}>Counts the number of missing (null or empty) values in the selected column.</p>
    <div className="mb-6">
      <label htmlFor="missing-column" className={labelClass}>Select Column</label>
      <select id="missing-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Count Missing</button>
    </div>
  </div>
);

export const CountValid = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Count Valid Values</h1>
    <p className={descriptionClass}>Counts the number of non-missing (valid) values in the selected column.</p>
    <div className="mb-6">
      <label htmlFor="valid-column" className={labelClass}>Select Column</label>
      <select id="valid-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Count Valid</button>
    </div>
  </div>
);

export const MeanValues = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Calculate Mean</h1>
    <p className={descriptionClass}>Computes the arithmetic mean of all numeric values in the selected column.</p>
    <div className="mb-6">
      <label htmlFor="mean-column" className={labelClass}>Select Column</label>
      <select id="mean-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

export const MedianValues = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Calculate Median</h1>
    <p className={descriptionClass}>Finds the median value of a column, which is the middle value of a sorted dataset.</p>
    <div className="mb-6">
      <label htmlFor="median-column" className={labelClass}>Select Column</label>
      <select id="median-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

export const Variance = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Calculate Variance</h1>
    <p className={descriptionClass}>Calculates the variance, a measure of how spread out a set of values are from their average.</p>
    <div className="mb-6">
      <label htmlFor="variance-column" className={labelClass}>Select Column</label>
      <select id="variance-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

export const StdDevValues = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Calculate Standard Deviation</h1>
    <p className={descriptionClass}>Computes the standard deviation, a measure of the amount of variation or dispersion of a set of values.</p>
    <div className="mb-6">
      <label htmlFor="stddev-column" className={labelClass}>Select Column</label>
      <select id="stddev-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

export const Sum = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Calculate Sum</h1>
    <p className={descriptionClass}>Sums all numeric values in the selected column.</p>
    <div className="mb-6">
      <label htmlFor="sum-column" className={labelClass}>Select Column</label>
      <select id="sum-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

export const Product = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Calculate Product</h1>
    <p className={descriptionClass}>Calculates the product of all numeric values in the selected column.</p>
    <div className="mb-6">
      <label htmlFor="product-column" className={labelClass}>Select Column</label>
      <select id="product-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

export const Min = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Find Minimum</h1>
    <p className={descriptionClass}>Identifies the minimum value in the selected column.</p>
    <div className="mb-6">
      <label htmlFor="min-column" className={labelClass}>Select Column</label>
      <select id="min-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

export const Max = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Find Maximum</h1>
    <p className={descriptionClass}>Identifies the maximum value in the selected column.</p>
    <div className="mb-6">
      <label htmlFor="max-column" className={labelClass}>Select Column</label>
      <select id="max-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

export const FilterByValue = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Filter By Value</h1>
    <p className={descriptionClass}>Filters rows based on a specific value and a comparison operator.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="filter-by-value-column" className={labelClass}>Select Column</label>
        <select id="filter-by-value-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="filter-by-value-operator" className={labelClass}>Operator</label>
        <select id="filter-by-value-operator" className={selectClass}>
          <option value="==">Equals</option>
          <option value="!=">Does not equal</option>
          <option value=">">Greater than</option>
          <option value="<">Less than</option>
          <option value=">=">Greater than or equal to</option>
          <option value="<=">Less than or equal to</option>
        </select>
      </div>
      <div>
        <label htmlFor="filter-by-value-value" className={labelClass}>Value</label>
        <input type="text" id="filter-by-value-value" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Filter</button>
    </div>
  </div>
);

export const FilterByMissing = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Filter By Missing Values</h1>
    <p className={descriptionClass}>Filters rows to show only those with missing values in a specific column.</p>
    <div className="mb-6">
      <label htmlFor="filter-missing-column" className={labelClass}>Select Column</label>
      <select id="filter-missing-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Filter</button>
    </div>
  </div>
);

export const FilterByRange = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Filter By Range</h1>
    <p className={descriptionClass}>Filters rows based on a specified numeric range (e.g., between X and Y).</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="filter-range-column" className={labelClass}>Select Column</label>
        <select id="filter-range-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="filter-range-min" className={labelClass}>Minimum Value</label>
        <input type="number" id="filter-range-min" className={inputClass} />
      </div>
      <div>
        <label htmlFor="filter-range-max" className={labelClass}>Maximum Value</label>
        <input type="number" id="filter-range-max" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Filter</button>
    </div>
  </div>
);

export const FilterByOutlier = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Filter By Outliers</h1>
    <p className={descriptionClass}>Filters rows to show only the detected outliers in a column.</p>
    <div className="mb-6">
      <label htmlFor="filter-outlier-column" className={labelClass}>Select Column</label>
      <select id="filter-outlier-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Filter</button>
    </div>
  </div>
);

export const AddColumn = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Add New Column</h1>
    <p className={descriptionClass}>Creates a new, empty column in the dataset.</p>
    <div className="mb-6">
      <label htmlFor="new-column-name" className={labelClass}>New Column Name</label>
      <input type="text" id="new-column-name" className={inputClass} />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Add Column</button>
    </div>
  </div>
);

export const RenameColumn = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Rename Column</h1>
    <p className={descriptionClass}>Renames an existing column.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="old-column-name" className={labelClass}>Old Column Name</label>
        <select id="old-column-name" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="new-column-name-rename" className={labelClass}>New Column Name</label>
        <input type="text" id="new-column-name-rename" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Rename</button>
    </div>
  </div>
);

export const DeleteColumn = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Delete Column</h1>
    <p className={descriptionClass}>Deletes a selected column from the dataset.</p>
    <div className="mb-6">
      <label htmlFor="delete-column-name" className={labelClass}>Select Column to Delete</label>
      <select id="delete-column-name" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={dangerButtonClass}>Delete Column</button>
    </div>
  </div>
);

export const FillColumn = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Fill Column</h1>
    <p className={descriptionClass}>Fills all cells in a column with a single specified value.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="fill-column-name" className={labelClass}>Select Column to Fill</label>
        <select id="fill-column-name" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="fill-value" className={labelClass}>Value to Fill</label>
        <input type="text" id="fill-value" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Fill Column</button>
    </div>
  </div>
);

export const ImputeMean = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Mean Imputation</h1>
    <p className={descriptionClass}>Fills missing values with the mean of the column.</p>
    <div className="mb-6">
      <label htmlFor="impute-mean-column" className={labelClass}>Select Column</label>
      <select id="impute-mean-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Imputation</button>
    </div>
  </div>
);

export const ImputeMedian = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Median Imputation</h1>
    <p className={descriptionClass}>Fills missing values with the median of the column.</p>
    <div className="mb-6">
      <label htmlFor="impute-median-column" className={labelClass}>Select Column</label>
      <select id="impute-median-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Imputation</button>
    </div>
  </div>
);

export const ImputeKnn = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>KNN Imputation</h1>
    <p className={descriptionClass}>Fills missing values using the K-Nearest Neighbors algorithm.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="impute-knn-column" className={labelClass}>Select Column</label>
        <select id="impute-knn-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="impute-knn-k" className={labelClass}>Number of Neighbors (k)</label>
        <input type="number" id="impute-knn-k" defaultValue="5" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Imputation</button>
    </div>
  </div>
);

export const ImputeZero = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Zero Imputation</h1>
    <p className={descriptionClass}>Fills missing values with the value zero.</p>
    <div className="mb-6">
      <label htmlFor="impute-zero-column" className={labelClass}>Select Column</label>
      <select id="impute-zero-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Imputation</button>
    </div>
  </div>
);

export const MovingAverage = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Moving Average</h1>
    <p className={descriptionClass}>Calculates the moving average for a time series data column.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="ma-column" className={labelClass}>Select Column</label>
        <select id="ma-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="ma-window" className={labelClass}>Window Size</label>
        <input type="number" id="ma-window" defaultValue="5" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

export const RollingStdDev = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Rolling Standard Deviation</h1>
    <p className={descriptionClass}>Calculates the rolling standard deviation for a time series data column.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="rolling-stddev-column" className={labelClass}>Select Column</label>
        <select id="rolling-stddev-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="rolling-stddev-window" className={labelClass}>Window Size</label>
        <input type="number" id="rolling-stddev-window" defaultValue="5" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

export const TTest = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>T-Test</h1>
    <p className={descriptionClass}>Performs a T-Test to compare the means of two groups.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="ttest-column" className={labelClass}>Select Numeric Column</label>
        <select id="ttest-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="ttest-group-column" className={labelClass}>Select Grouping Column</label>
        <select id="ttest-group-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run T-Test</button>
    </div>
  </div>
);

export const Anova = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>ANOVA</h1>
    <p className={descriptionClass}>Performs an Analysis of Variance (ANOVA) to compare means across multiple groups.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="anova-column" className={labelClass}>Select Numeric Column</label>
        <select id="anova-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="anova-group-column" className={labelClass}>Select Grouping Column</label>
        <select id="anova-group-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run ANOVA</button>
    </div>
  </div>
);

export const Limma = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>LIMMA</h1>
    <p className={descriptionClass}>Performs differential expression analysis using the LIMMA package.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="limma-column" className={labelClass}>Select Numeric Columns</label>
        <select multiple id="limma-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
      </div>
      <div>
        <label htmlFor="limma-group-column" className={labelClass}>Select Grouping Column</label>
        <select id="limma-group-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run LIMMA</button>
    </div>
  </div>
);

export const FoldChange = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Fold Change</h1>
    <p className={descriptionClass}>Calculates the fold change between two groups or conditions.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="fc-column" className={labelClass}>Select Numeric Column</label>
        <select id="fc-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="fc-group-1" className={labelClass}>Group 1</label>
        <input type="text" id="fc-group-1" className={inputClass} placeholder="e.g., 'Treated'" />
      </div>
      <div>
        <label htmlFor="fc-group-2" className={labelClass}>Group 2</label>
        <input type="text" id="fc-group-2" className={inputClass} placeholder="e.g., 'Control'" />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate Fold Change</button>
    </div>
  </div>
);

export const NormalizeReporterIons = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Normalize Reporter Ions</h1>
    <p className={descriptionClass}>Normalizes isobaric reporter ion intensities.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="norm-ri-columns" className={labelClass}>Select Reporter Ion Columns</label>
        <select multiple id="norm-ri-columns" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
      </div>
      <div className="flex items-center">
        <input id="log-transform-checkbox" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
        <label htmlFor="log-transform-checkbox" className="ml-2 block text-sm text-gray-900">Apply Log Transformation</label>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Normalize</button>
    </div>
  </div>
);

export const CorrectForPurity = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Correct for Purity</h1>
    <p className={descriptionClass}>Corrects reporter ion intensities for isotopic impurities.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="correct-purity-columns" className={labelClass}>Select Reporter Ion Columns</label>
        <select multiple id="correct-purity-columns" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
      </div>
      <div>
        <label htmlFor="purity-matrix" className={labelClass}>Purity Correction Matrix</label>
        <textarea id="purity-matrix" rows={4} className={inputClass} placeholder="Enter comma-separated values for the correction matrix."></textarea>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Correct Purity</button>
    </div>
  </div>
);

export const BoxPlot = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Box Plot</h1>
    <p className={descriptionClass}>Generates a box plot visualization for a selected column.</p>
    <div className="mb-6">
      <label htmlFor="boxplot-column" className={labelClass}>Select Column</label>
      <select id="boxplot-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

export const ScatterPlot = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Scatter Plot</h1>
    <p className={descriptionClass}>Creates a scatter plot to visualize the relationship between two variables.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="scatter-x-column" className={labelClass}>Select X-Axis Column</label>
        <select id="scatter-x-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="scatter-y-column" className={labelClass}>Select Y-Axis Column</label>
        <select id="scatter-y-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

export const Heatmap = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Heatmap</h1>
    <p className={descriptionClass}>Generates a heatmap to visualize data matrices.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="heatmap-columns" className={labelClass}>Select Columns</label>
        <select multiple id="heatmap-columns" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

export const VolcanoPlot = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Volcano Plot</h1>
    <p className={descriptionClass}>Creates a volcano plot to visualize differential expression results.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="volcano-pvalue" className={labelClass}>Select P-value Column</label>
        <select id="volcano-pvalue" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="volcano-foldchange" className={labelClass}>Select Fold Change Column</label>
        <select id="volcano-foldchange" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

export const PcaPlot = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>PCA Plot</h1>
    <p className={descriptionClass}>Generates a PCA plot to visualize principal components.</p>
    <div className="mb-6">
      <label htmlFor="pca-plot-columns" className={labelClass}>Select Columns</label>
      <select multiple id="pca-plot-columns" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
      <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

export const SortAsc = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Sort Ascending</h1>
    <p className={descriptionClass}>Sorts the data in a selected column in ascending order.</p>
    <div className="mb-6">
      <label htmlFor="sort-asc-column" className={labelClass}>Select Column to Sort</label>
      <select id="sort-asc-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Sort</button>
    </div>
  </div>
);

export const SortDesc = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Sort Descending</h1>
    <p className={descriptionClass}>Sorts the data in a selected column in descending order.</p>
    <div className="mb-6">
      <label htmlFor="sort-desc-column" className={labelClass}>Select Column to Sort</label>
      <select id="sort-desc-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Sort</button>
    </div>
  </div>
);

export const ReorderColumns = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Reorder Columns</h1>
    <p className={descriptionClass}>Allows for manual reordering of columns in the dataset.</p>
    <div className="mb-6">
      <label htmlFor="reorder-column-list" className={labelClass}>Drag & Drop Columns to Reorder</label>
      <div id="reorder-column-list" className="mt-1 p-4 bg-gray-50 border border-gray-300 rounded-md max-h-64 overflow-y-auto">
        {dataColumns.map(col => (
          <div key={col} className="bg-white p-3 mb-2 rounded-md shadow-sm border border-gray-200 cursor-move hover:bg-gray-50 transition-colors">
            {col}
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Apply Reorder</button>
    </div>
  </div>
);

export const Transpose = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Transpose Data</h1>
    <p className={descriptionClass}>Transposes the dataset, swapping rows and columns.</p>
    <p className="text-sm text-gray-500 mb-6">This operation will fundamentally change the structure of your data. Please proceed with caution.</p>
    <div className="flex justify-end">
      <button className={dangerButtonClass}>Run Transpose</button>
    </div>
  </div>
);

export const FilterColumnsByName = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Filter Columns by Name</h1>
    <p className={descriptionClass}>Filters columns based on their names using a search query.</p>
    <div className="mb-6">
      <label htmlFor="filter-column-name-input" className={labelClass}>Filter by Name</label>
      <input type="text" id="filter-column-name-input" placeholder="e.g., 'Intensity' or 'Sample*'" className={inputClass} />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Filter</button>
    </div>
  </div>
);

export const FilterColumnsByType = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Filter Columns by Type</h1>
    <p className={descriptionClass}>Filters columns based on their data type (e.g., numeric, categorical).</p>
    <div className="mb-6">
      <label htmlFor="filter-column-type-select" className={labelClass}>Select Data Type</label>
      <select id="filter-column-type-select" className={selectClass}>
        <option value="numeric">Numeric</option>
        <option value="string">String</option>
        <option value="date">Date</option>
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Filter</button>
    </div>
  </div>
);

export const AddRow = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Add New Row</h1>
    <p className={descriptionClass}>Adds a new, empty row to the dataset.</p>
    <p className="text-sm text-gray-500 mb-6">A new row will be added at the bottom of the dataset. You can fill in the values manually afterwards.</p>
    <div className="flex justify-end">
      <button className={buttonClass}>Add Row</button>
    </div>
  </div>
);

export const RenameRow = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Rename Row</h1>
    <p className={descriptionClass}>Renames a selected row based on its ID.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="old-row-id" className={labelClass}>Select Row ID</label>
        <select id="old-row-id" className={selectClass}>
          <option>Row 1</option>
          <option>Row 2</option>
          <option>Row 3</option>
        </select>
      </div>
      <div>
        <label htmlFor="new-row-name" className={labelClass}>New Row Name</label>
        <input type="text" id="new-row-name" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Rename</button>
    </div>
  </div>
);

export const DeleteRow = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Delete Row</h1>
    <p className={descriptionClass}>Deletes a selected row from the dataset.</p>
    <div className="mb-6">
      <label htmlFor="delete-row-id" className={labelClass}>Select Row ID to Delete</label>
      <select id="delete-row-id" className={selectClass}>
        <option>Row 1</option>
        <option>Row 2</option>
        <option>Row 3</option>
      </select>
    </div>
    <div className="flex justify-end">
      <button className={dangerButtonClass}>Delete Row</button>
    </div>
  </div>
);

export const PcaLearning = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>PCA</h1>
    <p className={descriptionClass}>Performs Principal Component Analysis (PCA) for dimensionality reduction.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="pca-learning-columns" className={labelClass}>Select Columns for PCA</label>
        <select multiple id="pca-learning-columns" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
      </div>
      <div>
        <label htmlFor="pca-learning-components" className={labelClass}>Number of Components</label>
        <input type="number" id="pca-learning-components" defaultValue="2" min="1" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run PCA</button>
    </div>
  </div>
);

export const PlsdaLearning = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>PLS-DA</h1>
    <p className={descriptionClass}>Performs Partial Least Squares Discriminant Analysis (PLS-DA) for classification.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="plsda-learning-data" className={labelClass}>Select Data Columns</label>
        <select multiple id="plsda-learning-data" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
      </div>
      <div>
        <label htmlFor="plsda-learning-group" className={labelClass}>Select Grouping Column</label>
        <select id="plsda-learning-group" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run PLS-DA</button>
    </div>
  </div>
);

export const TsneLearning = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>t-SNE</h1>
    <p className={descriptionClass}>Performs t-Distributed Stochastic Neighbor Embedding (t-SNE) for visualization of high-dimensional data.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="tsne-learning-data" className={labelClass}>Select Data Columns</label>
        <select multiple id="tsne-learning-data" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
      </div>
      <div>
        <label htmlFor="tsne-learning-perplexity" className={labelClass}>Perplexity</label>
        <input type="number" id="tsne-learning-perplexity" defaultValue="30" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run t-SNE</button>
    </div>
  </div>
);

export const AddPtm = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Add PTM</h1>
    <p className={descriptionClass}>Adds a post-translational modification (PTM) to a peptide sequence.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="add-ptm-column" className={labelClass}>Select Peptide Column</label>
        <select id="add-ptm-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="add-ptm-type" className={labelClass}>Select PTM Type</label>
        <select id="add-ptm-type" className={selectClass}>
          <option>Phosphorylation</option>
          <option>Acetylation</option>
          <option>Methylation</option>
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Add PTM</button>
    </div>
  </div>
);

export const RemovePtm = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Remove PTM</h1>
    <p className={descriptionClass}>Remows a post-translational modification (PTM) from a peptide sequence.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="remove-ptm-column" className={labelClass}>Select Peptide Column</label>
        <select id="remove-ptm-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="remove-ptm-type" className={labelClass}>Select PTM Type</label>
        <select id="remove-ptm-type" className={selectClass}>
          <option>All PTMs</option>
          <option>Phosphorylation</option>
          <option>Acetylation</option>
          <option>Methylation</option>
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Remove PTM</button>
    </div>
  </div>
);

export const GoAnalysis = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>GO Analysis</h1>
    <p className={descriptionClass}>Performs Gene Ontology (GO) enrichment analysis on a gene list.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="go-analysis-genes" className={labelClass}>Gene List</label>
        <textarea id="go-analysis-genes" rows={4} className={inputClass} placeholder="Enter gene symbols, one per line"></textarea>
      </div>
      <div>
        <label htmlFor="go-analysis-species" className={labelClass}>Species</label>
        <input type="text" id="go-analysis-species" placeholder="e.g., Human, Mouse" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run GO Analysis</button>
    </div>
  </div>
);

export const PathwayAnalysis = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Pathway Analysis</h1>
    <p className={descriptionClass}>Performs pathway enrichment analysis on a gene list.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="pathway-analysis-genes" className={labelClass}>Gene List</label>
        <textarea id="pathway-analysis-genes" rows={4} className={inputClass} placeholder="Enter gene symbols, one per line"></textarea>
      </div>
      <div>
        <label htmlFor="pathway-analysis-db" className={labelClass}>Pathway Database</label>
        <select id="pathway-analysis-db" className={selectClass}>
          <option>KEGG</option>
          <option>Reactome</option>
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Pathway Analysis</button>
    </div>
  </div>
);

export const HierarchicalClustering = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Hierarchical Clustering</h1>
    <p className={descriptionClass}>Performs hierarchical clustering on the dataset.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="hc-columns" className={labelClass}>Select Columns to Cluster</label>
        <select multiple id="hc-columns" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
      </div>
      <div>
        <label htmlFor="hc-method" className={labelClass}>Linkage Method</label>
        <select id="hc-method" className={selectClass}>
          <option>Ward's Method</option>
          <option>Complete Linkage</option>
          <option>Average Linkage</option>
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Clustering</button>
    </div>
  </div>
);

export const KmeansClustering = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>K-Means Clustering</h1>
    <p className={descriptionClass}>Performs K-Means clustering on the dataset.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="kmeans-columns" className={labelClass}>Select Columns to Cluster</label>
        <select multiple id="kmeans-columns" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
      </div>
      <div>
        <label htmlFor="kmeans-k" className={labelClass}>Number of Clusters (k)</label>
        <input type="number" id="kmeans-k" defaultValue="3" min="2" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Clustering</button>
    </div>
  </div>
);

export const PcaAnalysis = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>PCA Analysis</h1>
    <p className={descriptionClass}>Performs a Principal Component Analysis (PCA).</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="pca-analysis-columns" className={labelClass}>Select Columns for PCA</label>
        <select multiple id="pca-analysis-columns" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
      </div>
      <div>
        <label htmlFor="pca-analysis-components" className={labelClass}>Number of Components</label>
        <input type="number" id="pca-analysis-components" defaultValue="2" min="1" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run PCA</button>
    </div>
  </div>
);

export const ZScoreNorm = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Z-Score Normalization</h1>
    <p className={descriptionClass}>Normalizes data by subtracting the mean and dividing by the standard deviation.</p>
    <div className="mb-6">
      <label htmlFor="z-score-norm-column" className={labelClass}>Select Column</label>
      <select id="z-score-norm-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Normalize</button>
    </div>
  </div>
);

export const LogTransform = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Log Transformation</h1>
    <p className={descriptionClass}>Applies a logarithmic transformation to the data.</p>
    <div className="mb-6">
      <label htmlFor="log-transform-column" className={labelClass}>Select Column</label>
      <select id="log-transform-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Transform</button>
    </div>
  </div>
);

export const QuantileNormalization = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Quantile Normalization</h1>
    <p className={descriptionClass}>Normalizes data distributions to be identical across samples.</p>
    <div className="mb-6">
      <label htmlFor="quantile-norm-columns" className={labelClass}>Select Columns</label>
      <select multiple id="quantile-norm-columns" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
      <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Normalize</button>
    </div>
  </div>
);

export const MeanCentering = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Mean Centering</h1>
    <p className={descriptionClass}>Subtracts the mean from each value in a column.</p>
    <div className="mb-6">
      <label htmlFor="mean-centering-column" className={labelClass}>Select Column</label>
      <select id="mean-centering-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Center</button>
    </div>
  </div>
);

export const QcPlot = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>QC Plot</h1>
    <p className={descriptionClass}>Generates a quality control plot to assess data quality.</p>
    <div className="mb-6">
      <label htmlFor="qc-plot-type" className={labelClass}>Select Plot Type</label>
      <select id="qc-plot-type" className={selectClass}>
        <option>Box Plot</option>
        <option>Density Plot</option>
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

export const MissingValuesPlot = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Missing Values Plot</h1>
    <p className={descriptionClass}>Generates a plot to visualize the pattern of missing values.</p>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

export const FTest = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>F-Test</h1>
    <p className={descriptionClass}>Performs an F-Test to compare the variances of two groups.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="f-test-column" className={labelClass}>Select Numeric Column</label>
        <select id="f-test-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-test-group-column" className={labelClass}>Select Grouping Column</label>
        <select id="f-test-group-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run F-Test</button>
    </div>
  </div>
);

export const ChiSquareTest = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Chi-Square Test</h1>
    <p className={descriptionClass}>Performs a Chi-Square Test for independence on categorical data.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="chi-square-col1" className={labelClass}>Column 1</label>
        <select id="chi-square-col1" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="chi-square-col2" className={labelClass}>Column 2</label>
        <select id="chi-square-col2" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Chi-Square</button>
    </div>
  </div>
);

export const ZScoreOutliers = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Z-Score Outliers</h1>
    <p className={descriptionClass}>Identifies outliers based on a Z-Score threshold.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="z-score-outlier-column" className={labelClass}>Select Column</label>
        <select id="z-score-outlier-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="z-score-threshold" className={labelClass}>Z-Score Threshold</label>
        <input type="number" id="z-score-threshold" defaultValue="3" step="0.1" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Find Outliers</button>
    </div>
  </div>
);

export const IqrOutliers = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>IQR Outliers</h1>
    <p className={descriptionClass}>Identifies outliers using the Interquartile Range (IQR) method.</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="iqr-outlier-column" className={labelClass}>Select Column</label>
        <select id="iqr-outlier-column" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="iqr-factor" className={labelClass}>IQR Factor</label>
        <input type="number" id="iqr-factor" defaultValue="1.5" step="0.1" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Find Outliers</button>
    </div>
  </div>
);

export const GrubbsTest = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Grubbs' Test</h1>
    <p className={descriptionClass}>Performs Grubbs' test to detect outliers in a dataset.</p>
    <div className="mb-6">
      <label htmlFor="grubbs-column" className={labelClass}>Select Column</label>
      <select id="grubbs-column" className={selectClass}>
        {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Grubbs' Test</button>
    </div>
  </div>
);

export const WgcnaAnalysis = ({
  dataColumns
}: {
  dataColumns: TableColumns
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>WGCNA Analysis</h1>
    <p className={descriptionClass}>Runs a Weighted Gene Co-expression Network Analysis (WGCNA).</p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="wgcna-columns" className={labelClass}>Select Columns for Analysis</label>
        <select multiple id="wgcna-columns" className={selectClass}>
          {dataColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns.</p>
      </div>
      <div>
        <label htmlFor="wgcna-soft-threshold" className={labelClass}>Soft Threshold</label>
        <input type="number" id="wgcna-soft-threshold" defaultValue="6" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run WGCNA</button>
    </div>
  </div>
);

export const SaveData = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Save Data</h1>
    <p className={descriptionClass}>Saves the current state of the dataset.</p>
    <div className="mb-6">
      <label htmlFor="save-file-name" className={labelClass}>File Name</label>
      <input type="text" id="save-file-name" placeholder="my_data.json" className={inputClass} />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Save</button>
    </div>
  </div>
);

export const ExportCsv = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Export CSV</h1>
    <p className={descriptionClass}>Exports the current dataset to a CSV file.</p>
    <div className="mb-6">
      <label htmlFor="export-csv-name" className={labelClass}>File Name</label>
      <input type="text" id="export-csv-name" placeholder="my_data.csv" className={inputClass} />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Export</button>
    </div>
  </div>
);

export const NoUiFound = ({ actionId }: { actionId: StatisticalAction }) => (
  <div className={containerClass}>
    <h1 className={headingClass}>No UI defined for "{actionId}"</h1>
    <p className="text-gray-600">This action is not yet implemented with a specific UI view.</p>
  </div>
);
