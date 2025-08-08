import React from 'react';
import {Upload,} from 'lucide-react';


type DataImportProps = {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
  totalProteins: number;
  columnsCount: number;
  selectedColumnsCount: number;
}

const DataImport: React.FC<DataImportProps> = ({ fileInputRef, onFileChange, isProcessing, totalProteins, columnsCount, selectedColumnsCount }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Data Import</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload MaxQuant Output</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">Drop your proteinGroups.txt or evidence.txt file here</p>
            <input ref={fileInputRef} type="file" accept=".txt,.tsv,.csv" onChange={onFileChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={isProcessing}
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