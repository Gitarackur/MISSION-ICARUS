import { tableCol, tableMatrix } from "@/app-layer/algorithms/workflow/main.types"
import { ProteinRow } from "../proteins/index.types"

export type BareSession = { 
  rows: ProteinRow[],
  columns: tableCol
}

export type CreateSessionUsingRowsColumn = { 
  columns: tableCol,
  rowsAs2dMatrix: tableMatrix
}
