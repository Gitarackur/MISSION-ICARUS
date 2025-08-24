import { ProteinRow } from "@/domain/proteins/index.types";
import { TableMatrix } from "@/domain/workflow/main.types";

export function getCellValues(
  selectedAnalysisRowCells?: ProteinRow[],
  selectedAnalysisColumnCells?: Map<string, TableMatrix>
): ProteinRow[] | Map<string, TableMatrix> {
  if (selectedAnalysisRowCells && !selectedAnalysisColumnCells) {
    return selectedAnalysisRowCells;
  } else if (selectedAnalysisColumnCells && !selectedAnalysisRowCells) {
    return selectedAnalysisColumnCells;
  } else if (selectedAnalysisRowCells && selectedAnalysisColumnCells) {
    // Handle case where both exist - prioritize row cells by default
    return selectedAnalysisRowCells;
  } else {
    // Handle case where neither exists
    throw new Error(
      "Neither selectedAnalysisRowCells nor selectedAnalysisColumnCells is available"
    );
  }
}
