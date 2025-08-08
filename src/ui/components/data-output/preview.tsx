import { ProteinRow } from '@/domain/proteins/index.types';
import React from 'react';


const DataPreview: React.FC<{
  data: ProteinRow[];
  filteredData: ProteinRow[];
  selectedColumns: string[];
  setSelectedColumns: (cols: string[]) => void;
}> = ({ data, filteredData, selectedColumns, setSelectedColumns }) => {
  if (!data.length) return null;
  const columns = Object.keys(data[0]);

  const toggleColumn = (column: string, checked: boolean) => {
    if (checked) setSelectedColumns([...selectedColumns, column]);
    else setSelectedColumns(selectedColumns.filter((c) => c !== column));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Data Preview</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Columns to Display:</label>
        <div className="flex flex-wrap gap-2">
          {columns.slice(0, 15).map((column) => (
            <label key={column} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes(column)}
                onChange={(e) => toggleColumn(column, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{column}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectedColumns.slice(0, 8).map((column) => (
                <th key={column} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.slice(0, 10).map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {selectedColumns.slice(0, 8).map((column) => (
                  <td key={column} className="px-4 py-3 text-sm text-gray-900">
                    {typeof row[column] === 'number'
                      ? (Number(row[column]) > 1e3 ? Number(row[column]).toExponential(2) : Number(row[column]).toFixed(2))
                      : (row[column] as string) || 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-gray-600">Showing {Math.min(10, filteredData.length)} of {filteredData.length} proteins</div>
    </div>
  );
};


export default DataPreview;