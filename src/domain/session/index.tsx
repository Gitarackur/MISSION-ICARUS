import { TableColumns, TableMatrices } from "@/app-layer/algorithms/workflow/main.types"
import { ProteinRow } from "../proteins/index.types"

export type BareSession = { 
  rows: ProteinRow[],
  columns: TableColumns
}

export type CreateSessionUsingRowsColumn = { 
  columns: TableColumns,
  rowsAs2dMatrix: TableMatrices
}
