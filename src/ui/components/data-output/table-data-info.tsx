import { importDataStyles } from "./variants/data-output.variant";

const PreviewTableDataInfo = ({
  originalDataRowsCount,
  originalColumnsCount,
  selectedColumnsCount,
}: {
  originalDataRowsCount: number;
  originalColumnsCount: number;
  selectedColumnsCount: number;
}) => {
  const s = importDataStyles();

  return (
    <div>
      <div className="">
        <h3 className={s.heading3()}>Data Summary</h3>
        <div className={s.summaryContainer()}>
          <div className={s.summaryRow()}>
            <span className={s.summaryLabel()}>Total Data Amount:</span>
            <span className={s.summaryValue()}>{originalDataRowsCount}</span>
          </div>
          <div className={s.summaryRow()}>
            <span className={s.summaryLabel()}>Columns:</span>
            <span className={s.summaryValue()}>{originalColumnsCount}</span>
          </div>
          <div className={s.summaryRow()}>
            <span className={s.summaryLabel()}>Selected Columns:</span>
            <span className={s.summaryValue()}>{selectedColumnsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewTableDataInfo;
