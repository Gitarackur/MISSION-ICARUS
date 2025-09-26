import { tv } from "tailwind-variants";

// dataOutputStyles is used in DataPreview component
export const dataOutputStyles = tv({
  slots: {
    container: 'bg-white rounded-lg shadow p-6',
    emptyState:
      'bg-white rounded-lg shadow p-10 flex flex-col items-center justify-center text-center border border-gray-200',
    emptyIcon: 'w-16 h-16 text-gray-300 mb-4',
    emptyTitle: 'text-lg font-semibold text-gray-700',
    emptyDescription: 'text-gray-500 text-sm mt-1 max-w-sm',
    button: 'bg-blue-600 text-white mt-4 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150',
    buttonDisabled: 'bg-blue-400 cursor-not-allowed text-white',
    buttonEnabled: 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer',
    heading3: 'text-lg font-semibold mb-4',
    label: 'block text-sm font-medium text-gray-700 mb-2',
    columnsContainer:
      'flex flex-wrap gap-3 max-w-full max-h-40 overflow-y-auto border border-gray-50 rounded p-2 bg-gray-50',
    columnsItem: 'flex items-center space-x-2 cursor-pointer select-none',
    tableWrapper: 'overflow-x-auto w-full rounded border border-gray-200',
    table: 'min-w-full divide-y divide-gray-200',
    tableHead: 'bg-gray-50',
    tableHeadCell:
      'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap',
    tableBody: 'bg-white divide-y divide-gray-100',
    tableBodyRow: 'hover:bg-blue-50 transition-colors duration-150',
    tableBodyCell: 'px-4 py-3 text-sm text-gray-900 whitespace-nowrap',
    tableBodyEmptyCell: 'px-4 py-6 text-center text-gray-400 italic',
    pagination: 'mt-4 w-full text-sm text-gray-600',
    paginationButton:
      'px-3 py-1 rounded border border-gray-300 transition-colors duration-150',
    paginationButtonDisabled: 'text-gray-400 cursor-not-allowed bg-gray-100',
    paginationButtonEnabled: 'hover:bg-gray-100 text-gray-700 cursor-pointer',
    paginationInfo: 'px-3 py-1 border border-gray-300 rounded bg-gray-50 text-gray-700 select-none',

    tableCellCheckboxContainer: "px-4 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200",
    clearAnalysisSelection: "px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors",
    checkboxStyles: "rounded border-gray-300 text-blue-600 focus:ring-blue-500"
  },
  variants: {
    buttonDisabled: {
      true: 'bg-blue-400 cursor-not-allowed text-white',
      false: 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer',
    },
    paginationButtonDisabled: {
      true: 'text-gray-400 cursor-not-allowed bg-gray-100',
      false: 'hover:bg-gray-100 text-gray-700 cursor-pointer',
    },
  },
});




// this is used in the Data import component
export const importDataStyles = tv({
  slots: {
    container: 'space-y-6',
    card: 'bg-white rounded-lg border border-gray-100 shadow p-6',
    heading2: 'text-lg font-semibold mb-4',
    heading3: 'text-md font-medium mb-3',
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    dataImportGrid: "flex flex-col items-center justify-center",
    label: 'block text-sm font-medium text-gray-700 mb-2',
    uploadBox: 'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center',
    uploadIcon: 'w-12 h-12 text-gray-400 mx-auto mb-4',
    uploadText: 'text-sm text-gray-600 mb-4',
    hiddenInput: 'hidden',
    button: 'bg-blue-600 px-4 py-2 rounded-lg text-white transition-colors duration-200 ease-in-out',
    buttonDisabled: 'bg-blue-400 opacity-50 cursor-not-allowed',
    buttonEnabled: 'bg-blue-600 hover:bg-blue-700 cursor-pointer',
    summaryContainer: 'space-y-2 text-sm',
    summaryRow: 'flex justify-between',
    summaryLabel: '',
    summaryValue: 'font-medium',
  },
  variants: {
    buttonDisabled: {
      true: 'bg-blue-400 cursor-not-allowed',
      false: 'bg-blue-600 hover:bg-blue-700 cursor-pointer',
    },
  },
});