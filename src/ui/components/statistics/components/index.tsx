import { getNumericColumnsOptimized, mean, toNumber } from "@/app-layer/shared/utils";
import { useStatisticalAnalysis } from "@/app-layer/statistics/hooks/useStatistics";
import { ProteinRow } from "@/domain/proteins/index.types";
import {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import { TableColumns, TableMatrix } from "@/domain/workflow/main.types";
import MultiSelect from "@/ui/design-system/Select/Multi/select";
import SingleSelect from "@/ui/design-system/Select/select";
import { useMemo, useState } from "react";

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

  const runCountCalc = () => {
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

      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runCountCalc}
        >
          Run Count
        </button>
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

  const runCountMissingCalc = () => {
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

      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runCountMissingCalc}
        >
          Run Count Missing
        </button>
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

  const runCountValidCalc = () => {
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

      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runCountValidCalc}
        >
          Run Count Valid
        </button>
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

  const runMeanCalc = () => {
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

      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runMeanCalc}
        >
          Calculate
        </button>
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

  const runMedianCalc = () => {
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

      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runMedianCalc}
        >
          Calculate
        </button>
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

  const runVarianceCalc = () => {
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

      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runVarianceCalc}
        >
          Calculate
        </button>
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

  const runStdDevCalc = () => {
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

      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runStdDevCalc}
        >
          Calculate
        </button>
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

  const runSumCalc = () => {
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

      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runSumCalc}
        >
          Calculate
        </button>
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

  const runProductCalc = () => {
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

      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runProductCalc}
        >
          Calculate
        </button>
      </div>
    </div>
  );
};

/*---------------------------------------------------
MIN COLUMN VALUES
----------------------------------------------------*/

export const Min = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Find Minimum</h1>
    <p className={descriptionClass}>
      Identifies the minimum value in the selected column.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="min-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

/*---------------------------------------------------
MAX COLUMN VALUES
----------------------------------------------------*/

export const Max = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Find Maximum</h1>
    <p className={descriptionClass}>
      Identifies the maximum value in the selected column.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="max-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runFilterCalc}
        >
          Filter
        </button>
      </div>
    </div>
  );
};

/*---------------------------------------------------
COUNT COLUMN VALUES BY MISSING
----------------------------------------------------*/

export const FilterByMissing = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Filter By Missing Values</h1>
    <p className={descriptionClass}>
      Filters rows to show only those with missing values in a specific column.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="filter-missing-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Filter</button>
    </div>
  </div>
);

/*---------------------------------------------------
FILTER COLUMN VALUES BY RANGE
----------------------------------------------------*/

export const FilterByRange = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
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
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      <div>
        <label htmlFor="filter-range-min" className={labelClass}>
          Minimum Value
        </label>
        <input type="number" id="filter-range-min" className={inputClass} />
      </div>
      <div>
        <label htmlFor="filter-range-max" className={labelClass}>
          Maximum Value
        </label>
        <input type="number" id="filter-range-max" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Filter</button>
    </div>
  </div>
);

/*---------------------------------------------------
FILTER COLUMN VALUES BY OUTLIER
----------------------------------------------------*/

export const FilterByOutlier = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Filter By Outliers</h1>
    <p className={descriptionClass}>
      Filters rows to show only the detected outliers in a column.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="filter-outlier-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Filter</button>
    </div>
  </div>
);

/*---------------------------------------------------
ADD COLUMN VALUES
----------------------------------------------------*/

export const AddColumn = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Add New Column</h1>
    <p className={descriptionClass}>
      Creates a new, empty column in the dataset.
    </p>
    <div className="mb-6">
      <label htmlFor="new-column-name" className={labelClass}>
        New Column Name
      </label>
      <input type="text" id="new-column-name" className={inputClass} />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Add Column</button>
    </div>
  </div>
);

