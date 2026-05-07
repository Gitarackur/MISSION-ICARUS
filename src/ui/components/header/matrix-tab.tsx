import { IcarusMatrix, IcarusVisualization } from '@/domain/workflow/main.types'
import { tabNavigationVariants } from './variants'
import { BarChart3, Download, Settings } from 'lucide-react';
import { headerVariants } from "./variants";
import { useCallback, useMemo } from 'react';
import { handleFileExport } from '@/app-layer/shared/utils';
import { ProteinRow } from '@/domain/proteins/index.types';
import {
  getVisualizationLabel,
  getVisualizationsForMatrix,
} from '@/domain/visualization/utils/main';
import { tabsIdTypes } from '@/ui/components/tabs/types/index.types';

const MatrixTab = ({
  matrices,
  activeMatrixId,
  activeTab,
  setActiveMatrixId,
  toggleSidebar,
  dataRows,
  visualizations = [],
  activeVisualizationId,
  onVisualizationSelect,
}: {
  matrices: IcarusMatrix[];
  activeMatrixId: string;
  activeTab: tabsIdTypes;
  toggleSidebar: () => void;
  setActiveMatrixId: (id: string) => void;
  dataRows?: ProteinRow[];
  visualizations?: IcarusVisualization[];
  activeVisualizationId?: string;
  onVisualizationSelect?: (visualizationId: string, matrixId?: string) => void;
}) => {
  const { tabList, tabButton } = tabNavigationVariants();
  const s = headerVariants();

  const handleExport = useCallback(
    () => handleFileExport(dataRows, 'proteomics-data'),
    [dataRows]
  );

  const visualizationsByMatrix = useMemo(
    () =>
      matrices.reduce<Record<string, IcarusVisualization[]>>((acc, matrix) => {
        acc[matrix.id] = getVisualizationsForMatrix(visualizations, matrix.id);
        return acc;
      }, {}),
    [matrices, visualizations]
  );

  return (
    <>
      <div className={`${tabList()} justify-between items-stretch`}>
        <button
          onClick={toggleSidebar}
          className="border-r border-gray-300 flex-shrink-0 flex items-center"
        >
          <img
            alt="icarus-image"
            src={"assets/icarus-compressed.png"}
            loading="lazy"
            className="h-8 w-auto select-none mx-4 my-2"
          />
        </button>
        <div className="border-x border-gray-300 w-full flex overflow-x-auto overflow-y-hidden">
          {matrices.map((matrix) => {
            const matrixVisualizations = visualizationsByMatrix[matrix.id] ?? [];
            const isActiveMatrix = activeMatrixId === matrix.id;
            const selectMatrix = () => setActiveMatrixId(matrix.id);
            const shouldMatrixClickWin = activeTab === "visualization";
            const activeMatrixVisualization = matrixVisualizations.find(
              (visualization) => visualization.id === activeVisualizationId
            );
            const visualizationCount = matrixVisualizations.length;

            return (
              <div
                key={matrix.id}
                onClickCapture={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest("[data-visualization-control='true']")) {
                    return;
                  }

                  selectMatrix();
                }}
                onClick={selectMatrix}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectMatrix();
                  }
                }}
                className={[
                  "flex min-w-[220px] max-w-[420px] cursor-pointer items-stretch border-r border-gray-200 bg-gray-50 text-left",
                  isActiveMatrix
                    ? "bg-white shadow-sm ring-1 ring-inset ring-blue-200"
                    : "",
                ].join(" ")}
                role="button"
                tabIndex={0}
                aria-label={`${matrix.id} matrix tab`}
              >
                {matrixVisualizations.length > 0 && (
                  <div
                    className={[
                      "flex max-w-[180px] items-center gap-1 border-r px-2",
                      isActiveMatrix
                        ? "border-blue-100 bg-blue-50/50"
                        : "border-gray-200 bg-gray-100/80",
                    ].join(" ")}
                    role="tablist"
                    aria-label={`${matrix.id} visualizations`}
                  >
                    {(activeMatrixVisualization
                      ? [activeMatrixVisualization]
                      : matrixVisualizations.slice(0, 1)
                    ).map((visualization, index) => (
                      <button
                        key={visualization.id}
                        type="button"
                        data-visualization-control="true"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (shouldMatrixClickWin) {
                            selectMatrix();
                            return;
                          }

                          onVisualizationSelect?.(visualization.id, matrix.id);
                        }}
                        className={[
                          "flex max-w-[120px] flex-shrink-0 items-center justify-center rounded p-1 text-[11px] font-medium transition-colors",
                          activeVisualizationId === visualization.id
                            ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                            : "bg-white text-gray-600 ring-1 ring-gray-200 hover:text-gray-900",
                        ].join(" ")}
                        title={getVisualizationLabel(visualization, index)}
                        role="tab"
                        aria-selected={activeVisualizationId === visualization.id}
                      >
                        <BarChart3 className="h-3 w-3 flex-shrink-0" />
                        <span className="sr-only">
                          {getVisualizationLabel(visualization, index)}
                        </span>
                      </button>
                    ))}
                    {visualizationCount > 1 && (
                      <span className="text-[10px] font-medium text-gray-500">
                        {visualizationCount}
                      </span>
                    )}
                  </div>
                )}

                <span
                  className={[
                    tabButton({ active: isActiveMatrix }),
                    "min-w-[140px] max-w-none flex-1 border-r-0 text-left",
                  ].join(" ")}
                  title={matrix.id}
                >
                  <span className="block truncate">{matrix.id}</span>
                </span>
              </div>
            );
          })}
          &nbsp;
        </div>

        {
          activeMatrixId && (
            <div className="flex flex-row gap-3 px-5">
              <button 
                type="button" 
                className="flex items-center gap-2"
                onClick={handleExport} 
              >
                <Download className={s.buttonIcon()} />
                <span className="text-sm">Export</span>
              </button>
              
              <button type="button" className="flex items-center gap-2">
                <Settings className={s.buttonIcon()} />
                <span className="text-sm">Settings</span>
              </button>
            </div>
          )
        }
      </div>
    </>
  );
};

export default MatrixTab;
