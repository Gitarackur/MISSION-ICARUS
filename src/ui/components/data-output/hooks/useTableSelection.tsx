import { useState, useCallback, useRef, useEffect } from 'react';

interface CellCoordinates {
  rowIndex: number;
  columnId: string;
}

export const useTableSelection = (allColumns: string[]) => {
  const [selectedCells, setSelectedCells] = useState<CellCoordinates[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  
  const startCellRef = useRef<CellCoordinates | null>(null);
  const isDraggingRef = useRef(false);
  const isMultiSelectRef = useRef(false);
  const isClickRef = useRef(true);
  const initialSelectionRef = useRef<CellCoordinates[] | string[]>([]);
  const isHeaderDragRef = useRef(false);

  const getCellKey = useCallback(({ rowIndex, columnId }: CellCoordinates) => `${rowIndex}-${columnId}`, []);
  
  const handleMouseDown = useCallback(
    (rowIndex: number, columnId: string | null, e: React.MouseEvent, isHeader: boolean) => {
      e.preventDefault();
      isDraggingRef.current = true;
      isClickRef.current = true;
      isMultiSelectRef.current = e.ctrlKey || e.metaKey;
      isHeaderDragRef.current = isHeader;
      
      if (isHeader) {
        startCellRef.current = { rowIndex: -1, columnId: columnId! };
        initialSelectionRef.current = selectedColumns;
        if (!isMultiSelectRef.current) {
          setSelectedColumns([columnId!]);
        }
      } else {
        startCellRef.current = { rowIndex, columnId: columnId! };
        initialSelectionRef.current = selectedCells;
        if (!isMultiSelectRef.current) {
          setSelectedCells([{ rowIndex, columnId: columnId! }]);
        }
      }
    },
    [selectedCells, selectedColumns]
  );

  const handleMouseOver = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (rowIndex: number, columnId: string | null, isHeader: boolean) => {
      if (!isDraggingRef.current || !startCellRef.current) return;
      isClickRef.current = false;

      if (isHeaderDragRef.current) {
        const startColIndex = allColumns.indexOf(startCellRef.current.columnId);
        const endColIndex = allColumns.indexOf(columnId!);
        const minColIndex = Math.min(startColIndex, endColIndex);
        const maxColIndex = Math.max(startColIndex, endColIndex);

        const dragRangeColumns = allColumns.slice(minColIndex, maxColIndex + 1);

        if (isMultiSelectRef.current) {
          const initialSet = new Set(initialSelectionRef.current as string[]);
          const dragSet = new Set(dragRangeColumns);
          const mergedSet = new Set([...initialSet, ...dragSet]);
          setSelectedColumns(Array.from(mergedSet));
        } else {
          setSelectedColumns(dragRangeColumns);
        }
      } else {
        const startCell = startCellRef.current;
        const endCell = { rowIndex, columnId: columnId! };

        const minRow = Math.min(startCell.rowIndex, endCell.rowIndex);
        const maxRow = Math.max(startCell.rowIndex, endCell.rowIndex);
        const startColIndex = allColumns.indexOf(startCell.columnId);
        const endColIndex = allColumns.indexOf(endCell.columnId);
        const minColIndex = Math.min(startColIndex, endColIndex);
        const maxColIndex = Math.max(startColIndex, endColIndex);

        const dragRangeCells: CellCoordinates[] = [];
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minColIndex; c <= maxColIndex; c++) {
            dragRangeCells.push({ rowIndex: r, columnId: allColumns[c] });
          }
        }

        if (isMultiSelectRef.current) {
          const initialSet = new Set((initialSelectionRef.current as CellCoordinates[]).map(getCellKey));
          const dragSet = new Set(dragRangeCells.map(getCellKey));
          const mergedSet = new Set([...initialSet, ...dragSet]);
          setSelectedCells(Array.from(mergedSet).map((key) => {
            const [r, c] = key.split('-');
            return { rowIndex: Number(r), columnId: c };
          }));
        } else {
          setSelectedCells(dragRangeCells);
        }
      }
    },
    [allColumns, getCellKey]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;

    // Handle single Ctrl/Cmd + click to toggle
    if (isClickRef.current && isMultiSelectRef.current && startCellRef.current) {
      if (isHeaderDragRef.current) {
        setSelectedColumns((prevSelected) => {
          const columnToToggle = startCellRef.current!.columnId;
          if (prevSelected.includes(columnToToggle)) {
            return prevSelected.filter(c => c !== columnToToggle);
          } else {
            return [...prevSelected, columnToToggle];
          }
        });
      } else {
        setSelectedCells((prevSelected) => {
          const cellToToggle = startCellRef.current!;
          const cellKey = getCellKey(cellToToggle);
          if (prevSelected.some(c => getCellKey(c) === cellKey)) {
            return prevSelected.filter(c => getCellKey(c) !== cellKey);
          } else {
            return [...prevSelected, cellToToggle];
          }
        });
      }
    }

    startCellRef.current = null;
    isMultiSelectRef.current = false;
    initialSelectionRef.current = [];
    isHeaderDragRef.current = false;
  }, [getCellKey]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  return { selectedCells, selectedColumns, handleMouseDown, handleMouseOver, handleMouseUp, getCellKey };
};