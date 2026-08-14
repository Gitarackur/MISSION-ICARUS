import React from 'react';
import { statisticsStyles } from '../style-variants';
import {
  proteomicsStyles,
  ProteomicsMenu,
  IntensityDistributionPlot,
  SummaryStatistics,
} from '../proteomics';
import { ProteinDataPanelProps } from '../types/index.types';


const ProteinDataPanel: React.FC<ProteinDataPanelProps> = ({
  onMenuAction,
  dataTable,
  dataColumns,
  allColumnarData,
}) => {
  const style = statisticsStyles();
  const proteomics = proteomicsStyles();

  const hasMenuContext =
    onMenuAction && dataTable && dataColumns && allColumnarData;

  return (
    <div className={style.container()}>
      {hasMenuContext && (
        <ProteomicsMenu
          onMenuAction={onMenuAction}
          dataTable={dataTable}
          dataColumns={dataColumns}
          allColumnarData={allColumnarData}
        />
      )}

      {dataTable && (
        <>
          <SummaryStatistics
            dataTable={dataTable}
            dataColumns={dataColumns ?? []}
          />

          {/* Chart */}
          <div className={proteomics.card()}>
            <h3 className={proteomics.cardTitle()}>Intensity Distribution</h3>
            <IntensityDistributionPlot
              dataTable={dataTable}
              dataColumns={dataColumns}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ProteinDataPanel;
