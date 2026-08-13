import type { ColumnarTable } from "@/domain/shared/index.types";
import type { TableColumns, TableMatrix } from "@/domain/workflow/main.types";

export class LazyColumnarData extends Map<string, TableMatrix> {
  constructor(
    private readonly table: ColumnarTable,
    columns: TableColumns
  ) {
    // Keep only the column keys in memory; values are materialized on demand.
    super(columns.map((column) => [column, []]));
  }

  override get(column: string): TableMatrix | undefined {
    if (!super.has(column)) return undefined;

    const columnIndex = this.table.headers.indexOf(column);
    if (columnIndex === -1) return undefined;

    const pair = this.table.columns[columnIndex];
    const values: TableMatrix = [];
    for (let rowIndex = 0; rowIndex < this.table.rowCount; rowIndex += 1) {
      const value = pair[rowIndex];
      if (pair instanceof Float64Array && Number.isNaN(value)) {
        values.push("N/A");
      } else {
        values.push(value as string | number);
      }
    }
    return values;
  }

  override *entries(): MapIterator<[string, TableMatrix]> {
    for (const column of super.keys()) {
      yield [column, this.get(column) ?? []];
    }
  }

  override *values(): MapIterator<TableMatrix> {
    for (const column of super.keys()) {
      yield this.get(column) ?? [];
    }
  }

  override [Symbol.iterator](): MapIterator<[string, TableMatrix]> {
    return this.entries();
  }

  override forEach(
    callback: (
      value: TableMatrix,
      key: string,
      map: Map<string, TableMatrix>
    ) => void,
    thisArg?: unknown
  ): void {
    for (const column of super.keys()) {
      callback.call(thisArg, this.get(column) ?? [], column, this);
    }
  }
}