export const RenameColumn = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Rename Column</h1>
    <p className={descriptionClass}>Renames an existing column.</p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="old-column-name"
          label={`Old Column Name`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
      <div>
        <label htmlFor="new-column-name-rename" className={labelClass}>
          New Column Name
        </label>
        <input type="text" id="new-column-name-rename" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Rename</button>
    </div>
  </div>
);

/*---------------------------------------------------
DELETE COLUMN VALUES
----------------------------------------------------*/

export const DeleteColumn = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
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
        options={dataColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={dangerButtonClass}>Delete Column</button>
    </div>
  </div>
);

/*---------------------------------------------------
FILL COLUMN VALUES
----------------------------------------------------*/

export const FillColumn = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
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
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
      <div>
        <label htmlFor="fill-value" className={labelClass}>
          Value to Fill
        </label>
        <input type="text" id="fill-value" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Fill Column</button>
    </div>
  </div>
);

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

  const runImputation = () => {
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

      const result = performAnalysis(actionId, filteredData);
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
      <button className={buttonClass} onClick={runImputation}>Run Imputation</button>
    </div>
  </div>
);
}

/*---------------------------------------------------
INPUT MEDIAN COLUMN VALUES
----------------------------------------------------*/

export const ImputeMedian = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Median Imputation</h1>
    <p className={descriptionClass}>
      Fills missing values with the median of the column.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="impute-median-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Imputation</button>
    </div>
  </div>
);

/*---------------------------------------------------
INPUT KNN COLUMN VALUES
----------------------------------------------------*/

