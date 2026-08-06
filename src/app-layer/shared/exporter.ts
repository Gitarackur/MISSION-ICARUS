import Papa from "papaparse";
import type {
  IcarusActivity,
  IcarusMatrix,
  IcarusVisualization,
  TableColumns,
} from "@/domain/workflow/main.types";
import type { IcarusSessionWithWorkflow } from "@/domain/session/session.types";

export type ExportFormat =
  | "json"
  | "csv"
  | "tsv"
  | "txt"
  | "xml"
  | "md"
  | "sql";

export type CsvDelimiter = "," | ";" | "\t";

export interface ExportOptions {
  delimiter?: CsvDelimiter;
  includeHeaders?: boolean;
  includeMetadataColumns?: boolean;
}

export interface ExportedFile {
  content: string;
  filename: string;
  mime: string;
}

export const EXPORT_FORMAT_INFO: Record<
  ExportFormat,
  { label: string; description: string }
> = {
  json: { label: "JSON", description: "Nested objects preserving all data types" },
  csv: { label: "CSV", description: "Comma-separated values, spreadsheet friendly" },
  tsv: { label: "TSV", description: "Tab-separated values, bioinformatics friendly" },
  txt: { label: "TXT", description: "Delimiter-separated plain text" },
  xml: { label: "XML", description: "Interoperable XML document" },
  md: { label: "Markdown", description: "Human-readable markdown table" },
  sql: { label: "SQL", description: "CREATE TABLE + INSERT statements" },
};

const METADATA_PREFIX = "__";

const isMetadataColumn = (
  column: string,
  includeMetadataColumns: boolean
): boolean =>
  includeMetadataColumns ? false : column.startsWith(METADATA_PREFIX);

const filterColumns = (
  columns: TableColumns,
  includeMetadataColumns: boolean
): TableColumns =>
  columns.filter(
    (column) => !isMetadataColumn(column, includeMetadataColumns)
  );

const readCell = (
  row: unknown,
  column: string
): unknown => {
  if (row && typeof row === "object") {
    return (row as Record<string, unknown>)[column];
  }
  return undefined;
};

/** Converts raw rows into column-filtered objects. */
export const rowsToJson = (
  rows: unknown[],
  columns: TableColumns,
  options: ExportOptions = {}
): Record<string, unknown>[] => {
  const safeColumns = filterColumns(
    columns,
    Boolean(options.includeMetadataColumns)
  );

  return rows.map((row) => {
    const record: Record<string, unknown> = {};
    safeColumns.forEach((column) => {
      record[column] = readCell(row, column);
    });
    return record;
  });
};

const renderSeries = (
  rows: unknown[],
  columns: TableColumns,
  options: ExportOptions
): string => {
  const { delimiter = ",", includeHeaders = true } = options;
  const includeMetadataColumns = Boolean(options.includeMetadataColumns);
  const safeColumns = filterColumns(columns, includeMetadataColumns);

  const matrix: (string | number)[][] = rows.map((row) =>
    safeColumns.map((column) => readCell(row, column) as string | number)
  );

  const builder: (string | number)[][] = [];
  if (includeHeaders) builder.push([...safeColumns] as string[]);
  matrix.forEach((row) => builder.push(row));

  return Papa.unparse(builder, { delimiter });
};

const escapeText = (value: string): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toMarkdown = (
  rows: unknown[],
  columns: TableColumns,
  options: ExportOptions
): string => {
  const safeColumns = filterColumns(
    columns,
    Boolean(options.includeMetadataColumns)
  );
  if (safeColumns.length === 0) return "";

  const header = `| ${safeColumns.join(" | ")} |`;
  const separator = `| ${safeColumns.map(() => "---").join(" | ")} |`;
  const body = rows
    .map((row) => {
      const cells = safeColumns.map((column) =>
        String(readCell(row, column) ?? "")
          .replace(/\|/g, "\\|")
          .replace(/\n/g, " ")
      );
      return `| ${cells.join(" | ")} |`;
    })
    .join("\n");

  return [header, separator, body].join("\n");
};

const columnValues = (
  rows: unknown[],
  column: string
): unknown[] => rows.map((row) => readCell(row, column));

const isNumericColumn = (rows: unknown[], column: string): boolean =>
  columnValues(rows, column).every(
    (value) => value == null || typeof value === "number"
  );

const sanitizeSqlIdentifier = (name: string): string =>
  `"${String(name).replace(/"/g, '""')}"`;

const toSqlLiteral = (value: unknown): string => {
  if (value == null) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
};

const toSql = (
  rows: unknown[],
  columns: TableColumns,
  options: ExportOptions
): string => {
  const includeMetadataColumns = Boolean(options.includeMetadataColumns);
  const safeColumns = filterColumns(columns, includeMetadataColumns);
  if (safeColumns.length === 0) return "-- No columns available for export";

  const tableName = (safeColumns[0] ?? "matrix").toLowerCase().split(/[_\s]/)[0];

  const columnDefs = safeColumns
    .map((column) => {
      const type = isNumericColumn(rows, column) ? "REAL" : "TEXT";
      return `  ${sanitizeSqlIdentifier(column)} ${type}`;
    })
    .join(",\n");

  const columnList = safeColumns
    .map((column) => sanitizeSqlIdentifier(column))
    .join(", ");

  const lines: string[] = [];
  lines.push(
    `CREATE TABLE IF NOT EXISTS "${tableName || "matrix"}" (`
  );
  lines.push(columnDefs);
  lines.push(");");
  lines.push("");

  rows.forEach((row) => {
    const values = safeColumns
      .map((column) => toSqlLiteral(readCell(row, column)))
      .join(", ");
    lines.push(
      `INSERT INTO "${tableName || "matrix"}" (${columnList}) VALUES (${values});`
    );
  });

  return lines.join("\n");
};

