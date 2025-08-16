// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useMemo, useEffect } from "react";
import { getNumericColumns } from "@/app-layer/shared/utils";
import { ProteinRow } from "@/domain/proteins/index.types";
import { dataOutputStyles } from "../variants/data-output.variant";


export const useTableStylingAndInteraction = (
  originalDataRows: ProteinRow[],
  filteredDataRows: ProteinRow[],
  columns: string[],
) => {
  const styles = dataOutputStyles();

  // selecting analysis on data preview table
  const [selectedAnalysisColumnHeaderValue, setSelectedAnalysisColumnHeaderValue] = useState<string | null>(null);

  // highlighted cell -- mostly numeric cells
  const [selectedAnalysisColumnCells, setSelectedAnalysisColumnCells] = useState<Set<string>>(new Set());

  // state for selecting all rows
  const [selectedAnalysisRowCells, setSelectedAnalysisRowCells] = useState<ProteinRow[]>([]);

  // get numeric columns in table
  const numericColumns = useMemo(() => getNumericColumns(columns, originalDataRows), [columns, originalDataRows]);


  // clear the analysis selection
  const clearAnalysisSelection = () => {
    setSelectedAnalysisColumnHeaderValue(null);
    setSelectedAnalysisColumnCells(new Set());
  };

  // handle column click, get highlighted columns and styles it
  const handleColumnClick = (columnName: string) => {
    if (!numericColumns.has(columnName)) return;

    setSelectedAnalysisColumnHeaderValue(columnName);

    const newHighlighted = new Set<string>();
    newHighlighted.add(`header-${columnName}`);
    filteredDataRows.forEach((_, rowIndex) => {
      newHighlighted.add(`${rowIndex}-${columnName}`);
    });

    console.log("highlighted", newHighlighted)
    setSelectedAnalysisColumnCells(newHighlighted);
  };

  const handleColumnDoubleClick = () => {
    clearAnalysisSelection();
  }

  // add color styles to table numeric columns
  const getCellStyle = (rowIndex: number, columnName: string, isHeader = false) => {
    const cellKey = isHeader ? `header-${columnName}` : `${rowIndex}-${columnName}`;
    const isHighlighted = selectedAnalysisColumnCells.has(cellKey);
    const isNumeric = numericColumns.has(columnName);
    const isSelectedColumn = selectedAnalysisColumnHeaderValue === columnName;

    let className = isHeader ? styles.tableHeadCell() : styles.tableBodyCell();

    if (isHeader) {
      if (isNumeric) {
        className += ' cursor-pointer hover:bg-blue-100 transition-colors duration-200';
      }
      if (isSelectedColumn) {
        className += ' bg-blue-200';
      }
    } else if (isHighlighted) {
      className += ' bg-blue-100 border-blue-200';
    } else if (isNumeric) {
      className += ' bg-green-50';
    }

    return className;
  };

  // select all rows on the table including the oness not shown in the paginated data
  const selectAllRows = (checked: boolean) => {
    // console.log('Select all clicked:', checked);
    if (checked) {
      setSelectedAnalysisRowCells([...originalDataRows])
    } else {
      setSelectedAnalysisRowCells([])
    }
  }

  // seletct one row on the table
  const selectOneRow = (row: ProteinRow, checked: boolean) => {
    // console.log(`selected:`, checked);
    // console.log('Complete row data:', row);
    if (checked) {
      setSelectedAnalysisRowCells((prevState) => {
        return [...prevState, row]
      })
    } else {
      setSelectedAnalysisRowCells((prevState) => {
        return prevState.filter((data) => data !== row)
      })
    }
  }

  useEffect(() => {
    // it should clear if there is new data
    if (originalDataRows) {
      clearAnalysisSelection();
    }
  }, [originalDataRows])


  useEffect(() => {
    console.log('setSelectedRows', selectedAnalysisRowCells);
  }, [selectedAnalysisRowCells])



  return {
    selectedAnalysisColumnHeaderValue,

    numericColumns,

    selectedAnalysisColumnCells,
    selectedAnalysisRowCells,
    
    handleColumnClick,
    handleColumnDoubleClick,
    clearAnalysisSelection,
    getCellStyle,
   
    selectOneRow,
    selectAllRows,
  };
};