export const ImputeKnn = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>KNN Imputation</h1>
    <p className={descriptionClass}>
      Fills missing values using the K-Nearest Neighbors algorithm.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="impute-knn-column"
          label={`Select Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      <div>
        <label htmlFor="impute-knn-k" className={labelClass}>
          Number of Neighbors (k)
        </label>
        <input
          type="number"
          id="impute-knn-k"
          defaultValue="5"
          className={inputClass}
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Imputation</button>
    </div>
  </div>
);

/*---------------------------------------------------
INPUT ZERO COLUMN VALUES
----------------------------------------------------*/

export const ImputeZero = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Zero Imputation</h1>
    <p className={descriptionClass}>
      Fills missing values with the value zero.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="impute-zero-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Imputation</button>
    </div>
  </div>
);

/*---------------------------------------------------
COUNT COLUMN VALUES
----------------------------------------------------*/

export const MovingAverage = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Moving Average</h1>
    <p className={descriptionClass}>
      Calculates the moving average for a time series data column.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="ma-column"
          label={`Select Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
      <div>
        <label htmlFor="ma-window" className={labelClass}>
          Window Size
        </label>
        <input
          type="number"
          id="ma-window"
          defaultValue="5"
          className={inputClass}
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

/*---------------------------------------------------
ROLLING STDDEV COLUMN VALUES
----------------------------------------------------*/

export const RollingStdDev = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Rolling Standard Deviation</h1>
    <p className={descriptionClass}>
      Calculates the rolling standard deviation for a time series data column.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="rolling-stddev-column"
          label={`Select Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
      <div>
        <label htmlFor="rolling-stddev-window" className={labelClass}>
          Window Size
        </label>
        <input
          type="number"
          id="rolling-stddev-window"
          defaultValue="5"
          className={inputClass}
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate</button>
    </div>
  </div>
);

/*---------------------------------------------------
TTEST COLUMN VALUES
----------------------------------------------------*/

export const TTest = ({
  actionId,
  dataColumns,
  dataRows,
  allColumnarData,
  onSuccess,
  onError,
}: {
  actionId: StatisticalAction;
  dataColumns: TableColumns;
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

  const [firstGroup, setFirstGroup] = useState(numericColumns[0] || "");
  const [secondGroup, setSecondGroup] = useState(numericColumns[1] || "");
  const [error, setError] = useState<string | null>(null);

  const runTTEST = () => {
    setError(null);

    if (!firstGroup || !secondGroup) {
      setError("Please select two groups to perform the T-Test.");
      onError?.();
      return;
    }

    if (firstGroup === secondGroup) {
      setError("Please select two different groups for the T-Test.");
      onError?.();
      return;
    }

    try {
      const filteredData = new Map();
      if (allColumnarData.has(firstGroup)) {
        filteredData.set(firstGroup, allColumnarData.get(firstGroup));
      }
      if (allColumnarData.has(secondGroup)) {
        filteredData.set(secondGroup, allColumnarData.get(secondGroup));
      }

      if (filteredData.size < 2) {
        setError("The selected groups were not found in the data.");
        onError?.();
        return;
      }

      const result = performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the T-Test. Please check your data.");
      console.error("T-Test failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled =
    !firstGroup || !secondGroup || firstGroup === secondGroup;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>T-Test</h1>
      <p className={descriptionClass}>
        Performs a T-Test to compare the means of two groups.
      </p>
      <div className="space-y-4 mb-6">
        <div>
          <SingleSelect
            id="ttest-column-1"
            label={`Select First Numeric Column`}
            placeholder="Select data columns to analyze..."
            options={numericColumns.map((curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            }))}
            value={firstGroup}
            onChange={(value) => setFirstGroup(value as string)}
            helperText="Choose the numeric columns you want to include in your analysis"
          />
        </div>
        <div>
          <SingleSelect
            id="ttest-column-2"
            label={`Select Second Numeric Column`}
            placeholder="Select data columns to analyze..."
            options={numericColumns.map((curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            }))}
            value={secondGroup}
            onChange={(value) => setSecondGroup(value as string)}
            helperText="Choose the numeric columns you want to include in your analysis"
          />
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runTTEST}
        >
          Run T-Test
        </button>
      </div>
    </div>
  );
};

/*---------------------------------------------------
ANOVA COLUMN VALUES
----------------------------------------------------*/

export const Anova = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>ANOVA</h1>
    <p className={descriptionClass}>
      Performs an Analysis of Variance (ANOVA) to compare means across multiple
      groups.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="anova-column"
          label={`Select Numeric Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>

      <div>
        <SingleSelect
          id="anova-group-column"
          label={`Select Grouping Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run ANOVA</button>
    </div>
  </div>
);

/*---------------------------------------------------
LIMMA COLUMN VALUES
----------------------------------------------------*/

export const Limma = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>LIMMA</h1>
    <p className={descriptionClass}>
      Performs differential expression analysis using the LIMMA package.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <MultiSelect
          id="limma-column"
          label={`Select Columns`}
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
        <SingleSelect
          id="limma-group-column"
          label={`Select Grouping Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run LIMMA</button>
    </div>
  </div>
);

/*---------------------------------------------------
FOLD CHANGE COLUMN VALUES
----------------------------------------------------*/

export const FoldChange = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Fold Change</h1>
    <p className={descriptionClass}>
      Calculates the fold change between two groups or conditions.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="fc-column"
          label={`Select Numeric Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
      <div>
        <label htmlFor="fc-group-1" className={labelClass}>
          Group 1
        </label>
        <input
          type="text"
          id="fc-group-1"
          className={inputClass}
          placeholder="e.g., 'Treated'"
        />
      </div>
      <div>
        <label htmlFor="fc-group-2" className={labelClass}>
          Group 2
        </label>
        <input
          type="text"
          id="fc-group-2"
          className={inputClass}
          placeholder="e.g., 'Control'"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Calculate Fold Change</button>
    </div>
  </div>
);

/*---------------------------------------------------
NORMALIZED REPORTER IONS COLUMN VALUES
----------------------------------------------------*/

export const NormalizeReporterIons = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Normalize Reporter Ions</h1>
    <p className={descriptionClass}>
      Normalizes isobaric reporter ion intensities.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <MultiSelect
          id="norm-ri-columns"
          label={`Select Reporter Ion Columns`}
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
      <div className="flex items-center">
        <input
          id="log-transform-checkbox"
          type="checkbox"
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label
          htmlFor="log-transform-checkbox"
          className="ml-2 block text-sm text-gray-900"
        >
          Apply Log Transformation
        </label>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Normalize</button>
    </div>
  </div>
);

/*---------------------------------------------------
CORRECT FOR PURITY COLUMN VALUES
----------------------------------------------------*/

export const CorrectForPurity = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Correct for Purity</h1>
    <p className={descriptionClass}>
      Corrects reporter ion intensities for isotopic impurities.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <MultiSelect
          id="correct-purity-columns"
          label={`Select Reporter Ion Columns`}
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
        <label htmlFor="purity-matrix" className={labelClass}>
          Purity Correction Matrix
        </label>
        <textarea
          id="purity-matrix"
          rows={4}
          className={inputClass}
          placeholder="Enter comma-separated values for the correction matrix."
        ></textarea>
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Correct Purity</button>
    </div>
  </div>
);

/*---------------------------------------------------
BOX PLOT COLUMN VALUES
----------------------------------------------------*/

export const BoxPlot = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Box Plot</h1>
    <p className={descriptionClass}>
      Generates a box plot visualization for a selected column.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="boxplot-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

/*---------------------------------------------------
SCATTER PLOT COLUMN VALUES
----------------------------------------------------*/

export const ScatterPlot = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Scatter Plot</h1>
    <p className={descriptionClass}>
      Creates a scatter plot to visualize the relationship between two
      variables.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="scatter-x-column"
          label={`Select X-Axis Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
      <div>
        <SingleSelect
          id="scatter-y-column"
          label={`Select Y-Axis Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

/*---------------------------------------------------
HEATMAP COLUMN VALUES
----------------------------------------------------*/

export const Heatmap = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Heatmap</h1>
    <p className={descriptionClass}>
      Generates a heatmap to visualize data matrices.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <MultiSelect
          id="heatmap-columns"
          label={`Select Columns`}
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
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

/*---------------------------------------------------
VOLCANO PLOT COLUMN VALUES
----------------------------------------------------*/

export const VolcanoPlot = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Volcano Plot</h1>
    <p className={descriptionClass}>
      Creates a volcano plot to visualize differential expression results.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="volcano-pvalue"
          label={`Select P-value Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
      <div>
        <SingleSelect
          id="volcano-foldchange"
          label={`Select Fold Change Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

/*---------------------------------------------------
PCA PLOT COLUMN VALUES
----------------------------------------------------*/

export const PcaPlot = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>PCA Plot</h1>
    <p className={descriptionClass}>
      Generates a PCA plot to visualize principal components.
    </p>
    <div className="mb-6">
      <MultiSelect
        id="pca-plot-columns"
        label={`Select Columns`}
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
    <div className="flex justify-end">
      <button className={buttonClass}>Generate Plot</button>
    </div>
  </div>
);

/*---------------------------------------------------
SORT ASC COLUMN VALUES
----------------------------------------------------*/

export const SortAsc = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Sort Ascending</h1>
    <p className={descriptionClass}>
      Sorts the data in a selected column in ascending order.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="sort-asc-column"
        label={`Select Column to Sort`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Sort</button>
    </div>
  </div>
);

/*---------------------------------------------------
SORT DESC COLUMN VALUES
----------------------------------------------------*/

export const SortDesc = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Sort Descending</h1>
    <p className={descriptionClass}>
      Sorts the data in a selected column in descending order.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="sort-desc-column"
        label={`Select Column to Sort`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Sort</button>
    </div>
  </div>
);

/*---------------------------------------------------
REORDER COLUMN VALUES
----------------------------------------------------*/

export const ReorderColumns = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Reorder Columns</h1>
    <p className={descriptionClass}>
      Allows for manual reordering of columns in the dataset.
    </p>
    <div className="mb-6">
      <label htmlFor="reorder-column-list" className={labelClass}>
        Drag & Drop Columns to Reorder
      </label>
      <div
        id="reorder-column-list"
        className="mt-1 p-4 bg-gray-50 border border-gray-300 rounded-md max-h-64 overflow-y-auto"
      >
        {dataColumns.map((col) => (
          <div
            key={col}
            className="bg-white p-3 mb-2 rounded-md shadow-sm border border-gray-200 cursor-move hover:bg-gray-50 transition-colors"
          >
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

/*---------------------------------------------------
TRANSPOSE COLUMN VALUES
----------------------------------------------------*/

export const Transpose = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Transpose Data</h1>
    <p className={descriptionClass}>
      Transposes the dataset, swapping rows and columns.
    </p>
    <p className="text-sm text-gray-500 mb-6">
      This operation will fundamentally change the structure of your data.
      Please proceed with caution.
    </p>
    <div className="flex justify-end">
      <button className={dangerButtonClass}>Run Transpose</button>
    </div>
  </div>
);

/*---------------------------------------------------
FILTER COLUMN BY NAME VALUES
----------------------------------------------------*/

export const FilterColumnsByName = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Filter Columns by Name</h1>
    <p className={descriptionClass}>
      Filters columns based on their names using a search query.
    </p>
    <div className="mb-6">
      <label htmlFor="filter-column-name-input" className={labelClass}>
        Filter by Name
      </label>
      <input
        type="text"
        id="filter-column-name-input"
        placeholder="e.g., 'Intensity' or 'Sample*'"
        className={inputClass}
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Filter</button>
    </div>
  </div>
);

/*---------------------------------------------------
FILTER COLUMN BY TYPES VALUES
----------------------------------------------------*/

export const FilterColumnsByType = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Filter Columns by Type</h1>
    <p className={descriptionClass}>
      Filters columns based on their data type (e.g., numeric, categorical).
    </p>
    <div className="mb-6">
      <SingleSelect
        id="filter-column-type-select"
        label={`Select Column to Sort`}
        placeholder="Select data columns to analyze..."
        options={["numeric", "string", "date"].map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Filter</button>
    </div>
  </div>
);

/*---------------------------------------------------
ADD ROW VALUES
----------------------------------------------------*/

export const AddRow = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Add New Row</h1>
    <p className={descriptionClass}>Adds a new, empty row to the dataset.</p>
    <p className="text-sm text-gray-500 mb-6">
      A new row will be added at the bottom of the dataset. You can fill in the
      values manually afterwards.
    </p>
    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
      {dataColumns.map((col, idx) => {
        return (
          <div key={idx}>
            <label htmlFor="add-row" className={labelClass}>
              {col}
            </label>
            <input
              // type="number"
              id="add-row"
              className={inputClass}
              placeholder={col}
            />
          </div>
        );
      })}
    </div>
    <div className="flex flex-col mt-4">
      <button className={buttonClass}>Add Row</button>
    </div>
  </div>
);

/*---------------------------------------------------
RENAME ROW VALUES
----------------------------------------------------*/

export const RenameRow = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Rename Row</h1>
    <p className={descriptionClass}>Renames a selected row based on its ID.</p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="old-row-id"
          label={`Select Row ID`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
      <div>
        <label htmlFor="new-row-name" className={labelClass}>
          New Row Name
        </label>
        <input type="text" id="new-row-name" className={inputClass} />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Rename</button>
    </div>
  </div>
);

/*---------------------------------------------------
DELETE ROW VALUES
----------------------------------------------------*/

export const DeleteRow = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Delete Row</h1>
    <p className={descriptionClass}>Deletes a selected row from the dataset.</p>
    <div className="mb-6">
      <SingleSelect
        id="delete-row-id"
        label={`Select Row ID to Delete`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
          value: curr,
          label: curr,
          disabled: false,
        }))}
        defaultValue={""}
        onChange={(value) => console.log(value)}
        helperText="Choose the numeric columns you want to include in your analysis"
      />
    </div>
    <div className="flex justify-end">
      <button className={dangerButtonClass}>Delete Row</button>
    </div>
  </div>
);

/*---------------------------------------------------
PCA LEARNING VALUES
----------------------------------------------------*/

export const PcaLearning = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>PCA</h1>
    <p className={descriptionClass}>
      Performs Principal Component Analysis (PCA) for dimensionality reduction.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <MultiSelect
          id="pca-learning-columns"
          label={`Select Columns for PCA`}
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
        <label htmlFor="pca-learning-components" className={labelClass}>
          Number of Components
        </label>
        <input
          type="number"
          id="pca-learning-components"
          defaultValue="2"
          min="1"
          className={inputClass}
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run PCA</button>
    </div>
  </div>
);

/*---------------------------------------------------
PLSDA LEARNING VALUES
----------------------------------------------------*/

export const PlsdaLearning = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>PLS-DA</h1>
    <p className={descriptionClass}>
      Performs Partial Least Squares Discriminant Analysis (PLS-DA) for
      classification.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <MultiSelect
          id="plsda-learning-data"
          label={`Select Data Columns`}
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
        <SingleSelect
          id="plsda-learning-group"
          label={`Select Grouping Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run PLS-DA</button>
    </div>
  </div>
);

/*---------------------------------------------------
TSNE LEARNING VALUES
----------------------------------------------------*/

export const TsneLearning = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>t-SNE</h1>
    <p className={descriptionClass}>
      Performs t-Distributed Stochastic Neighbor Embedding (t-SNE) for
      visualization of high-dimensional data.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <MultiSelect
          id="tsne-learning-data"
          label={`Select Data Columns`}
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
        <label htmlFor="tsne-learning-perplexity" className={labelClass}>
          Perplexity
        </label>
        <input
          type="number"
          id="tsne-learning-perplexity"
          defaultValue="30"
          className={inputClass}
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run t-SNE</button>
    </div>
  </div>
);

/*---------------------------------------------------
ADD PTM VALUES
----------------------------------------------------*/

export const AddPtm = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Add PTM</h1>
    <p className={descriptionClass}>
      Adds a post-translational modification (PTM) to a peptide sequence.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="add-ptm-column"
          label={`Select Peptide Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to include in your analysis"
        />
      </div>
      <div>
        <SingleSelect
          id="add-ptm-type"
          label={`Select PTM Type`}
          placeholder="Select PTM type "
          options={["Phosphorylation", "Acetylation", "Methylation"].map(
            (curr) => ({ value: curr, label: curr, disabled: false })
          )}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the PTM type you want to include in your analysis"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Add PTM</button>
    </div>
  </div>
);

/*---------------------------------------------------
REMOVE PTM VALUES
----------------------------------------------------*/

export const RemovePtm = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Remove PTM</h1>
    <p className={descriptionClass}>
      Remows a post-translational modification (PTM) from a peptide sequence.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="remove-ptm-column"
          label={`Select Peptide Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to delete from your analysis"
        />
      </div>
      <div>
        <SingleSelect
          id="add-ptm-type"
          label={`Select PTM Type`}
          placeholder="Select PTM type "
          options={[
            "All PTMs",
            "Phosphorylation",
            "Acetylation",
            "Methylation",
          ].map((curr) => ({ value: curr, label: curr, disabled: false }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the PTM type you want to delete in your analysis"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Remove PTM</button>
    </div>
  </div>
);

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

/*---------------------------------------------------
HIERACHIAL CLUSTERING VALUES
----------------------------------------------------*/

export const HierarchicalClustering = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Hierarchical Clustering</h1>
    <p className={descriptionClass}>
      Performs hierarchical clustering on the dataset.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <MultiSelect
          id="hc-columns"
          label={`Select Columns to Cluster`}
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
        <SingleSelect
          id="hc-method"
          label={`Linkage Method`}
          placeholder="Select data columns to analyze..."
          options={["Ward's Method", "Complete Linkage", "Average Linkage"].map(
            (curr) => ({
              value: curr,
              label: curr,
              disabled: false,
            })
          )}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the Pathway"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Clustering</button>
    </div>
  </div>
);

/*---------------------------------------------------
KMEANS CLUSTERING VALUES
----------------------------------------------------*/

export const KmeansClustering = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>K-Means Clustering</h1>
    <p className={descriptionClass}>
      Performs K-Means clustering on the dataset.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <MultiSelect
          id="kmeans-columns"
          label={`Select Columns to Cluster`}
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
        <label htmlFor="kmeans-k" className={labelClass}>
          Number of Clusters (k)
        </label>
        <input
          type="number"
          id="kmeans-k"
          defaultValue="3"
          min="2"
          className={inputClass}
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Clustering</button>
    </div>
  </div>
);

/*---------------------------------------------------
PCA ANALYSIS VALUES
----------------------------------------------------*/

export const PcaAnalysis = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>PCA Analysis</h1>
    <p className={descriptionClass}>
      Performs a Principal Component Analysis (PCA).
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <MultiSelect
          id="pca-analysis-columns"
          label={`Select Columns for PCA`}
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
        <label htmlFor="pca-analysis-components" className={labelClass}>
          Number of Components
        </label>
        <input
          type="number"
          id="pca-analysis-components"
          defaultValue="2"
          min="1"
          className={inputClass}
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run PCA</button>
    </div>
  </div>
);

/*---------------------------------------------------
ZSCORE NORM VALUES
----------------------------------------------------*/

export const ZScoreNorm = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Z-Score Normalization</h1>
    <p className={descriptionClass}>
      Normalizes data by subtracting the mean and dividing by the standard
      deviation.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="z-score-norm-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
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
      <button className={buttonClass}>Normalize</button>
    </div>
  </div>
);

/*---------------------------------------------------
LOG TRANSFORM VALUES
----------------------------------------------------*/

export const LogTransform = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Log Transformation</h1>
    <p className={descriptionClass}>
      Applies a logarithmic transformation to the data.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="log-transform-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
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
      <button className={buttonClass}>Transform</button>
    </div>
  </div>
);

/*---------------------------------------------------
QUANTILE NORMALIZATION VALUES
----------------------------------------------------*/

export const QuantileNormalization = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Quantile Normalization</h1>
    <p className={descriptionClass}>
      Normalizes data distributions to be identical across samples.
    </p>
    <div className="mb-6">
      <MultiSelect
        id="quantile-norm-columns"
        label={`Select Columns`}
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
    <div className="flex justify-end">
      <button className={buttonClass}>Normalize</button>
    </div>
  </div>
);

