import { getNumericColumnsOptimized } from "@/app-layer/shared/utils";
import { useStatisticalAnalysis } from "@/app-layer/statistics/hooks/useStatistics";
import {
  LIMMA_TREATMENT_COLUMNS_KEY,
  LIMMA_CONTROL_COLUMNS_KEY,
  LIMMA_ADJUSTMENT_METHOD_KEY,
  LIMMA_DEFAULT_ADJUSTMENT_METHOD,
  COMMON_PTMS,
  PJ_MODES,
} from "@/app-layer/statistics/constants";
import {
  downloadTextFile,
  extensionFor,
  serializeActiveMatrix,
  toFilenameSlug,
  EXPORT_FORMAT_INFO,
  type ExportFormat,
} from "@/app-layer/shared/exporter";
import { useAppSettings } from "@/ui/settings/use-app-settings";
import { Button } from "@/ui/design-system/Button";
import { Checkbox } from "@/ui/design-system/Checkbox";
import { SelectionCard } from "@/ui/design-system/SelectionCard";
import { exportSheetStyles } from "@/ui/views/settings/variants/settings.variants";
import {
  DELIMITER_LABELS,
  type CsvDelimiter,
} from "@/ui/settings/settings.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import { TableColumns, TableMatrix } from "@/domain/workflow/main.types";
import MultiSelect from "@/ui/design-system/Select/Multi/select";
import SingleSelect from "@/ui/design-system/Select/select";
import {
  FileJson,
  FileSpreadsheet,
  FileText,
  FileType2,
  Braces,
  Table2,
  Database,
  Download,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// Common styles for consistency
const containerClass = "bg-white rounded-xl";
const headingClass = "text-2xl font-semibold text-gray-800 mb-2";
const descriptionClass = "text-gray-600 mb-6";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";
const inputClass =
  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-500";
const buttonClass =
  "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors";
const dangerButtonClass =
  "px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors";

// Analysis submit button with inline loading state. It awaits the supplied
// handler so the button reflects the in-flight web-worker computation and
// returns to normal when the analysis settles (success or error display).
const AnalysisSubmitButton = ({
  children,
  disabled = false,
  onClick,
  busyLabel = "Analyzing…",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
  busyLabel?: string;
}) => {
  const [isRunning, setIsRunning] = useState(false);

  const handleClick = async () => {
    if (isRunning || disabled) return;
    setIsRunning(true);
    try {
      await onClick();
    } catch {
      // The owning component surfaces the error in its error area.
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <button
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled || isRunning}
    >
      {isRunning ? busyLabel : children}
    </button>
  );
};

type StatisticalComponentProps = {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
};

const buildSelectedColumnData = (
  selectedColumns: string[],
  allColumnarData: Map<string, TableMatrix>
) => {
  const filteredData = new Map<string, TableMatrix>();
  selectedColumns.forEach((column) => {
    const values = allColumnarData.get(column);
    if (values) filteredData.set(column, values);
  });
  return filteredData;
};

const ColumnAnalysisRunner = ({
  actionId,
  allColumnarData,
  buttonLabel = "Calculate",
  dataColumns,
  dataRows,
  description,
  minSelections = 1,
  multi = true,
  onError,
  onSuccess,
  title,
}: StatisticalComponentProps & {
  buttonLabel?: string;
  description: string;
  minSelections?: number;
  multi?: boolean;
  title: string;
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setError(null);

    if (selectedColumns.length < minSelections) {
      setError(`Please select at least ${minSelections} column${minSelections > 1 ? "s" : ""}.`);
      onError?.();
      return;
    }

    try {
      const filteredData = buildSelectedColumnData(selectedColumns, allColumnarData);
      if (filteredData.size < minSelections) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("The analysis failed. Please check the selected columns.");
      console.error(`${actionId} failed:`, err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>{title}</h1>
      <p className={descriptionClass}>{description}</p>
      <div className="mb-6">
        {multi ? (
          <MultiSelect
            id={`${actionId}-columns`}
            label="Select Columns"
            placeholder="Select data columns to analyze..."
            options={numericColumns.map((column) => ({
              value: column,
              label: column,
              disabled: false,
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText="Choose numeric columns for this analysis"
          />
        ) : (
          <SingleSelect
            id={`${actionId}-column`}
            label="Select Column"
            placeholder="Select a data column..."
            options={numericColumns.map((column) => ({
              value: column,
              label: column,
              disabled: false,
            }))}
            defaultValue=""
            onChange={(value) => setSelectedColumns(value ? [value] : [])}
            helperText="Choose a numeric column for this analysis"
          />
        )}
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={selectedColumns.length < minSelections}
          onClick={runAnalysis}
        >
          {buttonLabel}
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// --- UI COMPONENTS FOR EACH STATISTICAL ACTION ---

/*---------------------------------------------------
COUNT COLUMN VALUES
----------------------------------------------------*/

export const Count = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection1 = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runCountCalc = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError("Please select at least one column for the Count calculation.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();

      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });

      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Count calculation. Please check your data."
      );
      console.error("Count calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Count All Values</h1>
      <p className={descriptionClass}>
        Counts the total number of values in selected column(s).
      </p>
      <div className="mb-6">
        <MultiSelect
          id="count-column"
          label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection1}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runCountCalc}
        >
          Run Count
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
COUNT MISSING COLUMN VALUES
----------------------------------------------------*/

export const CountMissing = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runCountMissingCalc = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError(
        "Please select at least one column for the Count Missing calculation."
      );
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();

      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });

      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Count Missing calculation. Please check your data."
      );
      console.error("Count Missing calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Count Missing Values</h1>
      <p className={descriptionClass}>
        Counts the number of missing (null or empty) values in the selected
        column{selectedDataSets.length > 1 ? "s" : ""}.
      </p>
      <div className="mb-6">
        <MultiSelect
          id="missing-column"
          label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runCountMissingCalc}
        >
          Run Count Missing
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
COUNT VALID COLUMN VALUES
----------------------------------------------------*/

export const CountValid = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runCountValidCalc = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError(
        "Please select at least one column for the Count Valid calculation."
      );
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();

      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });

      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Count Valid calculation. Please check your data."
      );
      console.error("Count Valid calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Count Valid Values</h1>
      <p className={descriptionClass}>
        Counts the number of non-missing (valid) values in the selected column
        {selectedDataSets.length > 1 ? "s" : ""}.
      </p>
      <div className="mb-6">
        <MultiSelect
          id="valid-column"
          label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runCountValidCalc}
        >
          Run Count Valid
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
MEAN COLUMN VALUES
----------------------------------------------------*/

export const MeanValues = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runMeanCalc = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError("Please select at least one column for the Mean calculation.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();

      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });

      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Mean calculation. Please check your data."
      );
      console.error("Mean calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Calculate Mean</h1>
      <p className={descriptionClass}>
        Computes the arithmetic mean of all numeric values in the selected
        column{selectedDataSets.length > 1 ? "s" : ""}.
      </p>
      <div className="mb-6">
        <MultiSelect
          id="mean-column"
          label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runMeanCalc}
        >
          Calculate
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
MEDIAN COLUMN VALUES
----------------------------------------------------*/

export const MedianValues = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runMedianCalc = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError("Please select at least one column for the Median calculation.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();

      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });

      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Median calculation. Please check your data."
      );
      console.error("Median calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Calculate Median</h1>
      <p className={descriptionClass}>
        Finds the median value of the selected column
        {selectedDataSets.length > 1 ? "s" : ""}, which is the middle value of a
        sorted dataset.
      </p>
      <div className="mb-6">
        <MultiSelect
          id="median-column"
          label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runMedianCalc}
        >
          Calculate
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
VARIANCE COLUMN VALUES
----------------------------------------------------*/

export const Variance = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runVarianceCalc = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError(
        "Please select at least one column for the Variance calculation."
      );
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();

      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });

      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Variance calculation. Please check your data."
      );
      console.error("Variance calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Calculate Variance</h1>
      <p className={descriptionClass}>
        Calculates the variance of the selected column
        {selectedDataSets.length > 1 ? "s" : ""}, a measure of how spread out a
        set of values are from their average.
      </p>
      <div className="mb-6">
        <MultiSelect
          id="variance-column"
          label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runVarianceCalc}
        >
          Calculate
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
STDDEV COLUMN VALUES
----------------------------------------------------*/

export const StdDevValues = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runStdDevCalc = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError(
        "Please select at least one column for the Standard Deviation calculation."
      );
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();

      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });

      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Standard Deviation calculation. Please check your data."
      );
      console.error("Standard Deviation calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Calculate Standard Deviation</h1>
      <p className={descriptionClass}>
        Computes the standard deviation of the selected column
        {selectedDataSets.length > 1 ? "s" : ""}, a measure of the amount of
        variation or dispersion of a set of values.
      </p>
      <div className="mb-6">
        <MultiSelect
          id="stddev-column"
          label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runStdDevCalc}
        >
          Calculate
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
SUM COLUMN VALUES
----------------------------------------------------*/

export const Sum = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runSumCalc = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError("Please select at least one column for the Sum calculation.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();

      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });

      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Sum calculation. Please check your data."
      );
      console.error("Sum calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Calculate Sum</h1>
      <p className={descriptionClass}>
        Sums all numeric values in the selected column
        {selectedDataSets.length > 1 ? "s" : ""}.
      </p>
      <div className="mb-6">
        <MultiSelect
          id="sum-column"
          label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runSumCalc}
        >
          Calculate
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
PRODUCT COLUMN VALUES
----------------------------------------------------*/

export const Product = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runProductCalc = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError(
        "Please select at least one column for the Product calculation."
      );
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();

      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });

      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Product calculation. Please check your data."
      );
      console.error("Product calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Calculate Product</h1>
      <p className={descriptionClass}>
        Calculates the product of all numeric values in the selected column
        {selectedDataSets.length > 1 ? "s" : ""}.
      </p>
      <div className="mb-6">
        <MultiSelect
          id="product-column"
          label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runProductCalc}
        >
          Calculate
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
MIN COLUMN VALUES
----------------------------------------------------*/

export const Min = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => (
  <ColumnAnalysisRunner
    dataColumns={dataColumns}
    actionId={actionId}
    dataRows={dataRows}
    allColumnarData={allColumnarData}
    onSuccess={onSuccess}
    onError={onError}
    title="Find Minimum"
    description="Identifies the minimum finite value in the selected column."
    multi={false}
  />
);

/*---------------------------------------------------
MAX COLUMN VALUES
----------------------------------------------------*/

export const Max = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => (
  <ColumnAnalysisRunner
    dataColumns={dataColumns}
    actionId={actionId}
    dataRows={dataRows}
    allColumnarData={allColumnarData}
    onSuccess={onSuccess}
    onError={onError}
    title="Find Maximum"
    description="Identifies the maximum finite value in the selected column."
    multi={false}
  />
);

/*---------------------------------------------------
FILTER COLUMN VALUES
----------------------------------------------------*/

export const FilterByValue = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const operatorData = [
    {
      value: "==",
      label: "Equals",
      disabled: false,
    },
    {
      value: "!=",
      label: "Does not equal",
      disabled: false,
    },
    {
      value: ">",
      label: "Greater than",
      disabled: false,
    },
    {
      value: "<",
      label: "Less than",
      disabled: false,
    },
    {
      value: ">=",
      label: "Greater than or equal to",
      disabled: false,
    },
    {
      value: "<=",
      label: "Less than or equal to",
      disabled: false,
    },
  ] as const;

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [operator, setOperator] = useState<string>("==");
  const [filterValue, setFilterValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runFilterCalc = () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError("Please select at least one column for the Filter operation.");
      onError?.();
      return;
    }

    if (!filterValue.trim()) {
      setError("Please enter a value to filter by.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();

      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });

      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      // Actually filter the data based on the selected criteria
      const filterValueNumeric = parseFloat(filterValue.trim());
      const isNumericFilter = !isNaN(filterValueNumeric);

      // Get the first column to determine number of rows
      const firstColumn = filteredData.values().next().value;
      const totalRows = firstColumn ? firstColumn.length : 0;

      const filteredRows: (string | number)[][] = [];

      // Filter each row
      for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
        let shouldIncludeRow = false;

        // Check if any selected column matches the filter criteria
        for (const column of selectedDataSets) {
          const columnData = filteredData.get(column);
          if (columnData && columnData[rowIndex] !== undefined) {
            const cellValue = columnData[rowIndex];
            const cellNumeric = parseFloat(String(cellValue));

            let matches = false;

            if (isNumericFilter && !isNaN(cellNumeric)) {
              // Numeric comparison
              switch (operator) {
                case "==":
                  matches = cellNumeric === filterValueNumeric;
                  break;
                case "!=":
                  matches = cellNumeric !== filterValueNumeric;
                  break;
                case ">":
                  matches = cellNumeric > filterValueNumeric;
                  break;
                case "<":
                  matches = cellNumeric < filterValueNumeric;
                  break;
                case ">=":
                  matches = cellNumeric >= filterValueNumeric;
                  break;
                case "<=":
                  matches = cellNumeric <= filterValueNumeric;
                  break;
              }
            } else {
              // String comparison
              const cellString = String(cellValue);
              const filterString = filterValue.trim();

              switch (operator) {
                case "==":
                  matches = cellString === filterString;
                  break;
                case "!=":
                  matches = cellString !== filterString;
                  break;
              }
            }

            if (matches) {
              shouldIncludeRow = true;
              break;
            }
          }
        }

        // If row matches criteria, add it to filtered results
        if (shouldIncludeRow) {
          const row: (string | number)[] = [];
          selectedDataSets.forEach((column) => {
            const columnData = filteredData.get(column);
            row.push(columnData ? columnData[rowIndex] : "");
          });
          filteredRows.push(row);
        }
      }

      const result: StatisticalAnalysisResult = {
        inputParameters: {
          columns: selectedDataSets,
          action: actionId,
          rowCount: dataRows.length,
          metadata: {
            originalDataType: "Map<string, TableMatrix>",
            columnsProcessed: selectedDataSets.length,
          },
        },
        newly_created_columns: selectedDataSets,
        data: filteredRows,
        outputParameters: {
          columns: selectedDataSets,
          calculationMethod: "filter_by_value",
          granularity: "matrix-transform",
          resultType: "filtered_data",
          metadata: {
            calculationTimestamp: new Date().toISOString(),
            resultCount: filteredRows.length,
            filterOperator: operator,
            filterValue: filterValue.trim(),
            originalRowCount: totalRows,
          },
        },
      };

      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Filter operation. Please check your data and parameters."
      );
      console.error("Filter operation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled =
    selectedDataSets.length === 0 || !filterValue.trim();

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Filter By Value</h1>
      <p className={descriptionClass}>
        Filters rows based on a specific value and a comparison operator for the
        selected column{selectedDataSets.length > 1 ? "s" : ""}.
      </p>
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="filter-by-value-column"
            label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
            placeholder="Select data columns to analyze..."
            options={numericColumns.map((curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            }))}
            value={selectedDataSets}
            onChange={handleColumnSelection}
            helperText="Choose the numeric columns you want to include in your analysis"
          />
        </div>

        <div>
          <SingleSelect
            id="filter-by-value-operator"
            label={`Select Operator`}
            placeholder="Select data columns to analyze..."
            options={operatorData.map((curr) => ({
              value: curr.value,
              label: curr.label,
              disabled: curr.disabled,
            }))}
            defaultValue={""}
            onChange={(value) => setOperator(value as string)}
            helperText="Choose the numeric columns you want to include in your analysis"
          />
        </div>

        <div>
          <label htmlFor="filter-by-value-value" className={labelClass}>
            Value
          </label>
          <input
            type="text"
            id="filter-by-value-value"
            className={inputClass}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Enter value to filter by"
          />
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runFilterCalc}
        >
          Filter
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
COUNT COLUMN VALUES BY MISSING
----------------------------------------------------*/

