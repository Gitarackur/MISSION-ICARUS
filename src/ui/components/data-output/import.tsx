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

const styles = tv({
  slots: {
    container: 'space-y-6',
    card: 'bg-white rounded-lg shadow p-6',
    heading2: 'text-lg font-semibold mb-4',
    heading3: 'text-md font-medium mb-3',
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    label: 'block text-sm font-medium text-gray-700 mb-2',
    uploadBox: 'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center',
    uploadIcon: 'w-12 h-12 text-gray-400 mx-auto mb-4',
    uploadText: 'text-sm text-gray-600 mb-4',
    hiddenInput: 'hidden',
    button: 'px-4 py-2 rounded-lg text-white transition-colors duration-200 ease-in-out',
    buttonDisabled: 'bg-blue-400 cursor-not-allowed',
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

const DataImport: React.FC<DataImportProps> = ({
  fileInputRef,
  onFileChange,
  isProcessing,
  totalProteins,
  columnsCount,
  selectedColumnsCount,
}) => {
  const s = styles();

  return (
    <div className={s.container()}>
      <div className={s.card()}>
        <h2 className={s.heading2()}>Data Import</h2>
        <div className={s.grid()}>
          <div>
            <label className={s.label()}>Upload MaxQuant Output</label>
            <div className={s.uploadBox()}>
              <Upload className={s.uploadIcon()} />
              <p className={s.uploadText()}>
                Drop your proteinGroups.txt or evidence.txt file here
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.tsv,.csv"
                onChange={onFileChange}
                className={s.hiddenInput()}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className={s.button({ buttonDisabled: isProcessing })}
              >
                {isProcessing ? 'Processing...' : 'Select File'}
              </button>
            </div>
          </div>

          <div>
            <h3 className={s.heading3()}>Data Summary</h3>
            <div className={s.summaryContainer()}>
              <div className={s.summaryRow()}>
                <span className={s.summaryLabel()}>Total Proteins:</span>
                <span className={s.summaryValue()}>{totalProteins}</span>
              </div>
              <div className={s.summaryRow()}>
                <span className={s.summaryLabel()}>Columns:</span>
                <span className={s.summaryValue()}>{columnsCount}</span>
              </div>
              <div className={s.summaryRow()}>
                <span className={s.summaryLabel()}>Selected Columns:</span>
                <span className={s.summaryValue()}>{selectedColumnsCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImport;