/*---------------------------------------------------
MEAN CENTERING VALUES
----------------------------------------------------*/

export const MeanCentering = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Mean Centering</h1>
    <p className={descriptionClass}>
      Subtracts the mean from each value in a column.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="mean-centering-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
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
      <button className={buttonClass}>Center</button>
    </div>
  </div>
);

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

/*---------------------------------------------------
FTEST
----------------------------------------------------*/

export const FTest = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>F-Test</h1>
    <p className={descriptionClass}>
      Performs an F-Test to compare the variances of two groups.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="f-test-column"
          label={`Select Numeric Column`}
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
      <div>
        <SingleSelect
          id="f-test-group-column"
          label={`Select Grouping Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to delete from your analysis"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run F-Test</button>
    </div>
  </div>
);

/*---------------------------------------------------
CHISQUARE
----------------------------------------------------*/

export const ChiSquareTest = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Chi-Square Test</h1>
    <p className={descriptionClass}>
      Performs a Chi-Square Test for independence on categorical data.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="chi-square-col1"
          label={`Column 1`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to delete from your analysis"
        />
      </div>
      <div>
        <SingleSelect
          id="chi-square-col2"
          label={`Column 2`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to delete from your analysis"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Run Chi-Square</button>
    </div>
  </div>
);

/*---------------------------------------------------
ZSCORE OUTLIERS
----------------------------------------------------*/

export const ZScoreOutliers = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Z-Score Outliers</h1>
    <p className={descriptionClass}>
      Identifies outliers based on a Z-Score threshold.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="z-score-outlier-column"
          label={`Select Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to delete from your analysis"
        />
      </div>
      <div>
        <label htmlFor="z-score-threshold" className={labelClass}>
          Z-Score Threshold
        </label>
        <input
          type="number"
          id="z-score-threshold"
          defaultValue="3"
          step="0.1"
          className={inputClass}
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Find Outliers</button>
    </div>
  </div>
);

