import { ProteinRow } from "@/domain/proteins/index.types";
import { TableMatrix } from "@/domain/workflow/main.types";

export function getCellValues(
  selectedAnalysisRowCells?: ProteinRow[],
  selectedAnalysisColumnCells?: Map<string, TableMatrix>
): ProteinRow[] | Map<string, TableMatrix> {
  const hasRowData =
    selectedAnalysisRowCells && selectedAnalysisRowCells.length > 0;
  const hasColumnData =
    selectedAnalysisColumnCells && selectedAnalysisColumnCells.size > 0;

  if (hasRowData && hasColumnData) {
    throw new Error(
      "Both selectedAnalysisRowCells and selectedAnalysisColumnCells contain data. Only one should have data at a time."
    );
  } else if (hasRowData) {
    return selectedAnalysisRowCells;
  } else if (hasColumnData) {
    return selectedAnalysisColumnCells;
  } else {
    throw new Error(
      "Both selectedAnalysisRowCells and selectedAnalysisColumnCells are empty or undefined"
    );
  }
}
