// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TableColumns } from "@/app-layer/algorithms/workflow/main.types"
import { ProteinRow } from "../proteins/index.types"

export type BareSession = { 
  name?: string,
  rows: ProteinRow[],
  columns: TableColumns
}
