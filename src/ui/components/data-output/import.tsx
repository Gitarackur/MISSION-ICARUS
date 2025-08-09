import React from 'react';
import { Upload } from 'lucide-react';
import { tv } from 'tailwind-variants';

type DataImportProps = {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
  totalProteins: number;
  columnsCount: number;
  selectedColumnsCount: number;
};

// Variants for container card
const card = tv({
  base: 'bg-white rounded-lg shadow p-6',
});

// Variants for label styling
const label = tv({
  base: 'block text-sm font-medium text-gray-700 mb-2',
});

// Variants for dashed upload box
const uploadBox = tv({
  base:
    'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center',
});

// Variants for button with enabled/disabled states
const button = tv({
  base: 'px-4 py-2 rounded-lg text-white transition-colors duration-200 ease-in-out',
  variants: {
    disabled: {
      true: 'bg-blue-400 cursor-not-allowed',
      false: 'bg-blue-600 hover:bg-blue-700 cursor-pointer',
    },
  },
});

const DataImport: React.FC<DataImportProps> = ({
  fileInputRef,
  onFileChange,
  isProcessing,
  totalProteins,
  columnsCount,
  selectedColumnsCount,
}) => (
  <div className="space-y-6">
    <div className={card()}>
      <h2 className="text-lg font-semibold mb-4">Data Import</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={label()}>Upload MaxQuant Output</label>
          <div className={uploadBox()}>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              Drop your proteinGroups.txt or evidence.txt file here
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.tsv,.csv"
              onChange={onFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className={button({ disabled: isProcessing })}
            >
              {isProcessing ? 'Processing...' : 'Select File'}
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-md font-medium mb-3">Data Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Proteins:</span>
              <span className="font-medium">{totalProteins}</span>
            </div>
            <div className="flex justify-between">
              <span>Columns:</span>
              <span className="font-medium">{columnsCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Selected Columns:</span>
              <span className="font-medium">{selectedColumnsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DataImport;
