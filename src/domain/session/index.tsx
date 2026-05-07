import { TableColumns } from "@/domain/workflow/main.types"
import { ProteinRow } from "@/domain/proteins/index.types"

export type BareSession = { 
  name?: string,
  rows: ProteinRow[],
  columns: TableColumns
}