/*---------------------------------------------------
IQR OUTLIERS
----------------------------------------------------*/

export const IqrOutliers = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>IQR Outliers</h1>
    <p className={descriptionClass}>
      Identifies outliers using the Interquartile Range (IQR) method.
    </p>
    <div className="space-y-4 mb-6">
      <div>
        <SingleSelect
          id="iqr-outlier-column"
          label={`Select Column`}
          placeholder="Select data columns to analyze..."
          options={dataColumns.map((curr) => ({
            value: curr,
            label: curr,
            disabled: false,
          }))}
          defaultValue={""}
          onChange={(value) => console.log(value)}
          helperText="Choose the numeric columns you want to delete from your analysis"
        />
      </div>
      <div>
        <label htmlFor="iqr-factor" className={labelClass}>
          IQR Factor
        </label>
        <input
          type="number"
          id="iqr-factor"
          defaultValue="1.5"
          step="0.1"
          className={inputClass}
        />
      </div>
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Find Outliers</button>
    </div>
  </div>
);

/*---------------------------------------------------
GRUBBS TEST
----------------------------------------------------*/

export const GrubbsTest = ({
  dataColumns,
  // actionId,
}: {
  dataColumns: TableColumns;
  actionId: StatisticalAction;
}) => (
  <div className={containerClass}>
    <h1 className={headingClass}>Grubbs' Test</h1>
    <p className={descriptionClass}>
      Performs Grubbs' test to detect outliers in a dataset.
    </p>
    <div className="mb-6">
      <SingleSelect
        id="grubbs-column"
        label={`Select Column`}
        placeholder="Select data columns to analyze..."
        options={dataColumns.map((curr) => ({
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
      <button className={buttonClass}>Run Grubbs' Test</button>
    </div>
  </div>
);

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
SAVE DATA
----------------------------------------------------*/

export const SaveData = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Save Data</h1>
    <p className={descriptionClass}>Saves the current state of the dataset.</p>
    <div className="mb-6">
      <label htmlFor="save-file-name" className={labelClass}>
        File Name
      </label>
      <input
        type="text"
        id="save-file-name"
        placeholder="my_data.json"
        className={inputClass}
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Save</button>
    </div>
  </div>
);

/*---------------------------------------------------
EXPORT CSV
----------------------------------------------------*/

export const ExportCsv = () => (
  <div className={containerClass}>
    <h1 className={headingClass}>Export CSV</h1>
    <p className={descriptionClass}>
      Exports the current dataset to a CSV file.
    </p>
    <div className="mb-6">
      <label htmlFor="export-csv-name" className={labelClass}>
        File Name
      </label>
      <input
        type="text"
        id="export-csv-name"
        placeholder="my_data.csv"
        className={inputClass}
      />
    </div>
    <div className="flex justify-end">
      <button className={buttonClass}>Export</button>
    </div>
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
