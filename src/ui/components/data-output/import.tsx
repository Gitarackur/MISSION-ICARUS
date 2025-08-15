import React from 'react';
import { Upload } from 'lucide-react';
import { importDataStyles } from './variants/data-output.variant';
import { DataImportProps } from './types';


const DataImport: React.FC<DataImportProps> = ({
  fileInputRef,
  onFileChange,
  isProcessing,
  totalProteins,
  columnsCount,
  selectedColumnsCount,
}) => {
  const s = importDataStyles();

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