const sanitizeTag = (name: string): string =>
  String(name)
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/^-/, "")
    .replace(/^(\d)/, "_col_1");

const toXml = (
  rows: unknown[],
  columns: TableColumns,
  options: ExportOptions
): string => {
  const safeColumns = filterColumns(
    columns,
    Boolean(options.includeMetadataColumns)
  );

  const inner = rows
    .map((row) => {
      const cells = safeColumns
        .map((column) => {
          const tag = sanitizeTag(column);
          return `    <${tag}>${escapeText(String(readCell(row, column) ?? ""))}</${tag}>`;
        })
        .join("\n");
      return `  <row>${cells ? `\n${cells}\n  ` : ""}</row>`;
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<matrix>",
    inner,
    "</matrix>",
  ].join("\n");
};

export const serializeActiveMatrix = (
  rows: unknown[],
  columns: TableColumns,
  format: ExportFormat,
  options: ExportOptions = {}
): ExportedFile => {
  let content = "";
  let mime = "text/plain";

  switch (format) {
    case "json":
      content = JSON.stringify(rowsToJson(rows, columns, options), null, 2);
      mime = "application/json";
      break;
    case "csv":
      content = renderSeries(rows, columns, options);
      mime = "text/csv";
      break;
    case "tsv":
      content = renderSeries(rows, columns, { ...options, delimiter: "\t" });
      mime = "text/tab-separated-values";
      break;
    case "txt":
      content = renderSeries(rows, columns, {
        ...options,
        delimiter: options.delimiter ?? "\t",
      });
      mime = "text/plain";
      break;
    case "md":
      content = toMarkdown(rows, columns, options);
      mime = "text/markdown";
      break;
    case "xml":
      content = toXml(rows, columns, options);
      mime = "application/xml";
      break;
    case "sql":
      content = toSql(rows, columns, options);
      mime = "application/sql";
      break;
  }

  return {
    content,
    filename: `icarus-data.${extensionFor(format)}`,
    mime,
  };
};

export const extensionFor = (format: ExportFormat): string =>
  format === "md" ? "md" : format;

/** Sanitises a suggested filename stem into a safe lowercase slug. */
export const toFilenameSlug = (name: string): string =>
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const serializeVisualizations = (visualizations: IcarusVisualization[] = []) =>
  visualizations.map((visualization) => ({
    id: visualization.id,
    title: visualization.title ?? null,
    renderer: visualization.renderer ?? null,
    visualizationType: visualization.visualizationType ?? null,
    createdAt: visualization.createdAt ?? null,
    sourceMatrixId: visualization.sourceMatrixId ?? null,
    data: visualization.data ?? null,
  }));

const serializeActivities = (activities: IcarusActivity[] = []) =>
  activities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    timestamp: activity.timestamp,
    pluginId: activity.pluginId ?? null,
    sourceMatrixId: activity.sourceMatrixId ?? null,
    inputColumnNames: activity.inputColumnNames ?? null,
    outputColumnNames: activity.outputColumnNames ?? null,
    inputParameters: activity.inputParameters ?? null,
    outputMetrics: activity.outputMetrics ?? null,
    inputMatrixReferences: activity.inputMatrixReferences ?? null,
    outputMatrixReference: activity.outputMatrixReference ?? null,
  }));

const serializeMatrices = (matrices: IcarusMatrix[] = []) =>
  matrices.map((matrix) => ({
    id: matrix.id,
    createdAt: matrix.createdAt,
    createdByFirstActivity: matrix.createdByFirstActivity ?? false,
    columns: matrix.columns,
    data: matrix.data,
  }));

/** Builds a structured session bundle for nested JSON export. */
export const buildSessionExport = (
  session: IcarusSessionWithWorkflow
): Record<string, unknown> => ({
  application: "mission-icarus",
  version: "0.0.112",
  exportedAt: new Date().toISOString(),
  session: {
    id: session.id,
    name: session.name,
    date: session.date,
  },
  workflows: (session.workflows ?? []).map((workflow) => ({
    id: workflow.id,
    createdAt: workflow.createdAt,
    matrices: serializeMatrices(workflow.data?.matrices ?? []),
    activities: serializeActivities(workflow.data?.activities ?? []),
    visualizations: serializeVisualizations(
      workflow.data?.visualizations ?? []
    ),
  })),
  matrices: serializeMatrices(session.matrices ?? []),
  activities: serializeActivities(session.activities ?? []),
  visualizations: serializeVisualizations(session.visualizations ?? []),
});

export const downloadTextFile = (
  filename: string,
  mime: string,
  content: string
) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};