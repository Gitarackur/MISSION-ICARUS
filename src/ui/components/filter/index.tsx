import React from 'react';
import { Search } from 'lucide-react';
import { tv } from 'tailwind-variants';

const card = tv({
  base: 'bg-white rounded-lg shadow p-6',
});

const label = tv({
  base: 'block text-sm font-medium text-gray-700 mb-2',
});

const input = tv({
  base:
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
});

const searchIconWrapper = tv({
  base: 'relative',
});

const searchIcon = tv({
  base: 'absolute left-3 top-3 h-4 w-4 text-gray-400',
});

type FiltersProps = {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  setFilterCriteria: (
    fn: (
      prev: Record<string, { min?: number; max?: number }>
    ) => Record<string, { min?: number; max?: number }>
  ) => void;
};

const Filters: React.FC<FiltersProps> = ({
  searchTerm,
  setSearchTerm,
  setFilterCriteria,
}) => {
  return (
    <div className={card()}>
      <h2 className="text-lg font-semibold mb-4">Data Filtering</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={label()}>Search Proteins</label>
          <div className={searchIconWrapper()}>
            <Search className={searchIcon()} />
            <input
              type="text"
              placeholder="Search by protein ID, gene name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={input({})}
              // No variants needed here for now, but you can add if needed
              style={{ paddingLeft: '2.5rem' }} // ensure space for icon
            />
          </div>
        </div>
        <div>
          <label className={label()}>Minimum Valid Values</label>
          <input
            type="number"
            min={0}
            placeholder="e.g., 3"
            onChange={(e) => {
              const v = Number(e.target.value) || 0;
              setFilterCriteria((prev) => ({ ...prev, validValues: { min: v } }));
            }}
            className={input()}
          />
        </div>
      </div>
    </div>
  );
};

export default Filters;
