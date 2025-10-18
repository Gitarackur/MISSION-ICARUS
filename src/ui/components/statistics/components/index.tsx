import { getNumericColumnsOptimized } from "@/app-layer/shared/utils";
import { useStatisticalAnalysis } from "@/app-layer/statistics/hooks/useStatistics";
import { ProteinRow } from "@/domain/proteins/index.types";
import {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import { TableColumns, TableMatrix } from "@/domain/workflow/main.types";
import MultiSelect from "@/ui/design-system/Select/Multi/select";
import SingleSelect from "@/ui/design-system/Select/select";
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

  const runImputation = () => {
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
      const result = performAnalysis(actionId, filteredData);
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
        <button className={buttonClass} onClick={runImputation}>
          Run Imputation
        </button>
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

  const runImputation = () => {
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

      const result = performAnalysis(actionId, filteredData);
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
        <button className={buttonClass} onClick={runImputation}>
          Run Imputation
        </button>
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

  const runImputation = () => {
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
      const result = performAnalysis(actionId, filteredData);
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
        <button className={buttonClass} onClick={runImputation}>
          Run Imputation
        </button>
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

  const runMovingAverageCalc = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runMovingAverageCalc}
        >
          Calculate Moving Average
        </button>
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

  const runRollingStdDevCalc = () => {
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
      filteredData.set(`__window_size__`, [windowSize] as unknown as TableMatrix);
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runRollingStdDevCalc}
        >
          Calculate Rolling Std Dev
        </button>
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

  const runTTest = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runTTest}
        >
          Run T-Test
        </button>
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

  const runANOVA = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runANOVA}
        >
          Run ANOVA
        </button>
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
  const [adjustmentMethod, setAdjustmentMethod] = useState<'BH' | 'bonferroni'>('BH');
  const [error, setError] = useState<string | null>(null);

  const runLIMMA = () => {
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

      // Add adjustment method as metadata
      filteredData.set(`__adjustment_method__`, [adjustmentMethod] as unknown as TableMatrix);
      
      const result = performAnalysis(actionId, filteredData);
      onSuccess?.(result);
    } catch (err) {
      setError("An error occurred during the LIMMA analysis. Please check your data.");
      console.error("LIMMA analysis failed:", err);
      onError?.();
    }
  };

  const isRunButtonDisabled = treatmentColumns.length === 0 || controlColumns.length === 0;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>LIMMA</h1>
      <p className={descriptionClass}>
        Linear Models for Microarray Data (LIMMA) - Advanced differential expression analysis using moderated t-statistics.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <MultiSelect
            id="limma-treatment"
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
            id="limma-control"
            label="Control Group Columns"
            placeholder="Select control group columns..."
            options={numericColumns.map((curr) => ({ value: curr, label: curr, disabled: false }))}
            value={controlColumns}
            onChange={setControlColumns}
            helperText="Choose the numeric columns for the control group"
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
        </div>
      </div>
      
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex justify-end">
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runLIMMA}
        >
          Run LIMMA Analysis
        </button>
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

  const runFoldChange = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runFoldChange}
        >
          Calculate Fold Change
        </button>
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

  const runNormalization = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runNormalization}
        >
          Normalize Reporter Ions
        </button>
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
  const [reagentType, setReagentType] = useState<'tmt10' | 'tmt11' | 'tmt16' | 'itraq4' | 'itraq8' | 'custom'>('tmt10');
  const [applyCorrection, setApplyCorrection] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleChannelSelection = (values: string[]) => {
    setSelectedChannels(values);
  };

  const runPurityCorrection = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
            onChange={(value) => setReagentType(value as any)}
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runPurityCorrection}
        >
          Apply Purity Correction
        </button>
      </div>
    </div>
  );
};


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

  const runSortAsc = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runSortAsc}
        >
          Sort Ascending
        </button>
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

  const runSortDesc = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runSortDesc}
        >
          Sort Descending
        </button>
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

  const runReorder = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          onClick={runReorder}
        >
          Reorder Columns
        </button>
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

  const runTranspose = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runTranspose}
        >
          Transpose Data
        </button>
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

  const runFilterByName = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runFilterByName}
        >
          Apply Filter
        </button>
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
          return column.every((val: any) => typeof val === 'number' && !isNaN(val));
        case 'integer':
          return column.every((val: any) => Number.isInteger(val));
        case 'float':
          return column.some((val: any) => !Number.isInteger(val) && !isNaN(val));
        case 'positive':
          return column.every((val: any) => val > 0);
        case 'negative':
          return column.every((val: any) => val < 0);
        case 'nonzero':
          return column.every((val: any) => val !== 0);
        default:
          return false;
      }
    });
    
    setPreviewColumns(matched);
  }, [filterType, availableColumns, allColumnarData]);

  const runFilterByType = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={isRunButtonDisabled}
          onClick={runFilterByType}
        >
          Apply Filter
        </button>
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

  const runAddRow = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          onClick={runAddRow}
        >
          Add {numRowsToAdd} Row{numRowsToAdd !== 1 ? 's' : ''}
        </button>
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
      const identifier = (row as any).id || (row as any).name || `Row ${rowIndex + 1}`;
      setCurrentName(identifier);
    }
  }, [rowIndex, dataRows]);

  const runRenameRow = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={!newName.trim()}
          onClick={runRenameRow}
        >
          Rename Row
        </button>
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
  const [deleteMode, setDeleteMode] = useState<string>('indices');
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

  const runDeleteRow = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={!confirmDelete || previewIndices.length === 0}
          onClick={runDeleteRow}
        >
          Delete {previewIndices.length} Row{previewIndices.length !== 1 ? 's' : ''}
        </button>
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
}> = ({ dataColumns, actionId, dataRows, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [numComponents, setNumComponents] = useState<number>(2);
  const [error, setError] = useState<string | null>(null);

  const runPCA = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          onClick={runPCA}
        >
          Run PCA
        </button>
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
}> = ({ dataColumns, actionId, dataRows, allColumnarData, onSuccess, onError }) => {
  const { performAnalysis } = useStatisticalAnalysis();
  
  const availableColumns = useMemo(() => {
    const columnNames = Array.from(allColumnarData.keys());
    return columnNames.filter(col => !col.startsWith('__'));
  }, [allColumnarData]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [numComponents, setNumComponents] = useState<number>(2);
  const [labelColumn, setLabelColumn] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const runPLSDA = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          disabled={!labelColumn}
          onClick={runPLSDA}
        >
          Run PLS-DA
        </button>
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
}> = ({ dataColumns, actionId, dataRows, allColumnarData, onSuccess, onError }) => {
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

  const runTSNE = () => {
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
      
      const result = performAnalysis(actionId, filteredData);
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
        <button
          className={buttonClass}
          onClick={runTSNE}
        >
          Run t-SNE
        </button>
      </div>
    </div>
  );
};


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
