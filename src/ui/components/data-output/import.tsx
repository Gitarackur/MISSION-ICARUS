import React from 'react';
import { Upload } from 'lucide-react';
import { importDataStyles } from './variants/data-output.variant';
import { DataImportProps } from './types';


const DataImport: React.FC<DataImportProps> = ({
  fileInputRef,
  onFileChange,
  isProcessing,
}) => {
  const s = importDataStyles();

  return (
    <div className={s.container()}>
      <div className={s.card()}>
        <h2 className={s.heading2()}>Data Import</h2>
        <div className={s.dataImportGrid()}>
          <div>
            <label className={s.label()}>Upload Analysis Output</label>
            <div className={s.uploadBox()}>
              <Upload className={s.uploadIcon()} />
              <p className={s.uploadText()}>
                Drop your data analysis txt or csv file here
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
        </div>
      </div>
    </div>
  );
};

export default DataImport;