export const FilterByMissing = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [mode, setMode] = useState<string>("with-missing");
  const [error, setError] = useState<string | null>(null);

  const runFilter = async () => {
    setError(null);

    if (!selectedColumn) {
      setError("Please select a column.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();
      if (allColumnarData.has(selectedColumn)) {
        filteredData.set(selectedColumn, allColumnarData.get(selectedColumn));
      }
      filteredData.set("__mode__", [mode]);

      if (filteredData.size === 0) {
        setError("No data found for the selected column.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the Filter operation.");
      console.error("Filter by missing failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Filter By Missing Values</h1>
      <p className={descriptionClass}>
        Filters rows to show only those with (or without) missing values in a
        specific column.
      </p>
      <div className="space-y-4 mb-6">
        <SingleSelect
          id="filter-missing-column"
          label={`Select Column`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue=""
          onChange={(value) => setSelectedColumn(value as string)}
          helperText="Choose the column to inspect for missing values"
        />
        <SingleSelect
          id="filter-missing-mode"
          label={`Mode`}
          placeholder="Select a mode..."
          options={[
            { value: "with-missing", label: "Only missing values", disabled: false },
            { value: "without-missing", label: "Only valid values", disabled: false },
          ]}
          defaultValue=""
          onChange={(value) => setMode(value as string)}
          helperText="Whether to keep rows that have or lack missing values"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!selectedColumn}
          onClick={runFilter}
        >
          Filter
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
FILTER COLUMN VALUES BY RANGE
----------------------------------------------------*/

export const FilterByRange = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const runFilter = async () => {
    setError(null);

    if (!selectedColumn) {
      setError("Please select a column.");
      onError?.();
      return;
    }

    const minNum = Number(minValue);
    const maxNum = Number(maxValue);
    if (minValue.trim() === "" || maxValue.trim() === "" || isNaN(minNum) || isNaN(maxNum)) {
      setError("Please enter valid minimum and maximum values.");
      onError?.();
      return;
    }
    if (minNum > maxNum) {
      setError("Minimum value must be less than or equal to maximum value.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();
      if (allColumnarData.has(selectedColumn)) {
        filteredData.set(selectedColumn, allColumnarData.get(selectedColumn));
      }
      filteredData.set("__min__", [minNum]);
      filteredData.set("__max__", [maxNum]);

      if (filteredData.size === 0) {
        setError("No data found for the selected column.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the Filter operation.");
      console.error("Filter by range failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Filter By Range</h1>
      <p className={descriptionClass}>
        Filters rows based on a specified numeric range (e.g., between X and Y).
      </p>
      <div className="space-y-4 mb-6">
        <div>
          <SingleSelect
            id="filter-range-column"
            label={`Select Column`}
            placeholder="Select data columns to analyze..."
            options={numericColumns.map((curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            }))}
            defaultValue=""
            onChange={(value) => setSelectedColumn(value as string)}
            helperText="Choose the column to filter by range"
          />
        </div>

        <div>
          <label htmlFor="filter-range-min" className={labelClass}>
            Minimum Value
          </label>
          <input
            type="number"
            id="filter-range-min"
            className={inputClass}
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="filter-range-max" className={labelClass}>
            Maximum Value
          </label>
          <input
            type="number"
            id="filter-range-max"
            className={inputClass}
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!selectedColumn || !minValue.trim() || !maxValue.trim()}
          onClick={runFilter}
        >
          Filter
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
FILTER COLUMN VALUES BY OUTLIER
----------------------------------------------------*/

export const FilterByOutlier = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [method, setMethod] = useState<string>("iqr");
  const [error, setError] = useState<string | null>(null);

  const runFilter = async () => {
    setError(null);

    if (!selectedColumn) {
      setError("Please select a column.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();
      if (allColumnarData.has(selectedColumn)) {
        filteredData.set(selectedColumn, allColumnarData.get(selectedColumn));
      }
      filteredData.set("__method__", [method]);

      if (filteredData.size === 0) {
        setError("No data found for the selected column.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the Filter operation.");
      console.error("Filter by outlier failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Filter By Outliers</h1>
      <p className={descriptionClass}>
        Filters rows to show only the detected outliers in a column.
      </p>
      <div className="space-y-4 mb-6">
        <SingleSelect
          id="filter-outlier-column"
          label={`Select Column`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue=""
          onChange={(value) => setSelectedColumn(value as string)}
          helperText="Choose the column to detect outliers in"
        />
        <SingleSelect
          id="filter-outlier-method"
          label={`Outlier Method`}
          placeholder="Select a method..."
          options={[
            { value: "iqr", label: "IQR (1.5x)", disabled: false },
            { value: "z-score", label: "Z-Score (3σ)", disabled: false },
            { value: "grubbs", label: "Grubbs' Test", disabled: false },
          ]}
          defaultValue=""
          onChange={(value) => setMethod(value as string)}
          helperText="Which outlier detection method to use"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!selectedColumn}
          onClick={runFilter}
        >
          Filter
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
ADD COLUMN VALUES
----------------------------------------------------*/

export const AddColumn = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [newColumnName, setNewColumnName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const runAddColumn = async () => {
    setError(null);

    if (numericColumns.length === 0) {
      setError("No numeric columns available to add a new column to.");
      onError?.();
      return;
    }
    if (!newColumnName.trim()) {
      setError("Please enter a name for the new column.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();
      numericColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });
      filteredData.set("__values__", "empty");
      filteredData.set("__new_name__", [newColumnName.trim()]);

      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred while adding the column.");
      console.error("Add column failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Add New Column</h1>
      <p className={descriptionClass}>
        Creates a new, empty column in the dataset.
      </p>
      <div className="mb-6">
        <label htmlFor="new-column-name" className={labelClass}>
          New Column Name
        </label>
        <input
          type="text"
          id="new-column-name"
          className={inputClass}
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          placeholder="Enter the name of the new column"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!newColumnName.trim()}
          onClick={runAddColumn}
        >
          Add Column
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

export const RenameColumn = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [oldName, setOldName] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const runRename = async () => {
    setError(null);

    if (!oldName) {
      setError("Please select the column to rename.");
      onError?.();
      return;
    }
    if (!newName.trim()) {
      setError("Please enter a new column name.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();
      if (allColumnarData.has(oldName)) {
        filteredData.set(oldName, allColumnarData.get(oldName));
      }
      filteredData.set("__old_name__", [oldName]);
      filteredData.set("__new_name__", [newName.trim()]);

      if (filteredData.size === 0) {
        setError("No data found for the selected column.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred while renaming the column.");
      console.error("Rename column failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Rename Column</h1>
      <p className={descriptionClass}>Renames an existing column.</p>
      <div className="space-y-4 mb-6">
        <div>
          <SingleSelect
            id="old-column-name"
            label={`Old Column Name`}
            placeholder="Select data columns to analyze..."
            options={numericColumns.map((curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            }))}
            defaultValue=""
            onChange={(value) => setOldName(value as string)}
            helperText="Choose the column to rename"
          />
        </div>
        <div>
          <label htmlFor="new-column-name-rename" className={labelClass}>
            New Column Name
          </label>
          <input
            type="text"
            id="new-column-name-rename"
            className={inputClass}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter the new column name"
          />
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!oldName || !newName.trim()}
          onClick={runRename}
        >
          Rename
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
DELETE COLUMN VALUES
----------------------------------------------------*/

export const DeleteColumn = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const runDelete = async () => {
    setError(null);

    if (!selectedColumn) {
      setError("Please select the column to delete.");
      onError?.();
      return;
    }

    if (numericColumns.length <= 1) {
      setError("Cannot delete the only remaining numeric column.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();
      numericColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });
      filteredData.set("__column__", [selectedColumn]);

      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred while deleting the column.");
      console.error("Delete column failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Delete Column</h1>
      <p className={descriptionClass}>
        Deletes a selected column from the dataset.
      </p>
      <div className="mb-6">
        <SingleSelect
          id="delete-column-name"
          label={`Select Column to Delete`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue=""
          onChange={(value) => setSelectedColumn(value as string)}
          helperText="Choose the column to delete"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <button
          className={dangerButtonClass}
          disabled={!selectedColumn}
          onClick={runDelete}
        >
          Delete Column
        </button>
      </div>
    </div>
  );
};

/*---------------------------------------------------
FILL COLUMN VALUES
----------------------------------------------------*/

export const FillColumn = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [fillValue, setFillValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const runFill = async () => {
    setError(null);

    if (!selectedColumn) {
      setError("Please select the column to fill.");
      onError?.();
      return;
    }

    const fillNum = Number(fillValue);
    if (fillValue.trim() === "" || isNaN(fillNum)) {
      setError("Please enter a valid numeric value.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();
      numericColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });
      filteredData.set("__column__", [selectedColumn]);
      filteredData.set("__value__", [fillNum]);

      if (filteredData.size === 0) {
        setError("No data found for the selected column.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred while filling the column.");
      console.error("Fill column failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Fill Column</h1>
      <p className={descriptionClass}>
        Fills all cells in a column with a single specified value.
      </p>
      <div className="space-y-4 mb-6">
        <div>
          <SingleSelect
            id="fill-column-name"
            label={`Select Column to Fill`}
            placeholder="Select data columns to analyze..."
            options={numericColumns.map((curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            }))}
            defaultValue=""
            onChange={(value) => setSelectedColumn(value as string)}
            helperText="Choose the column to fill"
          />
        </div>
        <div>
          <label htmlFor="fill-value" className={labelClass}>
            Value to Fill
          </label>
          <input
            type="number"
            id="fill-value"
            className={inputClass}
            value={fillValue}
            onChange={(e) => setFillValue(e.target.value)}
            placeholder="Enter the numeric value to fill"
          />
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!selectedColumn || fillValue.trim() === ""}
          onClick={runFill}
        >
          Fill Column
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

/*---------------------------------------------------
INPUT MEAN COLUMN VALUES
----------------------------------------------------*/

export const ImputeMean = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  
// (B) Keep UX consistent with your Count components
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection1 = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runImputation = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError("Please select at least one column for the Count calculation.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();

      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column));
        }
      });

      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Count calculation. Please check your data."
      );
      console.error("Count calculation failed:", err);
      onError?.();
    }
  };
  return(
    <div className={containerClass}>
    <h1 className={headingClass}>Mean Imputation</h1>
    <p className={descriptionClass}>
      Fills missing values with the mean of the column.
    </p>
    <div className="mb-6">
      <MultiSelect
        id="impute-mean-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={numericColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        value={selectedDataSets}
        onChange={handleColumnSelection1}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
    <div className="flex justify-end">
      <AnalysisSubmitButton onClick={runImputation}>Run Imputation</AnalysisSubmitButton>
    </div>
  </div>
);
}

/*---------------------------------------------------
IMPUTE MEDIAN COLUMN VALUES
----------------------------------------------------*/

export const ImputeMedian = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // Keep UX consistent with ImputeMean / Count components
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runImputation = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError("Please select at least one column for the Median imputation.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map<string, TableMatrix>();

      // Add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });

      // Verify we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      // Trigger engine (ensure actionId maps to your engine's 'impute-median' case)
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during the Median imputation. Please check your data."
      );
      console.error("Median imputation failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Median Imputation</h1>
      <p className={descriptionClass}>
        Fills missing values with the median of the selected column(s).
      </p>

      <div className="mb-6">
        <MultiSelect
          id="impute-median-column"
          label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
          placeholder="Select data columns to analyze..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton onClick={runImputation}>
          Run Imputation
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


/*---------------------------------------------------
IMPUTE KNN COLUMN VALUES (same structure as mean)
----------------------------------------------------*/

export const ImputeKnn = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // Keep UX consistent with your Count / ImputeMean components
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  // Select multiple: first = target, rest = features
  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [k, setK] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runImputation = async () => {
    setError(null);

    if (selectedDataSets.length < 2) {
      setError("Select at least two columns (first = target, others = features).");
      onError?.();
      return;
    }
    if (!Number.isInteger(k) || k <= 0) {
      setError("k must be a positive integer.");
      onError?.();
      return;
    }

    try {
      // Preserve order: selectedDataSets[0] is target, rest are features
      const filteredData = new Map<string, TableMatrix>();
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });

      if (filteredData.size < 2) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      // Optionally: include k as a sentinel column/name (if your engine reads params from Map keys)
      // Otherwise, your engine can keep a default k=5 or read k from elsewhere.
      // Example (only if your engine supports it):
      // filteredData.set(`__knn_k__=${k}`, [] as unknown as TableMatrix);

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the KNN imputation. Please check your data.");
      console.error("KNN imputation failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>KNN Imputation</h1>
      <p className={descriptionClass}>
        Select a target column first, then one or more feature columns. Missing target values are imputed
        using K-Nearest Neighbors on the features.
      </p>

      <div className="mb-6 space-y-4">
        <MultiSelect
          id="impute-knn-columns"
          label={`Select Columns (first = target, others = features)`}
          placeholder="Pick at least two numeric columns..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Order matters: the first selected column is the target"
        />

        <div className="flex items-center gap-3">
          <label htmlFor="impute-knn-k" className={labelClass}>k (neighbors)</label>
          <input
            type="number"
            id="impute-knn-k"
            min={1}
            step={1}
            value={k}
            onChange={(e) => setK(parseInt(e.target.value || "5", 10))}
            className={inputClass}
          />
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton onClick={runImputation}>
          Run Imputation
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


/*---------------------------------------------------
IMPUTE ZERO COLUMN VALUES 
----------------------------------------------------*/

export const ImputeZero = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  // Keep UX consistent with your Count / ImputeMean components
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runImputation = async () => {
    setError(null);

    if (selectedDataSets.length === 0) {
      setError("Please select at least one column for Zero imputation.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map<string, TableMatrix>();

      // Add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });

      // Verify data presence
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      // Trigger the engine (ensure actionId maps to your 'impute-zero' case)
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during Zero imputation. Please check your data.");
      console.error("Zero imputation failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Zero Imputation</h1>
      <p className={descriptionClass}>
        Fills missing values with <code>0</code> for the selected column(s).
      </p>

      <div className="mb-6">
        <MultiSelect
          id="impute-zero-column"
          label={`Select Column${selectedDataSets.length > 1 ? "s" : ""}`}
          placeholder="Select numeric columns to impute with 0..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Choose one or more numeric columns for zero imputation"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton onClick={runImputation}>
          Run Imputation
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// --------------------------------------------------- 
// MULTIPLE IMPUTATION (MICE + Rubin's rules)
// --------------------------------------------------- 

export const ImputeMultiple = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];

  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [imputations, setImputations] = useState<number>(5);
  const [maxIterations, setMaxIterations] = useState<number>(10);
  const [method, setMethod] = useState<string>("pmm");
  const [useSeed, setUseSeed] = useState<boolean>(false);
  const [seed, setSeed] = useState<number>(42);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runImputation = async () => {
    setError(null);

    if (selectedDataSets.length < 2) {
      setError(
        "Multiple imputation requires at least two columns (target + >=1 predictor)."
      );
      onError?.();
      return;
    }

    const m = Math.max(2, Math.floor(imputations) || 5);
    const iterations = Math.max(1, Math.floor(maxIterations) || 10);

    try {
      const filteredData = new Map<string, TableMatrix>();
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });

      if (filteredData.size < 2) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      filteredData.set("__imputations__", [m]);
      filteredData.set("__max_iterations__", [iterations]);
      filteredData.set("__method__", [method]);
      filteredData.set("__use_seed__", [useSeed ? "true" : "false"]);
      filteredData.set("__seed__", [Math.round(seed) || 42]);

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError(
        "An error occurred during multiple imputation. Please check your data."
      );
      console.error("Multiple imputation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length < 2;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Multiple Imputation</h1>
      <p className={descriptionClass}>
        Imputes missing values by chained equations (MICE), generating multiple
        complete datasets and pooling them with Rubin&apos;s rules to account for
        imputation uncertainty.
      </p>

      <div className="space-y-4 mb-6">
        <MultiSelect
          id="impute-multiple-columns"
          label={`Select Columns`}
          placeholder="Select at least two numeric columns..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          value={selectedDataSets}
          onChange={handleColumnSelection}
          helperText="Each column is imputed one at a time using the others as predictors"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="impute-multiple-m" className={labelClass}>
              Number of imputations (m)
            </label>
            <input
              type="number"
              id="impute-multiple-m"
              min={2}
              step={1}
              value={imputations}
              onChange={(e) =>
                setImputations(parseInt(e.target.value || "5", 10))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="impute-multiple-iterations"
              className={labelClass}
            >
              Max iterations per imputation
            </label>
            <input
              type="number"
              id="impute-multiple-iterations"
              min={1}
              step={1}
              value={maxIterations}
              onChange={(e) =>
                setMaxIterations(parseInt(e.target.value || "10", 10))
              }
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="impute-multiple-method" className={labelClass}>
            Imputation method
          </label>
          <SingleSelect
            id="impute-multiple-method"
            placeholder="Select a method..."
            options={[
              {
                value: "pmm",
                label: "Predictive Mean Matching",
                description: "Draws from observed donors (distribution-preserving)",
              },
              {
                value: "regression",
                label: "Bayesian Regression",
                description: "Linear model + residual noise",
              },
            ]}
            defaultValue=""
            value={method}
            onChange={(value) => setMethod(value as string)}
            showDescriptions
          />
        </div>

        <div className="flex flex-wrap sm:grid-cols-2 gap-4">
          <div className="w-full">
            <Checkbox
              id="impute-multiple-use-seed"
              checked={useSeed}
              onChange={(e) => setUseSeed(e.target.checked)}
              label="Use fixed random seed (reproducible)"
            />
          </div>

          {useSeed && (
            <div className="w-full">
              <label htmlFor="impute-multiple-seed" className={labelClass}>
                Seed
              </label>
              <input
                type="number"
                id="impute-multiple-seed"
                step={1}
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value || "42", 10))}
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runImputation}
        >
          Run Imputation
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// --------------------------------------------------- 
// MOVING AVERAGE - TIME SERIES
// --------------------------------------------------- 

export const MovingAverage: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ dataColumns, actionId, dataRows, allColumnarData, onSuccess, onError }) => {
  // Hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();
  
  const numericColumnsSet = useMemo(() => getNumericColumnsOptimized(dataColumns, dataRows), [dataColumns, dataRows]);
  const numericColumns = [...numericColumnsSet];
  
  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [windowSize, setWindowSize] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runMovingAverageCalc = async () => {
    setError(null);
    if (selectedDataSets.length === 0) {
      setError("Please select at least one column for the Moving Average calculation.");
      onError?.();
      return;
    }
    if (windowSize <= 0) {
      setError("Window size must be greater than 0.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      // Add window size as metadata (you might need to modify your engine to handle this)
      filteredData.set(`__window_size__`, [windowSize] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the Moving Average calculation. Please check your data.");
      console.error("Moving Average calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length === 0 || windowSize <= 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Moving Average</h1>
      <p className={descriptionClass}>
        Calculates the moving average for a time series data column using a specified window size.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="moving-average-column"
            label={`Select Column${selectedDataSets.length > 1 ? 's' : ''}`}
            placeholder="Select data columns to analyze..."
            options={numericColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedDataSets}
            onChange={handleColumnSelection}
            helperText="Choose the numeric columns for moving average calculation"
          />
        </div>
        
        <div>
          <label htmlFor="ma-window" className={labelClass}>
            Window Size
          </label>
          <input
            type="number"
            id="ma-window"
            min="1"
            step="1"
            value={windowSize}
            onChange={(e) => setWindowSize(parseInt(e.target.value, 10) || 5)}
            className={inputClass}
          />
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runMovingAverageCalc}
        >
          Calculate Moving Average
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// ROLLING STANDARD DEVIATION - TIME SERIES
// --------------------------------------------------- 

export const RollingStdDev: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ dataColumns, actionId, dataRows, allColumnarData, onSuccess, onError }) => {
  // Hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();
  
  const numericColumnsSet = useMemo(() => getNumericColumnsOptimized(dataColumns, dataRows), [dataColumns, dataRows]);
  const numericColumns = [...numericColumnsSet];
  
  const [selectedDataSets, setSelectedDataSets] = useState<string[]>([]);
  const [windowSize, setWindowSize] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);

  const handleColumnSelection = (values: string[]) => {
    setSelectedDataSets(values);
  };

  const runRollingStdDevCalc = async () => {
    setError(null);
    if (selectedDataSets.length === 0) {
      setError("Please select at least one column for the Rolling Standard Deviation calculation.");
      onError?.();
      return;
    }
    if (windowSize <= 0) {
      setError("Window size must be greater than 0.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Handle multiple selections - add all selected columns to filteredData
      selectedDataSets.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      // Verify that we have data for the selected columns
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      // Add window size as metadata
      //filteredData.set(`__window_size__`, [windowSize] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the Rolling Standard Deviation calculation. Please check your data.");
      console.error("Rolling Standard Deviation calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedDataSets.length === 0 || windowSize <= 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Rolling Standard Deviation</h1>
      <p className={descriptionClass}>
        Calculates the rolling standard deviation for a time series data column using a specified window size.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="rolling-stddev-column"
            label={`Select Column${selectedDataSets.length > 1 ? 's' : ''}`}
            placeholder="Select data columns to analyze..."
            options={numericColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedDataSets}
            onChange={handleColumnSelection}
            helperText="Choose the numeric columns for rolling standard deviation calculation"
          />
        </div>
        
        <div>
          <label htmlFor="rolling-stddev-window" className={labelClass}>
            Window Size
          </label>
          <input
            type="number"
            id="rolling-stddev-window"
            min="1"
            step="1"
            value={windowSize}
            onChange={(e) => setWindowSize(parseInt(e.target.value, 10) || 5)}
            className={inputClass}
          />
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runRollingStdDevCalc}
        >
          Calculate Rolling Std Dev
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// --------------------------------------------------- 
// T-TEST - DIFFERENTIAL ANALYSIS
// --------------------------------------------------- 

export const TTest: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ dataColumns, actionId, dataRows, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const numericColumnsSet = useMemo(() => getNumericColumnsOptimized(dataColumns, dataRows), [dataColumns, dataRows]);
  const numericColumns = [...numericColumnsSet];
  
  const [group1Columns, setGroup1Columns] = useState<string[]>([]);
  const [group2Columns, setGroup2Columns] = useState<string[]>([]);
  const [testType, setTestType] = useState<'two-sample' | 'paired'>('two-sample');
  const [error, setError] = useState<string | null>(null);

  const runTTest = async () => {
    setError(null);
    
    if (group1Columns.length === 0 || group2Columns.length === 0) {
      setError("Please select columns for both groups.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add group 1 data
      group1Columns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(`group1_${column}`, allColumnarData.get(column)!);
        }
      });
      
      // Add group 2 data
      group2Columns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(`group2_${column}`, allColumnarData.get(column)!);
        }
      });
      
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      // Add test type as metadata
      filteredData.set(`__test_type__`, [testType] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the T-Test calculation. Please check your data.");
      console.error("T-Test calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = group1Columns.length === 0 || group2Columns.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>T-Test</h1>
      <p className={descriptionClass}>
        Performs a statistical t-test to compare the means of two groups and determine if they are statistically different.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className={labelClass}>Test Type</label>
          <SingleSelect
            id="ttest-type"
            value={testType}
            onChange={(value) => setTestType(value as 'two-sample' | 'paired')}
            options={[
              { value: 'two-sample', label: 'Two-sample t-test' },
              { value: 'paired', label: 'Paired t-test' }
            ]}
          />
        </div>
        
        <div>
          <MultiSelect
            id="ttest-group1"
            label="Group 1 Columns"
            placeholder="Select columns for group 1..."
            options={numericColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={group1Columns}
            onChange={setGroup1Columns}
            helperText="Choose the numeric columns for the first group"
          />
        </div>
        
        <div>
          <MultiSelect
            id="ttest-group2"
            label="Group 2 Columns"
            placeholder="Select columns for group 2..."
            options={numericColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={group2Columns}
            onChange={setGroup2Columns}
            helperText="Choose the numeric columns for the second group"
          />
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runTTest}
        >
          Run T-Test
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// ANOVA - DIFFERENTIAL ANALYSIS
// --------------------------------------------------- 

export const Anova: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ dataColumns, actionId, dataRows, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const numericColumnsSet = useMemo(() => getNumericColumnsOptimized(dataColumns, dataRows), [dataColumns, dataRows]);
  const numericColumns = [...numericColumnsSet];
  
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [significanceLevel, setSignificanceLevel] = useState<number>(0.05);
  const [error, setError] = useState<string | null>(null);

  const runANOVA = async () => {
    setError(null);
    
    if (selectedGroups.length < 2) {
      setError("Please select at least 2 groups for ANOVA analysis.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      selectedGroups.forEach((column, index) => {
        if (allColumnarData.has(column)) {
          filteredData.set(`group_${index + 1}_${column}`, allColumnarData.get(column)!);
        }
      });
      
      if (filteredData.size === 0) {
        setError("No data found for the selected groups.");
        onError?.();
        return;
      }

      // Add significance level as metadata
      filteredData.set(`__alpha__`, [significanceLevel] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the ANOVA calculation. Please check your data.");
      console.error("ANOVA calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedGroups.length < 2;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>ANOVA</h1>
      <p className={descriptionClass}>
        Analysis of Variance (ANOVA) tests whether there are statistically significant differences between the means of three or more groups.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="anova-groups"
            label="Select Groups"
            placeholder="Select columns representing different groups..."
            options={numericColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedGroups}
            onChange={setSelectedGroups}
            helperText="Choose at least 2 numeric columns representing different groups"
          />
        </div>
        
        <div>
          <label htmlFor="anova-alpha" className={labelClass}>
            Significance Level (α)
          </label>
          <input
            type="number"
            id="anova-alpha"
            min="0.001"
            max="0.1"
            step="0.001"
            value={significanceLevel}
            onChange={(e) => setSignificanceLevel(parseFloat(e.target.value) || 0.05)}
            className={inputClass}
          />
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runANOVA}
        >
          Run ANOVA
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// LIMMA - DIFFERENTIAL ANALYSIS
// --------------------------------------------------- 

export const Limma: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ dataColumns, actionId, dataRows, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const numericColumnsSet = useMemo(() => getNumericColumnsOptimized(dataColumns, dataRows), [dataColumns, dataRows]);
  const numericColumns = [...numericColumnsSet];
  
  const [treatmentColumns, setTreatmentColumns] = useState<string[]>([]);
  const [controlColumns, setControlColumns] = useState<string[]>([]);
  const [adjustmentMethod, setAdjustmentMethod] = useState<'BH' | 'bonferroni'>(LIMMA_DEFAULT_ADJUSTMENT_METHOD as 'BH' | 'bonferroni');
  const [error, setError] = useState<string | null>(null);

  const runLIMMA = async () => {
    setError(null);
    
    if (treatmentColumns.length < 2 || controlColumns.length < 2) {
      setError("Please select at least 2 columns for both treatment and control groups (each column is one replicate sample).");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add treatment group data with the original (unprefixed) column names
      treatmentColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      // Add control group data with the original (unprefixed) column names
      controlColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      // Explicit group membership + adjustment method as metadata
      filteredData.set(LIMMA_TREATMENT_COLUMNS_KEY, treatmentColumns as unknown as TableMatrix);
      filteredData.set(LIMMA_CONTROL_COLUMNS_KEY, controlColumns as unknown as TableMatrix);
      filteredData.set(LIMMA_ADJUSTMENT_METHOD_KEY, [adjustmentMethod] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the LIMMA analysis. Please check your data.");
      console.error("LIMMA analysis failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = treatmentColumns.length < 2 || controlColumns.length < 2;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>LIMMA</h1>
      <p className={descriptionClass}>
        Linear Models for Microarray Data (LIMMA) - Differential expression analysis
        across all rows using moderated t-statistics. Each selected column is treated as
        one replicate sample of its group; a moderated t-test is run per row (gene) and
        p-values are corrected across the whole family with the chosen adjustment method.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="limma-treatment"
            label="Treatment Group Columns (Replicates)"
            placeholder="Select treatment replicate columns..."
            options={numericColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={treatmentColumns}
            onChange={setTreatmentColumns}
            helperText="Select 2 or more replicate sample columns for the treatment group"
          />
        </div>
        
        <div>
          <MultiSelect
            id="limma-control"
            label="Control Group Columns (Replicates)"
            placeholder="Select control replicate columns..."
            options={numericColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={controlColumns}
            onChange={setControlColumns}
            helperText="Select 2 or more replicate sample columns for the control group"
          />
        </div>
        
        <div>
          <label className={labelClass}>P-value Adjustment Method</label>
          <SingleSelect
            id="limma-adjustment"
            value={adjustmentMethod}
            onChange={(value) => setAdjustmentMethod(value as 'BH' | 'bonferroni')}
            options={[
              { value: 'BH', label: 'Benjamini-Hochberg (FDR)' },
              { value: 'bonferroni', label: 'Bonferroni' }
            ]}
          />
          <p className="text-xs text-gray-500 mt-1">
            Applies multiple-testing correction across all rows (genes) using the full p-value family.
          </p>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runLIMMA}
        >
          Run LIMMA Analysis
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// FOLD CHANGE - DIFFERENTIAL ANALYSIS
// --------------------------------------------------- 

export const FoldChange: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ dataColumns, actionId, dataRows, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const numericColumnsSet = useMemo(() => getNumericColumnsOptimized(dataColumns, dataRows), [dataColumns, dataRows]);
  const numericColumns = [...numericColumnsSet];
  
  const [treatmentColumns, setTreatmentColumns] = useState<string[]>([]);
  const [controlColumns, setControlColumns] = useState<string[]>([]);
  const [logScale, setLogScale] = useState<boolean>(true);
  const [foldChangeThreshold, setFoldChangeThreshold] = useState<number>(2);
  const [error, setError] = useState<string | null>(null);

  const runFoldChange = async () => {
    setError(null);
    
    if (treatmentColumns.length === 0 || controlColumns.length === 0) {
      setError("Please select columns for both treatment and control groups.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add treatment group data
      treatmentColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(`treatment_${column}`, allColumnarData.get(column)!);
        }
      });
      
      // Add control group data
      controlColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(`control_${column}`, allColumnarData.get(column)!);
        }
      });
      
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      // Add parameters as metadata
      filteredData.set(`__log_scale__`, [logScale] as unknown as TableMatrix);
      filteredData.set(`__threshold__`, [foldChangeThreshold] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the Fold Change calculation. Please check your data.");
      console.error("Fold Change calculation failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = treatmentColumns.length === 0 || controlColumns.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Fold Change</h1>
      <p className={descriptionClass}>
        Calculates fold change between treatment and control groups to identify up-regulated and down-regulated features.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="foldchange-treatment"
            label="Treatment Group Columns"
            placeholder="Select treatment group columns..."
            options={numericColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={treatmentColumns}
            onChange={setTreatmentColumns}
            helperText="Choose the numeric columns for the treatment group"
          />
        </div>
        
        <div>
          <MultiSelect
            id="foldchange-control"
            label="Control Group Columns"
            placeholder="Select control group columns..."
            options={numericColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={controlColumns}
            onChange={setControlColumns}
            helperText="Choose the numeric columns for the control group"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="foldchange-log"
              checked={logScale}
              onChange={(e) => setLogScale(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="foldchange-log" className={labelClass + " mb-0"}>
              Log2 Scale
            </label>
          </div>
        </div>
        
        <div>
          <label htmlFor="foldchange-threshold" className={labelClass}>
            Fold Change Threshold
          </label>
          <input
            type="number"
            id="foldchange-threshold"
            min="1"
            step="0.5"
            value={foldChangeThreshold}
            onChange={(e) => setFoldChangeThreshold(parseFloat(e.target.value) || 2)}
            className={inputClass}
          />
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runFoldChange}
        >
          Calculate Fold Change
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// --------------------------------------------------- 
// NORMALIZE REPORTER IONS - ISOBARIC LABELING
// --------------------------------------------------- 

export const NormalizeReporterIons: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  // FIX: Get all available columns from allColumnarData instead of using getNumericColumnsOptimized
  const availableColumns = useMemo(() => {
    // Get all column names from the Map
    const columnNames = Array.from(allColumnarData.keys());
    
    // Filter out metadata columns (those starting with __)
    const dataColumns = columnNames.filter(col => !col.startsWith('__'));
    
    // Optionally: Filter for numeric columns by checking if values are numbers
    const numericColumns = dataColumns.filter(colName => {
      const colData = allColumnarData.get(colName);
      if (!colData || colData.length === 0) return false;
      
      // Check if at least some values are numbers
      const numericCount = colData.slice(0, 10).filter(val => 
        typeof val === 'number' && !isNaN(val)
      ).length;
      
      return numericCount > 0;
    });
    
    return numericColumns;
  }, [allColumnarData]);
  
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [normalizationMethod, setNormalizationMethod] = useState<'median' | 'mean' | 'total'>('median');
  const [error, setError] = useState<string | null>(null);

  const handleChannelSelection = (values: string[]) => {
    setSelectedChannels(values);
  };

  const runNormalization = async () => {
    setError(null);
    
    if (selectedChannels.length === 0) {
      setError("Please select at least one reporter ion channel to normalize.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      selectedChannels.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      if (filteredData.size === 0) {
        setError("No data found for the selected channels.");
        onError?.();
        return;
      }

      filteredData.set(`__normalization_method__`, [normalizationMethod] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during reporter ion normalization. Please check your data.");
      console.error("Reporter ion normalization failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedChannels.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Normalize Reporter Ions</h1>
      <p className={descriptionClass}>
        Normalizes TMT/iTRAQ reporter ion intensities to correct for mixing errors and systematic biases 
        across channels using median, mean, or total intensity normalization.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="normalize-channels"
            label="Select Reporter Ion Channels"
            placeholder="Select reporter ion channels..."
            options={availableColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedChannels}
            onChange={handleChannelSelection}
            helperText={`Choose the reporter ion intensity columns to normalize (${availableColumns.length} columns available)`}
          />
        </div>
        
        <div>
          <label className={labelClass}>Normalization Method</label>
          <SingleSelect
            id="normalization-method"
            value={normalizationMethod}
            onChange={(value) => setNormalizationMethod(value as 'median' | 'mean' | 'total')}
            options={[
              { value: 'median', label: 'Median Normalization (Recommended)' },
              { value: 'mean', label: 'Mean Normalization' },
              { value: 'total', label: 'Total Intensity Normalization' }
            ]}
          />
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runNormalization}
        >
          Normalize Reporter Ions
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// --------------------------------------------------- 
// CORRECT FOR PURITY - ISOBARIC LABELING
// --------------------------------------------------- 

export const CorrectForPurity: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  // FIX: Get all available columns from allColumnarData
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    const dataColumns = columnNames.filter(col => !col.startsWith('__'));
    
    const numericColumns = dataColumns.filter(colName => {
      const colData = allColumnarData.get(colName);
      if (!colData || colData.length === 0) return false;
      
      const numericCount = colData.slice(0, 10).filter(val => 
        typeof val === 'number' && !isNaN(val)
      ).length;
      
      return numericCount > 0;
    });
    
    return numericColumns;
  }, [allColumnarData]);
  
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  type ReagentType = 'tmt10' | 'tmt11' | 'tmt16' | 'itraq4' | 'itraq8' | 'custom';
  const [reagentType, setReagentType] = useState<ReagentType>('tmt10');
  const [applyCorrection, setApplyCorrection] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleChannelSelection = (values: string[]) => {
    setSelectedChannels(values);
  };

  const runPurityCorrection = async () => {
    setError(null);
    
    if (selectedChannels.length === 0) {
      setError("Please select at least one reporter ion channel to correct.");
      onError?.();
      return;
    }
    
    if (!applyCorrection) {
      setError("Purity correction is disabled. Please enable it to proceed.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      selectedChannels.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      if (filteredData.size === 0) {
        setError("No data found for the selected channels.");
        onError?.();
        return;
      }

      filteredData.set(`__reagent_type__`, [reagentType] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during purity correction. Please check your data.");
      console.error("Purity correction failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedChannels.length === 0 || !applyCorrection;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Correct for Purity</h1>
      <p className={descriptionClass}>
        Corrects TMT/iTRAQ reporter ion intensities for isotopic impurities based on the 
        manufacturer's purity correction matrix.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="purity-channels"
            label="Select Reporter Ion Channels"
            placeholder="Select reporter ion channels..."
            options={availableColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedChannels}
            onChange={handleChannelSelection}
            helperText={`Choose the reporter ion intensity columns to correct (${availableColumns.length} columns available)`}
          />
        </div>
        
        <div>
          <label className={labelClass}>Reagent Type</label>
          <SingleSelect
            id="reagent-type"
            value={reagentType}
            onChange={(value) => setReagentType(value as ReagentType)}
            options={[
              { value: 'tmt10', label: 'TMT 10-plex' },
              { value: 'tmt11', label: 'TMT 11-plex' },
              { value: 'tmt16', label: 'TMT 16-plex (TMTpro)' },
              { value: 'itraq4', label: 'iTRAQ 4-plex' },
              { value: 'itraq8', label: 'iTRAQ 8-plex' },
              { value: 'custom', label: 'Custom Purity Matrix' }
            ]}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="apply-purity-correction"
            checked={applyCorrection}
            onChange={(e) => setApplyCorrection(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="apply-purity-correction" className="text-sm font-medium text-gray-700">
            Apply isotopic purity correction
          </label>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runPurityCorrection}
        >
          Apply Purity Correction
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


/*---------------------------------------------------
BOX PLOT COLUMN VALUES
----------------------------------------------------*/

export const BoxPlot = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => (
  <ColumnAnalysisRunner
    dataColumns={dataColumns}
    actionId={actionId}
    dataRows={dataRows}
    allColumnarData={allColumnarData}
    onSuccess={onSuccess}
    onError={onError}
    title="Box Plot"
    description="Calculates box plot summary values for selected columns."
    buttonLabel="Generate Plot Data"
  />
);

/*---------------------------------------------------
SCATTER PLOT COLUMN VALUES
----------------------------------------------------*/

export const ScatterPlot = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => (
  <ColumnAnalysisRunner
    dataColumns={dataColumns}
    actionId={actionId}
    dataRows={dataRows}
    allColumnarData={allColumnarData}
    onSuccess={onSuccess}
    onError={onError}
    title="Scatter Plot"
    description="Prepares paired numeric columns for scatter plot visualization."
    buttonLabel="Generate Plot Data"
    minSelections={2}
  />
);

/*---------------------------------------------------
HEATMAP COLUMN VALUES
----------------------------------------------------*/

export const Heatmap = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => (
  <ColumnAnalysisRunner
    dataColumns={dataColumns}
    actionId={actionId}
    dataRows={dataRows}
    allColumnarData={allColumnarData}
    onSuccess={onSuccess}
    onError={onError}
    title="Heatmap"
    description="Calculates a column-correlation matrix for heatmap visualization."
    buttonLabel="Generate Heatmap Data"
    minSelections={2}
  />
);

/*---------------------------------------------------
VOLCANO PLOT COLUMN VALUES
----------------------------------------------------*/

export const VolcanoPlot = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => (
  <ColumnAnalysisRunner
    dataColumns={dataColumns}
    actionId={actionId}
    dataRows={dataRows}
    allColumnarData={allColumnarData}
    onSuccess={onSuccess}
    onError={onError}
    title="Volcano Plot"
    description="Prepares log fold-change and p-value columns for volcano visualization."
    buttonLabel="Generate Volcano Data"
    minSelections={2}
  />
);

/*---------------------------------------------------
PCA PLOT COLUMN VALUES
----------------------------------------------------*/

export const PcaPlot = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => (
  <ColumnAnalysisRunner
    dataColumns={dataColumns}
    actionId={actionId}
    dataRows={dataRows}
    allColumnarData={allColumnarData}
    onSuccess={onSuccess}
    onError={onError}
    title="PCA Plot"
    description="Calculates PCA coordinates for selected numeric columns."
    buttonLabel="Generate PCA Data"
    minSelections={2}
  />
);


// --------------------------------------------------- 
// SORT ASCENDING
// --------------------------------------------------- 

export const SortAscending: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [primarySortColumn, setPrimarySortColumn] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const runSortAsc = async () => {
    setError(null);
    
    if (selectedColumns.length === 0) {
      setError("Please select at least one column to sort by.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add all selected columns to the data
      selectedColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }
      
      // Use the first selected column as primary sort, or specified primary column
      const sortColumn = primarySortColumn || selectedColumns[0];
      filteredData.set(`__sort_column__`, [sortColumn] as unknown as TableMatrix);
      filteredData.set(`__sort_direction__`, ['asc'] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during sorting. Please check your data.");
      console.error("Sort ascending failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedColumns.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Sort Ascending</h1>
      <p className={descriptionClass}>
        Sort all rows in ascending order based on the values in selected columns.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="sort-asc-columns"
            label="Select Columns to Sort"
            placeholder="Select one or more columns..."
            options={availableColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`Select columns to include in sorting (${availableColumns.length} columns available)`}
          />
        </div>
        
        {selectedColumns.length > 1 && (
          <div>
            <label className={labelClass}>Primary Sort Column (Optional)</label>
            <SingleSelect
              id="primary-sort-column"
              value={primarySortColumn}
              onChange={(value) => setPrimarySortColumn(value || '')}
              options={[
                { value: '', label: 'Use first selected column' },
                ...selectedColumns.map((col) => ({ value: col, label: col }))
              ]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose which column to use as the primary sorting criterion. Defaults to the first selected column.
            </p>
          </div>
        )}
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runSortAsc}
        >
          Sort Ascending
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};



// --------------------------------------------------- 
// SORT DESCENDING
// --------------------------------------------------- 

export const SortDescending: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [primarySortColumn, setPrimarySortColumn] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const runSortDesc = async () => {
    setError(null);
    
    if (selectedColumns.length === 0) {
      setError("Please select at least one column to sort by.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add all selected columns to the data
      selectedColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }
      
      // Use the first selected column as primary sort, or specified primary column
      const sortColumn = primarySortColumn || selectedColumns[0];
      filteredData.set(`__sort_column__`, [sortColumn] as unknown as TableMatrix);
      filteredData.set(`__sort_direction__`, ['desc'] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during sorting. Please check your data.");
      console.error("Sort descending failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = selectedColumns.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Sort Descending</h1>
      <p className={descriptionClass}>
        Sort all rows in descending order based on the values in selected columns.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="sort-desc-columns"
            label="Select Columns to Sort"
            placeholder="Select one or more columns..."
            options={availableColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`Select columns to include in sorting (${availableColumns.length} columns available)`}
          />
        </div>
        
        {selectedColumns.length > 1 && (
          <div>
            <label className={labelClass}>Primary Sort Column (Optional)</label>
            <SingleSelect
              id="primary-sort-column-desc"
              value={primarySortColumn}
              onChange={(value) => setPrimarySortColumn(value || '')}
              options={[
                { value: '', label: 'Use first selected column' },
                ...selectedColumns.map((col) => ({ value: col, label: col }))
              ]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose which column to use as the primary sorting criterion. Defaults to the first selected column.
            </p>
          </div>
        )}
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runSortDesc}
        >
          Sort Descending
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// --------------------------------------------------- 
// REORDER COLUMNS
// --------------------------------------------------- 

export const ReorderColumns: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [reorderMode, setReorderMode] = useState<string>('reverse');
  const [error, setError] = useState<string | null>(null);

  const runReorder = async () => {
    setError(null);
    
    const columnsToReorder = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToReorder.length === 0) {
      setError("No columns available to reorder.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToReorder.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      filteredData.set(`__reorder_mode__`, [reorderMode] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during column reordering. Please check your data.");
      console.error("Reorder columns failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Reorder Columns</h1>
      <p className={descriptionClass}>
        Rearrange the order of columns in your dataset using various methods.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="reorder-columns-select"
            label="Select Columns (Optional)"
            placeholder="Select columns to reorder (leave empty for all)..."
            options={availableColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText="Leave empty to reorder all columns"
          />
        </div>
        
        <div>
          <label className={labelClass}>Reorder Method</label>
          <SingleSelect
            id="reorder-mode"
            value={reorderMode}
            onChange={(value) => setReorderMode(value || 'reverse')}
            options={[
              { value: 'reverse', label: 'Reverse Order' },
              { value: 'alphabetical', label: 'Alphabetical Order' },
              { value: 'custom', label: 'Custom Order (by selection)' }
            ]}
          />
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runReorder}
        >
          Reorder Columns
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// --------------------------------------------------- 
// TRANSPOSE
// --------------------------------------------------- 

export const Transpose: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [confirmTranspose, setConfirmTranspose] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runTranspose = async () => {
    setError(null);
    
    if (!confirmTranspose) {
      setError("Please confirm that you want to transpose the data.");
      onError?.();
      return;
    }
    
    const columnsToTranspose = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToTranspose.length === 0) {
      setError("No columns available to transpose.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToTranspose.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during transposition. Please check your data.");
      console.error("Transpose failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = !confirmTranspose;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Transpose</h1>
      <p className={descriptionClass}>
        Transpose the data matrix, converting rows to columns and columns to rows.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="transpose-columns-select"
            label="Select Columns (Optional)"
            placeholder="Select columns to transpose (leave empty for all)..."
            options={availableColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`Leave empty to transpose all columns (${availableColumns.length} available)`}
          />
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-xs text-yellow-800">
            <strong>Warning:</strong> Transposing will swap rows and columns. This operation 
            fundamentally changes the structure of your data.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="confirm-transpose"
            checked={confirmTranspose}
            onChange={(e) => setConfirmTranspose(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="confirm-transpose" className="text-sm font-medium text-gray-700">
            I understand and want to transpose the data
          </label>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runTranspose}
        >
          Transpose Data
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// ===================================================================
// FILTER COLUMNS OPERATIONS
// ===================================================================

// --------------------------------------------------- 
// FILTER COLUMNS BY NAME
// --------------------------------------------------- 

export const FilterColumnsByName: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [searchPattern, setSearchPattern] = useState<string>('');
  const [matchType, setMatchType] = useState<string>('contains');
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Update preview when search parameters change
  useEffect(() => {
    if (!searchPattern) {
      setPreviewColumns([]);
      return;
    }
    
    const pattern = caseSensitive ? searchPattern : searchPattern.toLowerCase();
    const matched = availableColumns.filter(colName => {
      const compareString = caseSensitive ? colName : colName.toLowerCase();
      
      switch (matchType) {
        case 'contains':
          return compareString.includes(pattern);
        case 'starts':
          return compareString.startsWith(pattern);
        case 'ends':
          return compareString.endsWith(pattern);
        case 'exact':
          return compareString === pattern;
        default:
          return false;
      }
    });
    
    setPreviewColumns(matched);
  }, [searchPattern, matchType, caseSensitive, availableColumns]);

  const runFilterByName = async () => {
    setError(null);
    
    if (!searchPattern) {
      setError("Please enter a search pattern.");
      onError?.();
      return;
    }
    
    if (previewColumns.length === 0) {
      setError("No columns match the search pattern.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add only matched columns
      previewColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      // Add filter parameters as metadata
      filteredData.set(`__filter_pattern__`, [searchPattern] as unknown as TableMatrix);
      filteredData.set(`__match_type__`, [matchType] as unknown as TableMatrix);
      filteredData.set(`__case_sensitive__`, [caseSensitive] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during filtering. Please check your data.");
      console.error("Filter by name failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = !searchPattern || previewColumns.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Filter Columns by Name</h1>
      <p className={descriptionClass}>
        Filter and select columns based on their names using pattern matching.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="search-pattern" className={labelClass}>
            Search Pattern
          </label>
          <input
            type="text"
            id="search-pattern"
            value={searchPattern}
            onChange={(e) => setSearchPattern(e.target.value)}
            placeholder="Enter search text..."
            className={inputClass}
          />
        </div>
        
        <div>
          <label className={labelClass}>Match Type</label>
          <SingleSelect
            id="match-type"
            value={matchType}
            onChange={(value) => setMatchType(value || 'contains')}
            options={[
              { value: 'contains', label: 'Contains' },
              { value: 'starts', label: 'Starts with' },
              { value: 'ends', label: 'Ends with' },
              { value: 'exact', label: 'Exact match' }
            ]}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="case-sensitive"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="case-sensitive" className="text-sm font-medium text-gray-700">
            Case sensitive
          </label>
        </div>
        
        {searchPattern && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Preview: {previewColumns.length} column{previewColumns.length !== 1 ? 's' : ''} matched
            </p>
            {previewColumns.length > 0 && (
              <div className="text-xs text-blue-800 max-h-32 overflow-y-auto">
                {previewColumns.slice(0, 10).map((col, idx) => (
                  <div key={idx}>• {col}</div>
                ))}
                {previewColumns.length > 10 && (
                  <div className="text-blue-600 font-medium mt-1">
                    ... and {previewColumns.length - 10} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runFilterByName}
        >
          Apply Filter
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// FILTER COLUMNS BY TYPE
// --------------------------------------------------- 

export const FilterColumnsByType: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [filterType, setFilterType] = useState<string>('numeric');
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Update preview when filter type changes
  useEffect(() => {
    const matched = availableColumns.filter(colName => {
      const column = allColumnarData.get(colName);
      if (!column) return false;
      
      switch (filterType) {
        case 'numeric':
          return column.every((val: string | number) => typeof val === 'number' && !isNaN(val as number));
        case 'integer':
          return column.every((val: string | number) => typeof val === 'number' && Number.isInteger(val as number));
        case 'float':
          return column.some((val: string | number) => typeof val === 'number' && !Number.isInteger(val as number) && !isNaN(val as number));
        case 'positive':
          return column.every((val: string | number) => typeof val === 'number' && (val as number) > 0);
        case 'negative':
          return column.every((val: string | number) => typeof val === 'number' && (val as number) < 0);
        case 'nonzero':
          return column.every((val: string | number) => typeof val === 'number' && (val as number) !== 0);
        default:
          return false;
      }
    });
    
    setPreviewColumns(matched);
  }, [filterType, availableColumns, allColumnarData]);

  const runFilterByType = async () => {
    setError(null);
    
    if (previewColumns.length === 0) {
      setError(`No columns match the selected type: ${filterType}`);
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add only matched columns
      previewColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      // Add filter parameters as metadata
      filteredData.set(`__filter_type__`, [filterType] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during filtering. Please check your data.");
      console.error("Filter by type failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = previewColumns.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Filter Columns by Type</h1>
      <p className={descriptionClass}>
        Filter and select columns based on their data type characteristics.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className={labelClass}>Data Type Filter</label>
          <SingleSelect
            id="filter-type"
            value={filterType}
            onChange={(value) => setFilterType(value || 'numeric')}
            options={[
              { value: 'numeric', label: 'All Numeric (no NaN values)' },
              { value: 'integer', label: 'Integers Only' },
              { value: 'float', label: 'Contains Decimal Values' },
              { value: 'positive', label: 'All Positive Values' },
              { value: 'negative', label: 'All Negative Values' },
              { value: 'nonzero', label: 'No Zero Values' }
            ]}
          />
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900 mb-2">
            Preview: {previewColumns.length} column{previewColumns.length !== 1 ? 's' : ''} matched
          </p>
          {previewColumns.length > 0 && (
            <div className="text-xs text-blue-800 max-h-32 overflow-y-auto">
              {previewColumns.slice(0, 10).map((col, idx) => (
                <div key={idx}>• {col}</div>
              ))}
              {previewColumns.length > 10 && (
                <div className="text-blue-600 font-medium mt-1">
                  ... and {previewColumns.length - 10} more
                </div>
              )}
            </div>
          )}
          {previewColumns.length === 0 && (
            <p className="text-xs text-blue-700">No columns match this filter type.</p>
          )}
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={isRunButtonDisabled}
          onClick={runFilterByType}
        >
          Apply Filter
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// ===================================================================
// ROW ANNOTATION OPERATIONS
// ===================================================================

// --------------------------------------------------- 
// ADD ROW
// --------------------------------------------------- 

export const AddRow: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [numRowsToAdd, setNumRowsToAdd] = useState<number>(1);
  const [position, setPosition] = useState<string>('end');
  const [defaultValue, setDefaultValue] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const runAddRow = async () => {
    setError(null);
    
    if (numRowsToAdd <= 0) {
      setError("Number of rows must be greater than 0.");
      onError?.();
      return;
    }
    
    if (numRowsToAdd > 1000) {
      setError("Cannot add more than 1000 rows at once.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add all columns
      availableColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      // Add operation parameters as metadata
      filteredData.set(`__num_rows__`, [numRowsToAdd] as unknown as TableMatrix);
      filteredData.set(`__position__`, [position] as unknown as TableMatrix);
      filteredData.set(`__default_value__`, [defaultValue] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred while adding rows. Please check your data.");
      console.error("Add row failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Add Rows</h1>
      <p className={descriptionClass}>
        Add new empty rows to your dataset at a specified position with default values.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="num-rows" className={labelClass}>
            Number of Rows to Add
          </label>
          <input
            type="number"
            id="num-rows"
            min="1"
            max="1000"
            value={numRowsToAdd}
            onChange={(e) => setNumRowsToAdd(parseInt(e.target.value) || 1)}
            className={inputClass}
          />
        </div>
        
        <div>
          <label className={labelClass}>Insert Position</label>
          <SingleSelect
            id="position"
            value={position}
            onChange={(value) => setPosition(value || 'end')}
            options={[
              { value: 'start', label: 'At the beginning' },
              { value: 'end', label: 'At the end' }
            ]}
          />
        </div>
        
        <div>
          <label htmlFor="default-value" className={labelClass}>
            Default Value for New Rows
          </label>
          <input
            type="number"
            id="default-value"
            value={defaultValue}
            onChange={(e) => setDefaultValue(parseFloat(e.target.value) || 0)}
            className={inputClass}
            step="any"
          />
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> New rows will be added to all columns with the specified default value. 
            You can edit the values after adding the rows.
          </p>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runAddRow}
        >
          Add {numRowsToAdd} Row{numRowsToAdd !== 1 ? 's' : ''}
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// RENAME ROW
// --------------------------------------------------- 

export const RenameRow: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, dataRows, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const totalRows = dataRows.length;
  
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [newName, setNewName] = useState<string>('');
  const [currentName, setCurrentName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rowIndex >= 0 && rowIndex < dataRows.length) {
      // Get the current row identifier (assuming there's an 'id' or 'name' property)
      const row = dataRows[rowIndex];
      const identifier = ((row).id || (row).name || `Row ${rowIndex + 1}`)as string;
      setCurrentName(identifier);
    }
  }, [rowIndex, dataRows]);

  const runRenameRow = async () => {
    setError(null);
    
    if (!newName.trim()) {
      setError("Please enter a new name for the row.");
      onError?.();
      return;
    }
    
    if (rowIndex < 0 || rowIndex >= totalRows) {
      setError("Invalid row index.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add metadata for rename operation
      filteredData.set(`__row_index__`, [rowIndex] as unknown as TableMatrix);
      filteredData.set(`__new_name__`, [newName] as unknown as TableMatrix);
      filteredData.set(`__old_name__`, [currentName] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred while renaming the row. Please check your data.");
      console.error("Rename row failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Rename Row</h1>
      <p className={descriptionClass}>
        Rename a specific row by updating its identifier or label.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="row-index" className={labelClass}>
            Row Index (0-based)
          </label>
          <input
            type="number"
            id="row-index"
            min="0"
            max={totalRows - 1}
            value={rowIndex}
            onChange={(e) => setRowIndex(parseInt(e.target.value) || 0)}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Total rows: {totalRows}. Valid range: 0 to {totalRows - 1}
          </p>
        </div>
        
        {currentName && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-sm text-gray-700">
              <strong>Current name:</strong> {currentName}
            </p>
          </div>
        )}
        
        <div>
          <label htmlFor="new-name" className={labelClass}>
            New Row Name
          </label>
          <input
            type="text"
            id="new-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new row name..."
            className={inputClass}
          />
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!newName.trim()}
          onClick={runRenameRow}
        >
          Rename Row
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// DELETE ROW
// --------------------------------------------------- 

export const DeleteRow: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, dataRows, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const totalRows = dataRows.length;
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [rowIndicesToDelete, setRowIndicesToDelete] = useState<string>('');
  // const [deleteMode, setDeleteMode] = useState<string>('indices');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const parseRowIndices = (input: string): number[] => {
    const indices: number[] = [];
    const parts = input.split(',');
    
    parts.forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 0 && i < totalRows) {
              indices.push(i);
            }
          }
        }
      } else {
        const idx = parseInt(part);
        if (!isNaN(idx) && idx >= 0 && idx < totalRows) {
          indices.push(idx);
        }
      }
    });
    
    return [...new Set(indices)].sort((a, b) => a - b);
  };

  const runDeleteRow = async () => {
    setError(null);
    
    if (!confirmDelete) {
      setError("Please confirm that you want to delete the rows.");
      onError?.();
      return;
    }
    
    if (!rowIndicesToDelete.trim()) {
      setError("Please specify which rows to delete.");
      onError?.();
      return;
    }
    
    const indices = parseRowIndices(rowIndicesToDelete);
    
    if (indices.length === 0) {
      setError("No valid row indices specified.");
      onError?.();
      return;
    }
    
    if (indices.length >= totalRows) {
      setError("Cannot delete all rows. At least one row must remain.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add all columns
      availableColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      // Add deletion parameters as metadata
      filteredData.set(`__row_indices__`, indices as unknown as TableMatrix);
      filteredData.set(`__delete_count__`, [indices.length] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred while deleting rows. Please check your data.");
      console.error("Delete row failed:", err);
      onError?.();
    }
  };

  const previewIndices = rowIndicesToDelete ? parseRowIndices(rowIndicesToDelete) : [];

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Delete Rows</h1>
      <p className={descriptionClass}>
        Remove specific rows from your dataset by index.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="row-indices" className={labelClass}>
            Row Indices to Delete
          </label>
          <input
            type="text"
            id="row-indices"
            value={rowIndicesToDelete}
            onChange={(e) => setRowIndicesToDelete(e.target.value)}
            placeholder="e.g., 0,5,10-15,20"
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter row indices (0-based) separated by commas. Use ranges like "10-15" for consecutive rows. 
            Total rows: {totalRows}
          </p>
        </div>
        
        {previewIndices.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm font-medium text-yellow-900 mb-1">
              Preview: {previewIndices.length} row{previewIndices.length !== 1 ? 's' : ''} will be deleted
            </p>
            <p className="text-xs text-yellow-800">
              Indices: {previewIndices.slice(0, 20).join(', ')}
              {previewIndices.length > 20 && ` ... and ${previewIndices.length - 20} more`}
            </p>
          </div>
        )}
        
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-xs text-red-800">
            <strong>Warning:</strong> This action cannot be undone. Deleted rows will be permanently removed from your dataset.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="confirm-delete"
            checked={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="confirm-delete" className="text-sm font-medium text-gray-700">
            I understand and want to delete these rows
          </label>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!confirmDelete || previewIndices.length === 0}
          onClick={runDeleteRow}
        >
          Delete {previewIndices.length} Row{previewIndices.length !== 1 ? 's' : ''}
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// ===================================================================
// MACHINE LEARNING / DIMENSIONALITY REDUCTION OPERATIONS
// ===================================================================

// --------------------------------------------------- 
// PCA - Principal Component Analysis
// --------------------------------------------------- 

export const PcaLearning: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ 
  // dataColumns, 
  actionId, 
  // dataRows, 
  allColumnarData, 
  onSuccess, 
  onError 
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [numComponents, setNumComponents] = useState<number>(2);
  const [error, setError] = useState<string | null>(null);

  const runPCA = async () => {
    setError(null);
    
    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToUse.length < 2) {
      setError("PCA requires at least 2 features (columns).");
      onError?.();
      return;
    }
    
    if (numComponents > columnsToUse.length) {
      setError(`Number of components cannot exceed number of features (${columnsToUse.length}).`);
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      filteredData.set(`__num_components__`, [numComponents] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`PCA failed: ${errorMessage}`);
      console.error("PCA failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>PCA - Principal Component Analysis</h1>
      <p className={descriptionClass}>
        Reduce dimensionality and identify the principal components that explain the most variance in your data.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="pca-columns"
            label="Select Features (Optional)"
            placeholder="Select columns for PCA (leave empty for all)..."
            options={availableColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`${availableColumns.length} features available. Leave empty to use all features.`}
          />
        </div>
        
        <div>
          <label htmlFor="num-components-pca" className={labelClass}>
            Number of Principal Components
          </label>
          <input
            type="number"
            id="num-components-pca"
            min="1"
            max={Math.min(50, availableColumns.length)}
            value={numComponents}
            onChange={(e) => setNumComponents(parseInt(e.target.value) || 2)}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Typically 2-3 components for visualization, more for analysis
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What PCA does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Identifies directions of maximum variance</li>
            <li>• Reduces dimensionality while preserving information</li>
            <li>• Useful for visualization and removing noise</li>
            <li>• Outputs uncorrelated principal components</li>
          </ul>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runPCA}
        >
          Run PCA
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// PLS-DA - Partial Least Squares Discriminant Analysis
// --------------------------------------------------- 

export const PlsdaLearning: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ 
  // dataColumns, 
  actionId, 
  // dataRows, 
  allColumnarData, 
  onSuccess, 
  onError 
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [numComponents, setNumComponents] = useState<number>(2);
  const [labelColumn, setLabelColumn] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const runPLSDA = async () => {
    setError(null);
    
    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToUse.length < 2) {
      setError("PLS-DA requires at least 2 features (columns).");
      onError?.();
      return;
    }
    
    if (!labelColumn) {
      setError("Please select a column containing class labels.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      // Get labels from selected column
      const labels = allColumnarData.get(labelColumn) || [];
      
      filteredData.set(`__num_components__`, [numComponents] as unknown as TableMatrix);
      filteredData.set(`__labels__`, labels);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`PLS-DA failed: ${errorMessage}`);
      console.error("PLS-DA failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>PLS-DA - Partial Least Squares Discriminant Analysis</h1>
      <p className={descriptionClass}>
        Supervised dimensionality reduction that maximizes separation between predefined classes.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="plsda-columns"
            label="Select Features (Optional)"
            placeholder="Select columns for PLS-DA (leave empty for all)..."
            options={availableColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`${availableColumns.length} features available`}
          />
        </div>
        
        <div>
          <label className={labelClass}>Class Label Column</label>
          <SingleSelect
            id="label-column"
            value={labelColumn}
            onChange={(value) => setLabelColumn(value || '')}
            options={availableColumns.map((col) => ({ value: col, label: col }))}
          />
          <p className="text-xs text-gray-500 mt-1">
            Column containing group/class labels (e.g., Control vs Treatment)
          </p>
        </div>
        
        <div>
          <label htmlFor="num-components-plsda" className={labelClass}>
            Number of Latent Variables
          </label>
          <input
            type="number"
            id="num-components-plsda"
            min="1"
            max={Math.min(20, availableColumns.length)}
            value={numComponents}
            onChange={(e) => setNumComponents(parseInt(e.target.value) || 2)}
            className={inputClass}
          />
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What PLS-DA does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Supervised method using class information</li>
            <li>• Maximizes separation between groups</li>
            <li>• Useful for classification and biomarker discovery</li>
            <li>• Outputs latent variables (LVs) that discriminate classes</li>
          </ul>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!labelColumn}
          onClick={runPLSDA}
        >
          Run PLS-DA
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// t-SNE - t-Distributed Stochastic Neighbor Embedding
// --------------------------------------------------- 

export const TsneLearning: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ 
  // dataColumns, 
  actionId, 
  // dataRows, 
  allColumnarData, 
  onSuccess, 
  onError 
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [numDimensions, setNumDimensions] = useState<number>(2);
  const [perplexity, setPerplexity] = useState<number>(30);
  const [iterations, setIterations] = useState<number>(1000);
  const [error, setError] = useState<string | null>(null);

  const runTSNE = async () => {
    setError(null);
    
    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToUse.length < 2) {
      setError("t-SNE requires at least 2 features (columns).");
      onError?.();
      return;
    }
    
    if (perplexity < 5 || perplexity > 50) {
      setError("Perplexity should be between 5 and 50.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      filteredData.set(`__num_dimensions__`, [numDimensions] as unknown as TableMatrix);
      filteredData.set(`__perplexity__`, [perplexity] as unknown as TableMatrix);
      filteredData.set(`__iterations__`, [iterations] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`t-SNE failed: ${errorMessage}`);
      console.error("t-SNE failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>t-SNE - t-Distributed Stochastic Neighbor Embedding</h1>
      <p className={descriptionClass}>
        Non-linear dimensionality reduction excellent for visualizing high-dimensional data and revealing clusters.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="tsne-columns"
            label="Select Features (Optional)"
            placeholder="Select columns for t-SNE (leave empty for all)..."
            options={availableColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`${availableColumns.length} features available`}
          />
        </div>
        
        <div>
          <label htmlFor="num-dimensions-tsne" className={labelClass}>
            Number of Dimensions
          </label>
          <SingleSelect
            id="num-dimensions-tsne"
            value={String(numDimensions)}
            onChange={(value) => setNumDimensions(parseInt(value || '2'))}
            options={[
              { value: '2', label: '2D (Recommended for visualization)' },
              { value: '3', label: '3D' }
            ]}
          />
        </div>
        
        <div>
          <label htmlFor="perplexity-tsne" className={labelClass}>
            Perplexity
          </label>
          <input
            type="number"
            id="perplexity-tsne"
            min="5"
            max="50"
            value={perplexity}
            onChange={(e) => setPerplexity(parseInt(e.target.value) || 30)}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Typical range: 5-50. Higher values consider more neighbors (30 is standard)
          </p>
        </div>
        
        <div>
          <label htmlFor="iterations-tsne" className={labelClass}>
            Number of Iterations
          </label>
          <input
            type="number"
            id="iterations-tsne"
            min="250"
            max="5000"
            step="250"
            value={iterations}
            onChange={(e) => setIterations(parseInt(e.target.value) || 1000)}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            More iterations = better convergence but slower (1000 is typical)
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What t-SNE does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Non-linear dimensionality reduction</li>
            <li>• Preserves local structure and reveals clusters</li>
            <li>• Excellent for visualization of complex data</li>
            <li>• Note: Distances between clusters may not be meaningful</li>
          </ul>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-xs text-yellow-800">
            <strong>⚠️ Note:</strong> t-SNE can be computationally intensive for large datasets and may take several seconds to complete.
          </p>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runTSNE}
        >
          Run t-SNE
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


// ===================================================================
// PTM MODIFICATION OPERATIONS
// ===================================================================

// --------------------------------------------------- 
// ADD PTM
// --------------------------------------------------- 

export const AddPtm: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, dataRows, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const totalRows = dataRows.length;
  
  const [ptmType, setPtmType] = useState<string>('Phosphorylation');
  const [residueType, setResidueType] = useState<string>('S');
  
  // eslint-disable-next-line no-empty-pattern
  const [] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const ptmOptions = [
    { value: 'Phosphorylation', label: 'Phosphorylation (+79.97 Da)', residues: ['S', 'T', 'Y'] },
    { value: 'Acetylation', label: 'Acetylation (+42.01 Da)', residues: ['K'] },
    { value: 'Methylation', label: 'Methylation (+14.02 Da)', residues: ['K', 'R'] },
    { value: 'Ubiquitination', label: 'Ubiquitination (+114.04 Da)', residues: ['K'] },
    { value: 'Oxidation', label: 'Oxidation (+15.99 Da)', residues: ['M', 'W'] },
    { value: 'Deamidation', label: 'Deamidation (+0.98 Da)', residues: ['N', 'Q'] },
    { value: 'Carbamidomethylation', label: 'Carbamidomethylation (+57.02 Da)', residues: ['C'] }
  ];

  const currentPTMOption = ptmOptions.find(opt => opt.value === ptmType);

  const parseRowIndices = (input: string): number[] => {
    if (!input.trim()) return [];
    
    const indices: number[] = [];
    const parts = input.split(',');
    
    parts.forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= Math.min(end, totalRows - 1); i++) {
            if (i >= 0) indices.push(i);
          }
        }
      } else {
        const idx = parseInt(part);
        if (!isNaN(idx) && idx >= 0 && idx < totalRows) {
          indices.push(idx);
        }
      }
    });
    
    return [...new Set(indices)].sort((a, b) => a - b);
  };

  const runAddPTM = async () => {
    setError(null);
    
    const positions = parseRowIndices(selectedRows);
    
    if (positions.length === 0) {
      setError("Please select at least one protein/row to annotate with PTM.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add all columns
      const availableColumns = Array.from(allColumnarData.keys()).filter(col => !col.startsWith('__'));
      availableColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      // Add PTM parameters
      filteredData.set(`__ptm_type__`, [ptmType] as unknown as TableMatrix);
      filteredData.set(`__ptm_positions__`, positions as unknown as TableMatrix);
      filteredData.set(`__ptm_residue__`, [residueType] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to add PTM: ${errorMessage}`);
      console.error("Add PTM failed:", err);
      onError?.();
    }
  };

  const parsedPositions = parseRowIndices(selectedRows);

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Add PTM - Post-Translational Modification</h1>
      <p className={descriptionClass}>
        Annotate proteins with post-translational modifications (phosphorylation, acetylation, etc.).
      </p>
      
      <div className="space-y-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Dataset:</strong> {totalRows} proteins available for PTM annotation
          </p>
        </div>
        
        <div>
          <label className={labelClass}>PTM Type</label>
          <SingleSelect
            id="ptm-type"
            value={ptmType}
            onChange={(value) => {
              setPtmType(value || 'Phosphorylation');
              const option = ptmOptions.find(opt => opt.value === value);
              if (option && option.residues.length > 0) {
                setResidueType(option.residues[0]);
              }
            }}
            options={ptmOptions.map(opt => ({ value: opt.value, label: opt.label }))}
          />
        </div>
        
        <div>
          <label className={labelClass}>Target Residue</label>
          <SingleSelect
            id="residue-type"
            value={residueType}
            onChange={(value) => setResidueType(value || 'S')}
            options={(currentPTMOption?.residues || ['S']).map(res => ({ 
              value: res, 
              label: res 
            }))}
          />
          <p className="text-xs text-gray-500 mt-1">
            Common target residues for {ptmType}
          </p>
        </div>
        
        <div>
          <label htmlFor="selected-rows-ptm" className={labelClass}>
            Select Proteins/Rows
          </label>
          <input
            type="text"
            id="selected-rows-ptm"
            value={selectedRows}
            onChange={(e) => setSelectedRows(e.target.value)}
            placeholder="e.g., 0,5,10-15,20"
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter row indices (0-based) separated by commas. Use ranges like "10-15".
            Valid range: 0 to {totalRows - 1}
          </p>
        </div>
        
        {parsedPositions.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm font-medium text-green-900">
              Preview: Adding {ptmType} to {parsedPositions.length} protein{parsedPositions.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-green-800 mt-1">
              Rows: {parsedPositions.slice(0, 20).join(', ')}
              {parsedPositions.length > 20 && ` ... and ${parsedPositions.length - 20} more`}
            </p>
            <p className="text-xs text-green-800">
              Mass shift: +{COMMON_PTMS[ptmType]?.toFixed(2) || '0.00'} Da at residue {residueType}
            </p>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> PTM annotations are stored as metadata and can be used for filtering, 
            analysis, and visualization. The underlying data values remain unchanged.
          </p>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={parsedPositions.length === 0}
          onClick={runAddPTM}
        >
          Add PTM to {parsedPositions.length} Protein{parsedPositions.length !== 1 ? 's' : ''}
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// REMOVE PTM
// --------------------------------------------------- 

export const RemovePtm: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, dataRows, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const totalRows = dataRows.length;
  
  const [removalMode, setRemovalMode] = useState<string>('by-type');
  const [selectedPTMTypes, setSelectedPTMTypes] = useState<string[]>([]);
  const [positionInput, setPositionInput] = useState<string>('');
  const [confirmRemoval, setConfirmRemoval] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const ptmTypeOptions = [
    'Phosphorylation',
    'Acetylation',
    'Methylation',
    'Ubiquitination',
    'Oxidation',
    'Deamidation',
    'Carbamidomethylation'
  ];

  const parseRowIndices = (input: string): number[] => {
    if (!input.trim()) return [];
    
    const indices: number[] = [];
    const parts = input.split(',');
    
    parts.forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= Math.min(end, totalRows - 1); i++) {
            if (i >= 0) indices.push(i);
          }
        }
      } else {
        const idx = parseInt(part);
        if (!isNaN(idx) && idx >= 0 && idx < totalRows) {
          indices.push(idx);
        }
      }
    });
    
    return [...new Set(indices)].sort((a, b) => a - b);
  };

  const runRemovePTM = async () => {
    setError(null);
    
    if (!confirmRemoval) {
      setError("Please confirm PTM removal by checking the checkbox.");
      onError?.();
      return;
    }
    
    if (removalMode === 'by-type' && selectedPTMTypes.length === 0) {
      setError("Please select at least one PTM type to remove.");
      onError?.();
      return;
    }
    
    if (removalMode === 'by-position' && !positionInput.trim()) {
      setError("Please specify positions for PTM removal.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      // Add all columns
      const availableColumns = Array.from(allColumnarData.keys()).filter(col => !col.startsWith('__'));
      availableColumns.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      // Add removal parameters
      if (removalMode === 'by-type') {
        filteredData.set(`__remove_ptm_types__`, selectedPTMTypes as unknown as TableMatrix);
      } else if (removalMode === 'by-position') {
        const positions = parseRowIndices(positionInput);
        filteredData.set(`__remove_positions__`, positions as unknown as TableMatrix);
      } else if (removalMode === 'all') {
        filteredData.set(`__remove_ptm_types__`, ptmTypeOptions as unknown as TableMatrix);
      }
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to remove PTM: ${errorMessage}`);
      console.error("Remove PTM failed:", err);
      onError?.();
    }
  };

  const parsedPositions = removalMode === 'by-position' ? parseRowIndices(positionInput) : [];

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Remove PTM - Post-Translational Modification</h1>
      <p className={descriptionClass}>
        Remove PTM annotations from proteins by type, position, or remove all modifications.
      </p>
      
      <div className="space-y-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Dataset:</strong> {totalRows} proteins
          </p>
        </div>
        
        <div>
          <label className={labelClass}>Removal Mode</label>
          <SingleSelect
            id="removal-mode"
            value={removalMode}
            onChange={(value) => setRemovalMode(value || 'by-type')}
            options={[
              { value: 'by-type', label: 'Remove by PTM Type' },
              { value: 'by-position', label: 'Remove by Position' },
              { value: 'all', label: 'Remove All PTMs' }
            ]}
          />
        </div>
        
        {removalMode === 'by-type' && (
          <div>
            <MultiSelect
              id="ptm-types-remove"
              label="Select PTM Types to Remove"
              placeholder="Select PTM types..."
              options={ptmTypeOptions.map((type) => ({ 
                value: type, 
                label: `${type} (+${COMMON_PTMS[type]?.toFixed(2) || '0.00'} Da)`,
                disabled: false 
              }))}
              value={selectedPTMTypes}
              onChange={setSelectedPTMTypes}
              helperText="Select one or more PTM types to remove from all proteins"
            />
          </div>
        )}
        
        {removalMode === 'by-position' && (
          <div>
            <label htmlFor="position-input-remove" className={labelClass}>
              Protein/Row Positions
            </label>
            <input
              type="text"
              id="position-input-remove"
              value={positionInput}
              onChange={(e) => setPositionInput(e.target.value)}
              placeholder="e.g., 0,5,10-15,20"
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">
              Remove all PTMs from these specific rows. Valid range: 0 to {totalRows - 1}
            </p>
          </div>
        )}
        
        {removalMode === 'by-type' && selectedPTMTypes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm font-medium text-yellow-900">
              Preview: Removing {selectedPTMTypes.length} PTM type{selectedPTMTypes.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-yellow-800 mt-1">
              Types: {selectedPTMTypes.join(', ')}
            </p>
          </div>
        )}
        
        {removalMode === 'by-position' && parsedPositions.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm font-medium text-yellow-900">
              Preview: Removing PTMs from {parsedPositions.length} protein{parsedPositions.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-yellow-800 mt-1">
              Rows: {parsedPositions.slice(0, 20).join(', ')}
              {parsedPositions.length > 20 && ` ... and ${parsedPositions.length - 20} more`}
            </p>
          </div>
        )}
        
        {removalMode === 'all' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm font-bold text-red-900">
              ⚠️ Warning: This will remove ALL PTM annotations from all proteins!
            </p>
          </div>
        )}
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="confirm-remove-ptm"
            checked={confirmRemoval}
            onChange={(e) => setConfirmRemoval(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="confirm-remove-ptm" className="text-sm font-medium text-gray-700">
            I confirm I want to remove these PTM annotations
          </label>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!confirmRemoval || (removalMode === 'by-type' && selectedPTMTypes.length === 0)}
          onClick={runRemovePTM}
        >
          Remove PTM Annotations
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


/*---------------------------------------------------
GO ANALYSIS VALUES
----------------------------------------------------*/

export const GoAnalysis = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>GO Analysis</h1>
    <p className={descriptionClass}>
      Performs Gene Ontology (GO) enrichment analysis on a gene list.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="go-analysis-genes" className={labelClass}>
          Gene List
        </label>
        <textarea
          id="go-analysis-genes"
          rows={4}
          className={inputClass}
          placeholder="Enter gene symbols, one per line"
        ></textarea>
      </div>
      <div>
        <label htmlFor="go-analysis-species" className={labelClass}>
          Species
        </label>
        <input
          type="text"
          id="go-analysis-species"
          placeholder="e.g., Human, Mouse"
          className={inputClass}
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run GO Analysis</button>
    </div>
  </div>
);

/*---------------------------------------------------
PATHWAY ANALYSIS VALUES
----------------------------------------------------*/

export const PathwayAnalysis = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Pathway Analysis</h1>
    <p className={descriptionClass}>
      Performs pathway enrichment analysis on a gene list.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="pathway-analysis-genes" className={labelClass}>
          Gene List
        </label>
        <textarea
          id="pathway-analysis-genes"
          rows={4}
          className={inputClass}
          placeholder="Enter gene symbols, one per line"
        ></textarea>
      </div>
      <div>
        <SingleSelect
          id="pathway-analysis-db"
          label={`Pathway Database`}
          placeholder="Select data columns to analyze..."
          options={["KEGG", "Reactome"].map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the Pathway"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Pathway Analysis</button>
    </div>
  </div>
);

// ===================================================================
// CLUSTERING / PCA OPERATIONS
// ===================================================================

// Common types
interface ClusteringComponentProps {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}

// --------------------------------------------------- 
// K-MEANS CLUSTERING
// --------------------------------------------------- 

export const KMeansClustering: React.FC<ClusteringComponentProps> = ({
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [k, setK] = useState<number>(3);
  const [maxIterations, setMaxIterations] = useState<number>(100);
  const [error, setError] = useState<string | null>(null);

  const runKMeans = async () => {
    setError(null);
    
    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToUse.length < 1) {
      setError("Please select at least one feature column.");
      onError?.();
      return;
    }
    
    if (k < 2 || k > dataRows.length) {
      setError(`K must be between 2 and ${dataRows.length}.`);
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      filteredData.set('__k__', [k] as unknown as TableMatrix);
      filteredData.set('__max_iterations__', [maxIterations] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`K-Means failed: ${errorMessage}`);
      console.error("K-Means failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>K-Means Clustering</h1>
      <p className={descriptionClass}>
        Partition data into K clusters by minimizing within-cluster variance.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="kmeans-columns"
            label="Select Features (Optional)"
            placeholder="Select columns for clustering (leave empty for all)..."
            options={availableColumns.map((curr) => ({ 
              value: curr, 
              label: curr, 
              disabled: false 
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`${availableColumns.length} features available`}
          />
        </div>
        
        <div>
          <label htmlFor="k-value" className={labelClass}>
            Number of Clusters (K)
          </label>
          <input
            type="number"
            id="k-value"
            min="2"
            max={Math.min(50, dataRows.length)}
            value={k}
            onChange={(e) => setK(parseInt(e.target.value) || 3)}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Typical range: 2-10 clusters
          </p>
        </div>
        
        <div>
          <label htmlFor="max-iterations" className={labelClass}>
            Maximum Iterations
          </label>
          <input
            type="number"
            id="max-iterations"
            min="10"
            max="1000"
            step="10"
            value={maxIterations}
            onChange={(e) => setMaxIterations(parseInt(e.target.value) || 100)}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Higher values allow better convergence (100 is typical)
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What K-Means does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Partitions data into K distinct, non-overlapping clusters</li>
            <li>• Minimizes within-cluster sum of squares (inertia)</li>
            <li>• Fast and scalable for large datasets</li>
            <li>• Works best with spherical, evenly-sized clusters</li>
          </ul>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runKMeans}
        >
          Run K-Means Clustering
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// HIERARCHICAL CLUSTERING
// --------------------------------------------------- 

export const HierarchicalClustering: React.FC<ClusteringComponentProps> = ({
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [numClusters, setNumClusters] = useState<number>(3);
  const [linkage, setLinkage] = useState<string>('average');
  const [error, setError] = useState<string | null>(null);

  const runHierarchical = async () => {
    setError(null);
    
    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToUse.length < 1) {
      setError("Please select at least one feature column.");
      onError?.();
      return;
    }
    
    if (numClusters < 2 || numClusters > dataRows.length) {
      setError(`Number of clusters must be between 2 and ${dataRows.length}.`);
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      filteredData.set('__num_clusters__', [numClusters] as unknown as TableMatrix);
      filteredData.set('__linkage__', [linkage] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Hierarchical Clustering failed: ${errorMessage}`);
      console.error("Hierarchical Clustering failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Hierarchical Clustering</h1>
      <p className={descriptionClass}>
        Build a hierarchy of clusters using agglomerative (bottom-up) approach.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="hierarchical-columns"
            label="Select Features (Optional)"
            placeholder="Select columns for clustering (leave empty for all)..."
            options={availableColumns.map((curr) => ({ 
              value: curr, 
              label: curr, 
              disabled: false 
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`${availableColumns.length} features available`}
          />
        </div>
        
        <div>
          <label htmlFor="num-clusters-hier" className={labelClass}>
            Number of Clusters
          </label>
          <input
            type="number"
            id="num-clusters-hier"
            min="2"
            max={Math.min(50, dataRows.length)}
            value={numClusters}
            onChange={(e) => setNumClusters(parseInt(e.target.value) || 3)}
            className={inputClass}
          />
        </div>
        
        <div>
          <label className={labelClass}>Linkage Method</label>
          <SingleSelect
            id="linkage-method"
            value={linkage}
            onChange={(value) => setLinkage(value || 'average')}
            options={[
              { value: 'single', label: 'Single (Minimum distance)' },
              { value: 'complete', label: 'Complete (Maximum distance)' },
              { value: 'average', label: 'Average (UPGMA)' }
            ]}
          />
          <p className="text-xs text-gray-500 mt-1">
            Determines how cluster distance is calculated
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What Hierarchical Clustering does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Builds a tree-like structure (dendrogram) of clusters</li>
            <li>• No need to specify K in advance (cut tree at desired height)</li>
            <li>• Reveals hierarchical relationships in data</li>
            <li>• Computationally intensive for large datasets</li>
          </ul>
        </div>
        
        {dataRows.length > 1000 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-xs text-yellow-800">
              <strong>⚠️ Warning:</strong> Your dataset has {dataRows.length} samples. 
              Hierarchical clustering may take significant time for large datasets.
            </p>
          </div>
        )}
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runHierarchical}
        >
          Run Hierarchical Clustering
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// PCA CLUSTERING
// --------------------------------------------------- 

export const PCAClustering: React.FC<ClusteringComponentProps> = ({
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [numComponents, setNumComponents] = useState<number>(2);
  const [performClustering, setPerformClustering] = useState<boolean>(false);
  const [k, setK] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);

  const runPCAClustering = async () => {
    setError(null);
    
    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToUse.length < 2) {
      setError("PCA requires at least 2 features.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      filteredData.set('__num_components__', [numComponents] as unknown as TableMatrix);
      filteredData.set('__perform_clustering__', [performClustering] as unknown as TableMatrix);
      filteredData.set('__k__', [k] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`PCA Clustering failed: ${errorMessage}`);
      console.error("PCA Clustering failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>PCA with Optional Clustering</h1>
      <p className={descriptionClass}>
        Reduce dimensionality with PCA, optionally followed by K-Means clustering.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="pca-clustering-columns"
            label="Select Features (Optional)"
            placeholder="Select columns for PCA (leave empty for all)..."
            options={availableColumns.map((curr) => ({ 
              value: curr, 
              label: curr, 
              disabled: false 
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`${availableColumns.length} features available`}
          />
        </div>
        
        <div>
          <label htmlFor="num-components-pca-cluster" className={labelClass}>
            Number of Principal Components
          </label>
          <input
            type="number"
            id="num-components-pca-cluster"
            min="2"
            max={Math.min(20, availableColumns.length)}
            value={numComponents}
            onChange={(e) => setNumComponents(parseInt(e.target.value) || 2)}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            2-3 components for visualization, more for analysis
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="perform-clustering-checkbox"
            checked={performClustering}
            onChange={(e) => setPerformClustering(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="perform-clustering-checkbox" className="text-sm font-medium text-gray-700">
            Perform K-Means clustering on PCA results
          </label>
        </div>
        
        {performClustering && (
          <div className="ml-7">
            <label htmlFor="k-value-pca" className={labelClass}>
              Number of Clusters (K)
            </label>
            <input
              type="number"
              id="k-value-pca"
              min="2"
              max={Math.min(20, dataRows.length)}
              value={k}
              onChange={(e) => setK(parseInt(e.target.value) || 3)}
              className={inputClass}
            />
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What PCA + Clustering does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• First: Reduces dimensionality to principal components</li>
            <li>• Removes noise and collinearity</li>
            <li>• Then (optional): Clusters samples in reduced space</li>
            <li>• Often improves clustering quality by removing irrelevant features</li>
          </ul>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runPCAClustering}
        >
          Run PCA {performClustering && '+ K-Means'}
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// 2D - TWO-DIMENSIONAL PCA PROJECTION
// --------------------------------------------------- 

export const TwoDEmbedding: React.FC<StatisticalComponentProps> = ({
  actionId,
  dataColumns,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}) => {
  const { performAnalysis } = useStatisticalAnalysis();

  const availableColumns = useMemo(
    () => [...getNumericColumnsOptimized(dataColumns, dataRows)],
    [dataColumns, dataRows]
  );

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runTwoD = async () => {
    setError(null);

    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;

    if (columnsToUse.length < 2) {
      setError("2D requires at least two feature columns.");
      return;
    }
    if (dataRows.length < 2) {
      setError("2D requires at least two rows of data.");
      return;
    }

    try {
      const filteredData = new Map<string, TableMatrix>();

      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`2D failed: ${errorMessage}`);
      console.error("2D failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>2D Projection</h1>
      <p className={descriptionClass}>
        Projects the selected features into a two-dimensional space (PC1, PC2)
        using principal component analysis for visualization and analysis.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="2d-columns"
            label="Select Features"
            placeholder="Select columns for 2D projection (leave empty for all)..."
            options={availableColumns.map((curr) => ({ 
              value: curr, 
              label: curr, 
              disabled: false 
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`${availableColumns.length} features available. Requires at least two.`}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What the 2D projection does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Reduces the data to its two most informative principal components</li>
            <li>• Produces PC1 and PC2 columns for plotting and exploration</li>
            <li>• Preserves the most variance in a single 2D view</li>
            <li>• Requires at least two numeric feature columns</li>
          </ul>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runTwoD}
        >
          Compute 2D Projection
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// pμ - P-VALUE / MEAN TEST
// --------------------------------------------------- 

export const PmuTest: React.FC<StatisticalComponentProps> = ({
  actionId,
  dataColumns,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runPmuTest = async () => {
    setError(null);

    if (selectedColumns.length === 0) {
      setError("Please select at least two numeric columns.");
      return;
    }

    if (selectedColumns.length < 2) {
      setError("pμ requires at least two numeric columns.");
      return;
    }

    try {
      const filteredData = new Map<string, TableMatrix>();

      selectedColumns.forEach((column) => {
        const values = allColumnarData.get(column);
        if (values) filteredData.set(column, values);
      });

      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`pμ test failed: ${errorMessage}`);
      console.error("pμ test failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>pμ Test</h1>
      <p className={descriptionClass}>
        For each matrix row, computes the mean (μ) and a two-sided p-value
        across the selected columns using a one-sample t-test against zero.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="pmu-columns"
            label="Select Columns"
            placeholder="Select data columns to test..."
            options={numericColumns.map((column) => ({
              value: column,
              label: column,
              disabled: false,
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText="Choose at least two numeric columns to compute row-wise μ and p-value columns"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What the pμ test does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• μ is the row mean across the selected columns</li>
            <li>• The p-value comes from a one-sample t-test compared to 0</li>
            <li>• Helps assess whether each row differs significantly from zero</li>
            <li>• Appends a μ column and a p-value column to the matrix</li>
          </ul>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={selectedColumns.length < 2}
          onClick={runPmuTest}
        >
          Run pμ Test
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// ===================================================================
// NORMALIZATION OPERATIONS
// ===================================================================

interface NormalizationComponentProps {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}

// --------------------------------------------------- 
// Z-SCORE NORMALIZATION
// --------------------------------------------------- 

export const ZScoreNormalization: React.FC<NormalizationComponentProps> = ({
  actionId,
  allColumnarData,
  onSuccess,
  onError
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runZScore = async () => {
    setError(null);
    
    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToUse.length < 1) {
      setError("Please select at least one column to normalize.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Z-Score normalization failed: ${errorMessage}`);
      console.error("Z-Score failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Z-Score Normalization</h1>
      <p className={descriptionClass}>
        Standardize data to have mean = 0 and standard deviation = 1.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="zscore-columns"
            label="Select Columns (Optional)"
            placeholder="Select columns to normalize (leave empty for all)..."
            options={availableColumns.map((curr) => ({ 
              value: curr, 
              label: curr, 
              disabled: false 
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`${availableColumns.length} columns available`}
          />
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What Z-Score does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Transforms data to have mean = 0 and standard deviation = 1</li>
            <li>• Formula: z = (x - μ) / σ</li>
            <li>• Makes data comparable across different scales</li>
            <li>• Useful before machine learning algorithms</li>
          </ul>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runZScore}
        >
          Apply Z-Score Normalization
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// LOG TRANSFORM
// --------------------------------------------------- 

export const LogTransform: React.FC<NormalizationComponentProps> = ({
  actionId,
  allColumnarData,
  onSuccess,
  onError
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [logBase, setLogBase] = useState<string>('log2');
  const [pseudocount, setPseudocount] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const runLogTransform = async () => {
    setError(null);
    
    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToUse.length < 1) {
      setError("Please select at least one column to transform.");
      onError?.();
      return;
    }
    
    if (pseudocount < 0) {
      setError("Pseudocount must be non-negative.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      filteredData.set('__log_base__', [logBase] as unknown as TableMatrix);
      filteredData.set('__pseudocount__', [pseudocount] as unknown as TableMatrix);
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Log Transform failed: ${errorMessage}`);
      console.error("Log Transform failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Log Transform</h1>
      <p className={descriptionClass}>
        Apply logarithmic transformation to reduce skewness and stabilize variance.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="log-columns"
            label="Select Columns (Optional)"
            placeholder="Select columns to transform (leave empty for all)..."
            options={availableColumns.map((curr) => ({ 
              value: curr, 
              label: curr, 
              disabled: false 
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`${availableColumns.length} columns available`}
          />
        </div>
        
        <div>
          <label className={labelClass}>Logarithm Base</label>
          <SingleSelect
            id="log-base"
            value={logBase}
            onChange={(value) => setLogBase(value || 'log2')}
            options={[
              { value: 'log2', label: 'Log2 (Common in genomics)' },
              { value: 'log10', label: 'Log10 (Base 10)' },
              { value: 'ln', label: 'Natural Log (ln)' }
            ]}
          />
        </div>
        
        <div>
          <label htmlFor="pseudocount" className={labelClass}>
            Pseudocount
          </label>
          <input
            type="number"
            id="pseudocount"
            min="0"
            step="0.1"
            value={pseudocount}
            onChange={(e) => setPseudocount(parseFloat(e.target.value) || 1)}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Added to avoid log(0). Typical values: 0.1, 0.5, or 1
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What Log Transform does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Reduces right-skewness in data distributions</li>
            <li>• Stabilizes variance across different magnitude ranges</li>
            <li>• Makes multiplicative relationships additive</li>
            <li>• Common in proteomics and genomics for intensity data</li>
          </ul>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runLogTransform}
        >
          Apply Log Transform
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// QUANTILE NORMALIZATION
// --------------------------------------------------- 

export const QuantileNormalization: React.FC<NormalizationComponentProps> = ({
  actionId,
  allColumnarData,
  onSuccess,
  onError
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runQuantile = async () => {
    setError(null);
    
    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToUse.length < 2) {
      setError("Quantile normalization requires at least 2 columns.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Quantile normalization failed: ${errorMessage}`);
      console.error("Quantile normalization failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Quantile Normalization</h1>
      <p className={descriptionClass}>
        Make the distribution of values identical across all selected columns.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="quantile-columns"
            label="Select Columns (Optional)"
            placeholder="Select columns to normalize (leave empty for all)..."
            options={availableColumns.map((curr) => ({ 
              value: curr, 
              label: curr, 
              disabled: false 
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`${availableColumns.length} columns available. Min 2 required.`}
          />
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What Quantile Normalization does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Forces all columns to have identical distributions</li>
            <li>• Ranks values within each column, then averages across ranks</li>
            <li>• Removes systematic differences between samples/columns</li>
            <li>• Widely used in microarray and proteomics data normalization</li>
          </ul>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Quantile normalization assumes that the biological distribution 
            should be similar across samples. Use with caution if samples are expected to be very different.
          </p>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runQuantile}
        >
          Apply Quantile Normalization
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

// --------------------------------------------------- 
// MEAN CENTERING
// --------------------------------------------------- 

export const MeanCentering: React.FC<NormalizationComponentProps> = ({
  actionId,
  allColumnarData,
  onSuccess,
  onError
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runMeanCentering = async () => {
    setError(null);
    
    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;
    
    if (columnsToUse.length < 1) {
      setError("Please select at least one column to center.");
      onError?.();
      return;
    }
    
    try {
      const filteredData = new Map<string, TableMatrix>();
      
      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });
      
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Mean Centering failed: ${errorMessage}`);
      console.error("Mean Centering failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Mean Centering</h1>
      <p className={descriptionClass}>
        Center data around zero by subtracting the mean from each value.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="center-columns"
            label="Select Columns (Optional)"
            placeholder="Select columns to center (leave empty for all)..."
            options={availableColumns.map((curr) => ({ 
              value: curr, 
              label: curr, 
              disabled: false 
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`${availableColumns.length} columns available`}
          />
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What Mean Centering does:</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Subtracts the mean from each value: x' = x - μ</li>
            <li>• Results in data centered around zero (mean = 0)</li>
            <li>• Does NOT change the scale or standard deviation</li>
            <li>• Useful for PCA and other multivariate analyses</li>
          </ul>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="flex justify-end">
        <AnalysisSubmitButton
          onClick={runMeanCentering}
        >
          Apply Mean Centering
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


/*---------------------------------------------------
QCPLOT VALUES
----------------------------------------------------*/

export const QcPlot = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>QC Plot</h1>
    <p className={descriptionClass}>
      Generates a quality control plot to assess data quality.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="qc-plot-type"
        label={`Select Plot Type`}
        placeholder="Select data columns to analyze..."
        options={["Box Plot", "Density Plot"].map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to delete from your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

/*---------------------------------------------------
MISSING VALUES PLOT
----------------------------------------------------*/

export const MissingValuesPlot = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Missing Values Plot</h1>
    <p className={descriptionClass}>
      Generates a plot to visualize the pattern of missing values.
    </p>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

// ===================================================================
// F-TEST - Like Z-Score pattern
// ===================================================================
export const FTest: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();

  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter((col) => !col.startsWith("_"));
  }, [allColumnarData]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runFTest = async () => {
    setError(null);

    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;

    if (columnsToUse.length < 2) {
      setError("F-Test requires at least 2 columns of data.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map<string, TableMatrix>();

      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });

      if (filteredData.size < 2) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the F-Test calculation. Please check your data.");
      console.error("F-Test calculation failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>F-Test</h1>
      <p className={descriptionClass}>
        Performs a statistical F-test to compare the variances of two groups and determine if they are significantly different.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="ftest-columns"
            label="Select Columns"
            placeholder="Select columns to analyze (leave empty for all)..."
            options={availableColumns.map((curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`Choose at least 2 numeric columns for F-Test comparison. ${availableColumns.length} columns available`}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What F-Test does</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Compares variances between two or more groups</li>
            <li>• Tests if groups have significantly different spreads</li>
            <li>• H0: Variances are equal, H1: Variances are different</li>
            <li>• Returns F-statistic and p-value for hypothesis testing</li>
          </ul>
        </div>

        {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}

        <div className="flex justify-end">
          <AnalysisSubmitButton onClick={runFTest}>
            Run F-Test
          </AnalysisSubmitButton>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// CHI-SQUARE TEST - Like Z-Score pattern
// ===================================================================
export const ChiSquareTest: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();

  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter((col) => !col.startsWith("_"));
  }, [allColumnarData]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runChiSquareTest = async () => {
    setError(null);

    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;

    if (columnsToUse.length < 1) {
      setError("Chi-Square test requires at least 1 column of frequency data.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map<string, TableMatrix>();

      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });

      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the Chi-Square test. Please check your data.");
      console.error("Chi-Square test failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Chi-Square Test</h1>
      <p className={descriptionClass}>
        Performs a Chi-Square test for goodness of fit to determine if observed frequencies differ from expected frequencies.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="chi-square-columns"
            label="Select Columns"
            placeholder="Select frequency columns to analyze (leave empty for all)..."
            options={availableColumns.map((curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`Choose numeric columns containing frequency data. ${availableColumns.length} columns available`}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What Chi-Square does</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Tests goodness of fit for frequency data</li>
            <li>• Compares observed vs. expected frequencies</li>
            <li>• H0: Distribution matches expected, H1: Distribution differs</li>
            <li>• Returns Chi-square statistic and p-value for hypothesis testing</li>
          </ul>
        </div>

        {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}

        <div className="flex justify-end">
          <AnalysisSubmitButton onClick={runChiSquareTest}>
            Run Chi-Square Test
          </AnalysisSubmitButton>
        </div>
      </div>
    </div>
  );
};




// ===================================================================
// Z-SCORE OUTLIER DETECTION COMPONENT
// ===================================================================
export const ZScoreOutlier: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();

  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter((col) => !col.startsWith("_"));
  }, [allColumnarData]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [threshold, setThreshold] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);

  const runZScoreOutlier = async () => {
    setError(null);

    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;

    if (columnsToUse.length === 0) {
      setError("Please select at least one column for outlier detection.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map<string, TableMatrix>();

      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });

      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during Z-Score outlier detection. Please check your data.");
      console.error("Z-Score outlier detection failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Z-Score Outlier Detection</h1>
      <p className={descriptionClass}>
        Detects outliers using Z-Score method. Values with |Z| &gt; threshold are considered outliers.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="zscore-outlier-columns"
            label="Select Columns"
            placeholder="Select columns to analyze (leave empty for all)..."
            options={availableColumns.map((curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`Choose numeric columns for outlier detection. ${availableColumns.length} columns available`}
          />
        </div>

        <div>
          <label htmlFor="zscore-threshold" className={labelClass}>
            Z-Score Threshold
          </label>
          <input
            type="number"
            id="zscore-threshold"
            min="1"
            max="5"
            step="0.1"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value) || 3)}
            className={inputClass}
          />
          <p className="text-sm text-gray-500 mt-1">
            Standard threshold is 3 (99.7% confidence). Lower values = more sensitive.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What Z-Score does</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Measures how many standard deviations away from mean</li>
            <li>• Z = (value - mean) / std_dev</li>
            <li>• |Z| &gt; threshold → outlier</li>
            <li>• Works best for normally distributed data</li>
          </ul>
        </div>

        {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}

        <div className="flex justify-end">
          <AnalysisSubmitButton onClick={runZScoreOutlier}>
            Detect Outliers
          </AnalysisSubmitButton>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// IQR OUTLIER DETECTION COMPONENT
// ===================================================================
export const IQROutlier: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();

  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter((col) => !col.startsWith("_"));
  }, [allColumnarData]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [multiplier, setMultiplier] = useState<number>(1.5);
  const [error, setError] = useState<string | null>(null);

  const runIQROutlier = async () => {
    setError(null);

    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;

    if (columnsToUse.length === 0) {
      setError("Please select at least one column for outlier detection.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map<string, TableMatrix>();

      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });

      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during IQR outlier detection. Please check your data.");
      console.error("IQR outlier detection failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>IQR Outlier Detection</h1>
      <p className={descriptionClass}>
        Detects outliers using Interquartile Range (IQR) method. Values outside Q1 - 1.5×IQR to Q3 + 1.5×IQR are outliers.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="iqr-outlier-columns"
            label="Select Columns"
            placeholder="Select columns to analyze (leave empty for all)..."
            options={availableColumns.map((curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`Choose numeric columns for outlier detection. ${availableColumns.length} columns available`}
          />
        </div>

        <div>
          <label htmlFor="iqr-multiplier" className={labelClass}>
            IQR Multiplier
          </label>
          <input
            type="number"
            id="iqr-multiplier"
            min="0.5"
            max="3"
            step="0.1"
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1.5)}
            className={inputClass}
          />
          <p className="text-sm text-gray-500 mt-1">
            Standard multiplier is 1.5. Higher values = less sensitive to outliers.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What IQR does</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• IQR = Q3 - Q1 (interquartile range)</li>
            <li>• Lower bound = Q1 - multiplier × IQR</li>
            <li>• Upper bound = Q3 + multiplier × IQR</li>
            <li>• Robust to non-normal distributions</li>
          </ul>
        </div>

        {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}

        <div className="flex justify-end">
          <AnalysisSubmitButton onClick={runIQROutlier}>
            Detect Outliers
          </AnalysisSubmitButton>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// GRUBBS' TEST OUTLIER DETECTION COMPONENT
// ===================================================================
export const GrubbsOutlier: React.FC<{
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}> = ({ actionId, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();

  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter((col) => !col.startsWith("_"));
  }, [allColumnarData]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runGrubbsOutlier = async () => {
    setError(null);

    const columnsToUse = selectedColumns.length > 0 ? selectedColumns : availableColumns;

    if (columnsToUse.length === 0) {
      setError("Please select at least one column for outlier detection.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map<string, TableMatrix>();

      columnsToUse.forEach((column) => {
        if (allColumnarData.has(column)) {
          filteredData.set(column, allColumnarData.get(column)!);
        }
      });

      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }

      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during Grubbs' test. Please check your data.");
      console.error("Grubbs' test failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Grubbs' Test</h1>
      <p className={descriptionClass}>
        Detects outliers using Grubbs' test (extreme studentized deviate). Tests one outlier at a time (most extreme value).
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="grubbs-outlier-columns"
            label="Select Columns"
            placeholder="Select columns to analyze (leave empty for all)..."
            options={availableColumns.map((curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText={`Choose numeric columns for outlier detection. ${availableColumns.length} columns available`}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm font-medium text-blue-900">What Grubbs' Test does</p>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>• Tests for single outlier (most extreme value)</li>
            <li>• G = |value - mean| / std_dev</li>
            <li>• Compares G to critical value (α = 0.05)</li>
            <li>• Assumes normally distributed data</li>
            <li>• Requires at least 3 data points</li>
          </ul>
        </div>

        {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}

        <div className="flex justify-end">
          <AnalysisSubmitButton onClick={runGrubbsOutlier}>
            Detect Outliers
          </AnalysisSubmitButton>
        </div>
      </div>
    </div>
  );
};


/*---------------------------------------------------
WGCNA ANALYSIS
----------------------------------------------------*/

export const WgcnaAnalysis = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>WGCNA Analysis</h1>
    <p className={descriptionClass}>
      Runs a Weighted Gene Co-expression Network Analysis (WGCNA).
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <MultiSelect
          id="wgcna-columns"
          label={`Select Columns for Analysis`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={[]}
          onChange={(values) => console.log(values)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
      <div>
        <label htmlFor="wgcna-soft-threshold" className={labelClass}>
          Soft Threshold
        </label>
        <input
          type="number"
          id="wgcna-soft-threshold"
          defaultValue="6"
          className={inputClass}
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run WGCNA</button>
    </div>
  </div>
);

/*---------------------------------------------------
SAVE DATA + EXPORT CSV
Mirrors the export spreadsheet (settings) implementation:
format cards, delimiter, and header/metadata options.
---------------------------------------------------*/

const EXPORT_FORMATS = Object.keys(EXPORT_FORMAT_INFO) as ExportFormat[];

const FORMAT_ICONS: Record<ExportFormat, typeof FileJson> = {
  json: FileJson,
  csv: FileSpreadsheet,
  tsv: FileType2,
  txt: FileText,
  xml: Braces,
  md: Table2,
  sql: Database,
};

const DELIMITER_FORMATS: ExportFormat[] = ["csv", "tsv", "txt"];

const MatrixExportView: React.FC<{
  dataColumns: TableColumns;
  dataRows: ProteinRow[];
  defaultFormat: ExportFormat;
  successMessage: string;
}> = ({ dataColumns, dataRows, defaultFormat, successMessage }) => {
  const styles = exportSheetStyles();
  const {
    settings,
    setDelimiter,
    setIncludeHeaders,
    setIncludeMetadataColumns,
  } = useAppSettings();
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [fileName, setFileName] = useState("my_data");
  const [done, setDone] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const showDelimiter = DELIMITER_FORMATS.includes(format);
  const showHeadersAndFlags = format !== "json" && format !== "xml";

  const delimiterOptions = (
    Object.keys(DELIMITER_LABELS) as CsvDelimiter[]
  ).map((key) => ({ value: key, label: DELIMITER_LABELS[key] }));

  const handleExport = () => {
    try {
      const file = serializeActiveMatrix(dataRows, dataColumns, format, {
        delimiter: settings.delimiter,
        includeHeaders: settings.includeHeaders,
        includeMetadataColumns: settings.includeMetadataColumns,
      });
      const stem = toFilenameSlug(fileName.trim()) || "my_data";
      downloadTextFile(`${stem}.${extensionFor(format)}`, file.mime, file.content);
      setDone(true);
      setExportError(null);
    } catch (err) {
      console.error("Export failed:", err);
      setDone(false);
      setExportError(err instanceof Error ? err.message : "Export failed");
    }
  };

  return (
    <div className={styles.container()}>
      <section className={styles.section()}>
        <h3 className={styles.sectionTitle()}>Format</h3>
        <div
          className={styles.grid()}
          role="group"
          aria-label="Export format"
        >
          {EXPORT_FORMATS.map((fmt) => {
            const Icon = FORMAT_ICONS[fmt];
            const info = EXPORT_FORMAT_INFO[fmt];
            return (
              <SelectionCard
                key={fmt}
                onClick={() => setFormat(fmt)}
                selected={format === fmt}
                icon={<Icon />}
                label={info.label}
                description={info.description}
                title={info.description}
              />
            );
          })}
        </div>
      </section>

      <section className={styles.section()}>
        <label htmlFor="export-file-name" className={labelClass}>
          File Name
        </label>
        <input
          type="text"
          id="export-file-name"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="my_data"
          className={inputClass}
        />
      </section>

      {showDelimiter && (
        <section className={styles.section()}>
          <SingleSelect
            value={settings.delimiter}
            onChange={(value) =>
              value && setDelimiter(value as CsvDelimiter)
            }
            options={delimiterOptions}
            label="Delimiter"
            placeholder="Choose delimiter"
            searchable={false}
          />
        </section>
      )}

      {showHeadersAndFlags && (
        <section className={styles.section()}>
          <h3 className={styles.sectionTitle()}>Options</h3>
          <div className="flex flex-col gap-3">
            <Checkbox
              checked={settings.includeHeaders}
              onChange={(event) =>
                setIncludeHeaders(event.target.checked)
              }
              label="Include header row"
            />
            <Checkbox
              checked={settings.includeMetadataColumns}
              onChange={(event) =>
                setIncludeMetadataColumns(event.target.checked)
              }
              label="Include metadata columns"
            />
          </div>
        </section>
      )}

      {done && (
        <div className="text-green-600 text-sm">{successMessage}</div>
      )}
      {exportError && (
        <div className="text-red-500 text-sm" role="alert">
          {exportError}
        </div>
      )}

      <div className={styles.actionRow()}>
        <Button
          variant="primary"
          className={styles.exportButton()}
          onClick={handleExport}
          disabled={dataRows.length === 0}
        >
          <Download className={styles.buttonIcon()} />
          Export {dataRows.length} rows
        </Button>
      </div>
    </div>
  );
};

export const SaveData = ({
  dataColumns,
  dataRows,
}: {
  dataColumns: TableColumns;
  dataRows: ProteinRow[];
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Save Data</h1>
    <p className={descriptionClass}>
      Saves the current matrix to a downloadable file (JSON by default).
    </p>
    <MatrixExportView
      dataColumns={dataColumns}
      dataRows={dataRows}
      defaultFormat="json"
      successMessage="Data saved successfully"
    />
  </div>
);

export const ExportCsv = ({
  dataColumns,
  dataRows,
}: {
  dataColumns: TableColumns;
  dataRows: ProteinRow[];
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Export CSV</h1>
    <p className={descriptionClass}>
      Exports the current dataset to a CSV file (or pick another format below).
    </p>
    <MatrixExportView
      dataColumns={dataColumns}
      dataRows={dataRows}
      defaultFormat="csv"
      successMessage="CSV exported successfully"
    />
  </div>
);


/*---------------------------------------------------
FX: EXPRESSION f(x)
---------------------------------------------------*/

export const FxExpression = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [expression, setExpression] = useState<string>("x^2 + 2*x + 1");
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setError(null);
    if (!selectedColumn) {
      setError("Please select a column.");
      onError?.();
      return;
    }
    if (!expression.trim()) {
      setError("Please enter a valid expression.");
      onError?.();
      return;
    }
    try {
      const filteredData = new Map<string, TableMatrix>();
      const values = allColumnarData.get(selectedColumn);
      if (values) filteredData.set(selectedColumn, values);
      filteredData.set("__column__", [selectedColumn]);
      filteredData.set("__expression__", [expression]);
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred while evaluating the function.");
      console.error("f(x) evaluation failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Expression f(x)</h1>
      <p className={descriptionClass}>
        Applies a function f(x) to a column. Use `x` for the cell value and
        operators + - * / ^ along with functions like ln, log10, sqrt, abs,
        exp, sin, cos, tan and the constant pi.
      </p>
      <div className="space-y-4 mb-6">
        <SingleSelect
          id="fx-column"
          label="Select Column"
          placeholder="Select a data column..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue=""
          onChange={(value) => setSelectedColumn(value as string)}
          helperText="Choose the column to apply f(x) to"
        />
        <div>
          <label htmlFor="fx-expression" className={labelClass}>
            f(x) Expression
          </label>
          <input
            type="text"
            id="fx-expression"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="e.g. x^2 + 3*x + ln(x)"
            className={inputClass}
          />
        </div>
      </div>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!selectedColumn}
          onClick={runAnalysis}
        >
          Evaluate
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


/*---------------------------------------------------
FX: LINEAR (ax+b)
---------------------------------------------------*/

export const FxLinear = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [a, setA] = useState("1");
  const [b, setB] = useState("0");
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setError(null);
    if (!selectedColumn) {
      setError("Please select a column.");
      onError?.();
      return;
    }
    const factorA = Number(a);
    const factorB = Number(b);
    if (!Number.isFinite(factorA) || !Number.isFinite(factorB)) {
      setError("Invalid values for a or b.");
      onError?.();
      return;
    }
    try {
      const filteredData = new Map<string, TableMatrix>();
      const values = allColumnarData.get(selectedColumn);
      if (values) filteredData.set(selectedColumn, values);
      filteredData.set("__column__", [selectedColumn]);
      filteredData.set("__factor_a__", [factorA]);
      filteredData.set("__factor_b__", [factorB]);
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred while applying the linear mapping.");
      console.error("Linear mapping failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Linear Map: y = a·x + b</h1>
      <p className={descriptionClass}>
        Maps each cell of a column through the linear function y = a·x + b.
      </p>
      <div className="space-y-4 mb-6">
        <SingleSelect
          id="fx-linear-column"
          label="Select Column"
          placeholder="Select a data column..."
          options={numericColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue=""
          onChange={(value) => setSelectedColumn(value as string)}
          helperText="Choose the column to map"
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fx-linear-a" className={labelClass}>
              a (slope)
            </label>
            <input
              type="number"
              id="fx-linear-a"
              value={a}
              onChange={(e) => setA(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="fx-linear-b" className={labelClass}>
              b (intercept)
            </label>
            <input
              type="number"
              id="fx-linear-b"
              value={b}
              onChange={(e) => setB(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={!selectedColumn}
          onClick={runAnalysis}
        >
          Map
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


/*---------------------------------------------------
1D: NORMALIZE
---------------------------------------------------*/

export const OneDNormalize = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setError(null);
    if (selectedColumns.length === 0) {
      setError("Please select at least one column.");
      onError?.();
      return;
    }
    try {
      const filteredData = new Map<string, TableMatrix>();
      selectedColumns.forEach((column) => {
        const values = allColumnarData.get(column);
        if (values) filteredData.set(column, values);
      });
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during 1D normalization.");
      console.error("1D normalize failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>1D Normalize</h1>
      <p className={descriptionClass}>
        Normalizes each selected column independently (min-max scaling).
      </p>
      <div className="mb-6">
        <MultiSelect
          id="1d-normalize-columns"
          label="Select Columns"
          placeholder="Select data columns to normalize..."
          options={numericColumns.map((column) => ({
            value: column,
            label: column,
            disabled: false,
          }))}
          value={selectedColumns}
          onChange={setSelectedColumns}
          helperText="Choose the numeric columns to normalize"
        />
      </div>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={selectedColumns.length === 0}
          onClick={runAnalysis}
        >
          Normalize
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


/*---------------------------------------------------
1D: INDEX
---------------------------------------------------*/

export const OneDIndex = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumns = [...useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  )];

  const runAnalysis = async () => {
    try {
      const filteredData = new Map<string, TableMatrix>();
      numericColumns.forEach((column) => {
        const values = allColumnarData.get(column);
        if (values) filteredData.set(column, values);
      });
      if (filteredData.size === 0) {
        onError?.();
        return;
      }
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      console.error("1D index failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>1D Index</h1>
      <p className={descriptionClass}>
        Appends an index column (1, 2, 3, ...) with one entry per row to the
        matrix.
      </p>
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={numericColumns.length === 0}
          onClick={runAnalysis}
        >
          Add Index
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};


/*---------------------------------------------------
PI: MULTIPLY / DIVIDE
---------------------------------------------------*/

const PiColumnRunner = ({
  actionId,
  dataColumns,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
  multiply,
}: StatisticalComponentProps & { multiply: boolean }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setError(null);
    if (selectedColumns.length === 0) {
      setError("Please select at least one column.");
      onError?.();
      return;
    }
    try {
      const filteredData = new Map<string, TableMatrix>();
      selectedColumns.forEach((column) => {
        const values = allColumnarData.get(column);
        if (values) filteredData.set(column, values);
      });
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred while applying Pi.");
      console.error("Pi operation failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>
        {multiply ? "Multiply by Pi" : "Divide by Pi"}
      </h1>
      <p className={descriptionClass}>
        {multiply
          ? "Appends a new column for each selected column equal to value × π."
          : "Appends a new column for each selected column equal to π ÷ value."}
      </p>
      <div className="mb-6">
        <MultiSelect
          id={`pi-${multiply ? "multiply" : "divide"}-columns`}
          label="Select Columns"
          placeholder="Select data columns..."
          options={numericColumns.map((column) => ({
            value: column,
            label: column,
            disabled: false,
          }))}
          value={selectedColumns}
          onChange={setSelectedColumns}
          helperText="Choose the numeric columns to transform"
        />
      </div>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={selectedColumns.length === 0}
          onClick={runAnalysis}
        >
          Apply
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};

export const PiMultiply = (props: StatisticalComponentProps) => (
  <PiColumnRunner {...props} multiply />
);
export const PiDivide = (props: StatisticalComponentProps) => (
  <PiColumnRunner {...props} multiply={false} />
);


/*---------------------------------------------------
MeanCenteringNormalizationLog
----------------------------------------------------*/

export const MeanCenteringNormalizationLog = ({
  actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>No UI defined for "{actionId}"</h1>
    <p className="text-gray-600">
      This action is not yet implemented with a specific UI view.
    </p>
  </div>
);

/*---------------------------------------------------
TransformNormalization
----------------------------------------------------*/
export const TransformNormalization = ({
  actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
  dataRows: ProteinRow[];
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>No UI defined for "{actionId}"</h1>
    <p className="text-gray-600">
      This action is not yet implemented with a specific UI view.
    </p>
  </div>
);
/*---------------------------------------------------
NO UI FOUND
----------------------------------------------------*/

export const NoUiFound = ({ actionId }: { actionId: StatisticalAction }) => (
  <div className={containerClass}>
    <h1 className={headingClass}>No UI defined for "{actionId}"</h1>
    <p className="text-gray-600">
      This action is not yet implemented with a specific UI view.
    </p>
  </div>
);

/*---------------------------------------------------
Pj
---------------------------------------------------*/
export const Pj = ({
  dataColumns,
  actionId,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: StatisticalComponentProps) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataRows),
    [dataColumns, dataRows]
  );
  const numericColumns = [...numericColumnsSet];
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [mode, setMode] = useState<string>("pi-divide");
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setError(null);
    if (mode === "stub") return;
    if (selectedColumns.length === 0) {
      setError("Please select at least one column.");
      onError?.();
      return;
    }
    try {
      const filteredData = new Map<string, TableMatrix>();
      selectedColumns.forEach((column) => {
        const values = allColumnarData.get(column);
        if (values) filteredData.set(column, values);
      });
      if (filteredData.size === 0) {
        setError("No data found for the selected columns.");
        onError?.();
        return;
      }
      filteredData.set("__pj_mode__", [mode] as unknown as TableMatrix);
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("Pj operation failed.");
      console.error("Pj operation failed:", err);
      onError?.();
    }
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Pj</h1>
      <p className={descriptionClass}>
        Choose the Pj operation you want to run on the selected columns.
      </p>

      <div className="mb-6">
        <span id="pj-operation-label" className={labelClass}>
          Pj Operation
        </span>
        <div
          className="space-y-2"
          role="group"
          aria-labelledby="pj-operation-label"
        >
          {PJ_MODES.map((option) => (
            <SelectionCard
              key={option.id}
              onClick={() => setMode(option.id)}
              selected={mode === option.id}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <MultiSelect
          id="pj-columns"
          label="Select Columns"
          placeholder="Select data columns..."
          options={numericColumns.map((column) => ({
            value: column,
            label: column,
            disabled: false,
          }))}
          value={selectedColumns}
          onChange={setSelectedColumns}
          helperText="Choose the numeric columns to process"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <AnalysisSubmitButton
          disabled={mode === "stub" || selectedColumns.length === 0}
          onClick={runAnalysis}
        >
          Apply
        </AnalysisSubmitButton>
      </div>
    </div>
  );
};
