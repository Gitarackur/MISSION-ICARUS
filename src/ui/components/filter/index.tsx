import React from 'react';
import { Search } from 'lucide-react';
import { tv } from 'tailwind-variants';

const styles = tv({
  slots: {
    card: 'bg-white rounded-lg shadow p-6',
    heading: 'text-lg font-semibold mb-4',
    label: 'block text-sm font-medium text-gray-700 mb-2',
    input:
      'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
    searchIconWrapper: 'relative',
    searchIcon: 'absolute left-3 top-3 h-4 w-4 text-gray-400',
  },
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
  const s = styles();

  return (
    <div className={s.card()}>
      <h2 className={s.heading()}>Data Filtering</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={s.label()}>Search Proteins</label>
          <div className={s.searchIconWrapper()}>
            <Search className={s.searchIcon()} />
            <input
              type="text"
              placeholder="Search by protein ID, gene name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={s.input()}
              style={{ paddingLeft: '2.5rem' }} // space for icon
            />
          </div>
        </div>
        <div>
          <label className={s.label()}>Minimum Valid Values</label>
          <input
            type="number"
            min={0}
            placeholder="e.g., 3"
            onChange={(e) => {
              const v = Number(e.target.value) || 0;
              setFilterCriteria((prev) => ({ ...prev, validValues: { min: v } }));
            }}
            className={s.input()}
          />
        </div>
      </div>
    </div>
  );
};

export default Filters;
