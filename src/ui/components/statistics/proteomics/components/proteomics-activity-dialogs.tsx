import React, { useMemo, useState } from "react";
import type { ColumnarTable } from "@/domain/shared/index.types";
import {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import { TableColumns, TableMatrix } from "@/domain/workflow/main.types";
import { useStatisticalAnalysis } from "@/app-layer/statistics/hooks/useStatistics";
import { getNumericColumnsOptimized } from "@/app-layer/shared/utils";
import MultiSelect from "@/ui/design-system/Select/Multi/select";
import SingleSelect from "@/ui/design-system/Select/select";
import { PROTEOMICS_FEATURE_DESCRIPTIONS } from "../utils/proteomics-features";
import type {
  ActivityParameter,
  ProteomicsActivityConfig,
} from "../utils/proteomics-activity-configs";

const containerClass = "bg-white rounded-xl";
const headingClass = "text-2xl font-semibold text-gray-800 mb-2";
const descriptionClass = "text-gray-600 mb-6";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";
const inputClass =
  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-500";
const buttonClass =
  "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors";
const notesClass =
  "rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 mb-6 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200";

const buildSelectedColumnData = (
  allColumnarData: Map<string, TableMatrix>,
  columns: TableColumns
) => {
  const filteredData = new Map<string, TableMatrix>();
  columns.forEach((column) => {
    const values = allColumnarData.get(column);
    if (values) filteredData.set(column, values);
  });
  return filteredData;
};

/**
 * Generic, data-driven dialog for the proteomics activities that run
 * inside the TypeScript statistics worker. The activity config decides which
 * columns, dropdowns and numeric/text inputs the user provides, and every
 * input is forwarded to the worker through a "__<key>__" metadata sentinel.
 */
export const ProteomicsActivityDialog: React.FC<
  ProteomicsActivityConfig & {
    dataColumns: TableColumns;
    dataTable: ColumnarTable;
    allColumnarData: Map<string, TableMatrix>;
    onSuccess?: (result: StatisticalAnalysisResult) => void;
    onError?: () => void;
  }
> = ({
  actionId,
  title,
  description,
  columnScope = "numeric",
  columnMulti = true,
  identifierLabel = "Select Columns",
  parameters = [],
  dataColumns,
  dataTable,
  allColumnarData,
  onSuccess,
  onError,
}) => {
  const { performAnalysis } = useStatisticalAnalysis();
  const numericColumnsSet = useMemo(
    () => getNumericColumnsOptimized(dataColumns, dataTable),
    [dataColumns, dataTable]
  );
  const availableColumns =
    columnScope === "all"
      ? dataColumns
      : [...numericColumnsSet];

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [parameterValues, setParameterValues] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      parameters.forEach((parameter) => {
        initial[parameter.key] =
          parameter.defaultValue === undefined
            ? ""
            : String(parameter.defaultValue);
      });
      return initial;
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const readParameterValue = (key: string, fallback: number | string) => {
    const raw = parameterValues[key];
    return raw === undefined || raw === "" ? String(fallback) : raw;
  };

  const runActivity = async () => {
    setError(null);
    if (columnMulti && selectedColumns.length === 0) {
      setError(
        `Please select at least one column to run "${title}".`
      );
      onError?.();
      return;
    }
    if (!columnMulti && selectedColumns.length !== 1) {
      setError("Please select exactly one column.");
      onError?.();
      return;
    }

    try {
      const filteredData = buildSelectedColumnData(
        allColumnarData,
        columnMulti ? selectedColumns : dataColumns
      );
      parameters.forEach((parameter) => {
        filteredData.set(
          parameter.key,
          [readParameterValue(parameter.key, parameter.defaultValue ?? 0)] as unknown as TableMatrix
        );
      });

      setIsRunning(true);
      const result = await performAnalysis(actionId, filteredData);
      onSuccess?.(result);
      setIsRunning(false);
    } catch (err) {
      setIsRunning(false);
      setError("The analysis failed. Please check the selected columns and parameters.");
      console.error(`${actionId} failed:`, err);
      onError?.();
    }
  };

  const singleColumn = !columnMulti || availableColumns.length === 1;

  const renderParameterInput = (parameter: ActivityParameter) => {
    if (parameter.kind === "select") {
      return (
        <SingleSelect
          id={`${actionId}-${parameter.key}`}
          label={parameter.label}
          placeholder="Select an option..."
          options={parameter.options}
          defaultValue={parameter.defaultValue ?? ""}
          onChange={(value) =>
            setParameterValues((current) => ({
              ...current,
              [parameter.key]: value ?? "",
            }))
          }
        />
      );
    }
    if (parameter.kind === "text") {
      return (
        <>
          <label htmlFor={`${actionId}-${parameter.key}`} className={labelClass}>
            {parameter.label}
          </label>
          <input
            type="text"
            id={`${actionId}-${parameter.key}`}
            className={inputClass}
            value={parameterValues[parameter.key] ?? ""}
            onChange={(event) =>
              setParameterValues((current) => ({
                ...current,
                [parameter.key]: event.target.value,
              }))
            }
            placeholder={parameter.placeholder}
          />
        </>
      );
    }
    return (
      <>
        <label htmlFor={`${actionId}-${parameter.key}`} className={labelClass}>
          {parameter.label}
        </label>
        <input
          type="number"
          id={`${actionId}-${parameter.key}`}
          className={inputClass}
          value={parameterValues[parameter.key] ?? ""}
          onChange={(event) =>
            setParameterValues((current) => ({
              ...current,
              [parameter.key]: event.target.value,
            }))
          }
        />
      </>
    );
  };

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>{title}</h1>
      <p className={descriptionClass}>{description}</p>

      <div className="mb-6">
        {singleColumn ? (
          <SingleSelect
            id={`${actionId}-column`}
            label={identifierLabel}
            placeholder="Select a column..."
            options={availableColumns.map((column) => ({
              value: column,
              label: column,
              disabled: false,
            }))}
            defaultValue=""
            onChange={(value) => setSelectedColumns(value ? [value] : [])}
            helperText="Choose the column for this activity"
          />
        ) : (
          <MultiSelect
            id={`${actionId}-columns`}
            label={identifierLabel}
            placeholder="Select columns..."
            options={availableColumns.map((column) => ({
              value: column,
              label: column,
              disabled: false,
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            helperText="Choose the columns for this activity"
          />
        )}
      </div>

      {parameters.map((parameter) => (
        <div key={parameter.key} className="mb-6">
          {renderParameterInput(parameter)}
        </div>
      ))}

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-end">
        <button
          type="button"
          className={buttonClass}
          disabled={isRunning}
          onClick={() => void runActivity()}
        >
          {isRunning ? "Running…" : "Run"}
        </button>
      </div>
    </div>
  );
};

/**
 * Informative dialog for proteomics activities that require a
 * specialized data source or backend (annotation databases, sequence features,
 * uploads, classifiers, ...) that is not bundled with Icarus. The activity is
 * still reachable from the Proteomics panel so no native feature is hidden.
 */
export const PlaceholderActivityDialog: React.FC<{
  actionId: StatisticalAction;
  title: string;
  notes?: string;
}> = ({ actionId, title, notes }) => {
  const description =
    PROTEOMICS_FEATURE_DESCRIPTIONS[actionId] ??
    "This proteomics activity describes a workflow step.";
  return (
    <div className={containerClass}>
      <h1 className={headingClass}>{title}</h1>
      <p className={descriptionClass}>{description}</p>
      <div className={notesClass}>
        {notes ??
          "This activity depends on an external annotation source, a second matrix, or a model backend that is not bundled with Icarus yet. Configure the workflow in a compatible proteomics tool, export the result matrix, and re-import it here to continue the analysis."}
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-gray-500">
          Planned for release at a later date.
        </span>
        <span className="text-sm text-gray-500">
          {PROTEOMICS_FEATURE_DESCRIPTIONS[actionId] ? "Available in the Proteomics panel" : ""}
        </span>
      </div>
    </div>
  );
};