import { ProteinRow } from "@/domain/proteins/index.types";
import { TableMatrix } from "@/domain/workflow/main.types";
import * as ss from "simple-statistics";

const metadataColumnPrefix = "__";

export const isMetadataColumn = (column: string) =>
  column.startsWith(metadataColumnPrefix);

export const getRawColumnData = (
  data: ProteinRow[] | Map<string, TableMatrix>
): { columns: string[]; values: unknown[][] } => {
  if (Array.isArray(data)) {
    const columns =
      data.length > 0
        ? Object.keys(data[0]).filter((column) => !isMetadataColumn(column))
        : [];
    return {
      columns,
      values: columns.map((column) => data.map((row) => row[column])),
    };
  }

  const columns: string[] = [];
  const values: unknown[][] = [];
  data.forEach((columnValues, column) => {
    if (isMetadataColumn(column)) return;
    columns.push(column);
    values.push(columnValues);
  });

  return { columns, values };
};

export const isMissingValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return !Number.isFinite(value);
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "" ||
      normalized === "na" ||
      normalized === "n/a" ||
      normalized === "nan" ||
      normalized === "null"
    );
  }
  return false;
};

export const finiteValues = (values: number[]): number[] =>
  values.filter((value) => Number.isFinite(value));

export const product = (values: number[]): number =>
  values.length ? values.reduce((acc, value) => acc * value, 1) : 0;

export const fallbackFiniteStat = (
  values: number[],
  calculate: (finite: number[]) => number
) => {
  const finite = finiteValues(values);
  return finite.length > 0 ? calculate(finite) : 0;
};

export const sanitizeStatisticalResults = (results: number[][]) =>
  results.map((column) =>
    column.map((value) => (Number.isFinite(value) ? value : 0))
  );

export const parseNumberMetadata = (
  data: ProteinRow[] | Map<string, TableMatrix>,
  key: string,
  fallback: number
): number => {
  if (!(data instanceof Map) || !data.has(key)) return fallback;
  const metadata = data.get(key);
  const value = Array.isArray(metadata) ? Number(metadata[0]) : NaN;
  return Number.isFinite(value) ? value : fallback;
};

export const parseStringMetadata = (
  data: ProteinRow[] | Map<string, TableMatrix>,
  key: string,
  fallback: string
): string => {
  if (!(data instanceof Map) || !data.has(key)) return fallback;
  const metadata = data.get(key);
  const value = Array.isArray(metadata) ? metadata[0] : undefined;
  return typeof value === "string" && value.length > 0 ? value : fallback;
};

export const quantile = (values: number[], probability: number) => {
  const sorted = finiteValues(values).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  return ss.quantile(sorted, probability);
};

export const pearsonCorrelation = (xValues: number[], yValues: number[]) => {
  const pairs = xValues
    .map((x, index) => [x, yValues[index]] as const)
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

  if (pairs.length < 2) return 0;

  const correlation = ss.sampleCorrelation(
    pairs.map(([x]) => x),
    pairs.map(([, y]) => y)
  );
  return Number.isFinite(correlation) ? correlation : 0;
};
