import React from 'react';
import {Search} from 'lucide-react';


const Filters: React.FC<{
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  setFilterCriteria: (fn: (prev: Record<string, { min?: number; max?: number }>) => Record<string, { min?: number; max?: number }>) => void;
}> = ({ searchTerm, setSearchTerm, setFilterCriteria }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Data Filtering</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Proteins</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by protein ID, gene name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Valid Values</label>
          <input
            type="number"
            min={0}
            placeholder="e.g., 3"
            onChange={(e) => {
              const v = Number(e.target.value) || 0;
              setFilterCriteria((prev) => ({ ...prev, validValues: { min: v } }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};


export default Filters;