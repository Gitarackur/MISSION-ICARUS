import { TableColumns, TableMatrices } from "@/app-layer/algorithms/workflow/main.types"
import { ProteinRow } from "../proteins/index.types"

export type BareSession = { 
  rows: ProteinRow[],
  columns: TableColumns
}

export type CreateSessionUsingRowsColumn = { 
  name: string;
  columns: TableColumns,
  rowsAs2dMatrix: TableMatrices
}
