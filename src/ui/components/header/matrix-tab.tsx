import { useCallback, useMemo } from "react";
import { Download, Settings } from "lucide-react";
import { handleFileExport } from "@/app-layer/shared/utils";
import { IcarusVisualization } from "@/domain/workflow/main.types";
import { getVisualizationsForMatrix } from "@/domain/visualization/utils/main";
import {
  headerVariants,
  tabNavigationVariants,
  matrixTabVariants,
} from "./variants";
import { VisualizationTabButton } from "./visualization-tab";
import { MatrixTabProps, MatrixTabGroupProps } from "./types/index.types";

const MAX_VISIBLE_VISUALIZATION_TABS = 3;

const MatrixTab = ({
  matrices,
  activeMatrixId,
  activeTab,
  onMatrixSelect,
  toggleSidebar,
  dataRows,
  visualizations = [],
  activeVisualizationId,
  onVisualizationSelect,
}: MatrixTabProps) => {
  const { tabList } = tabNavigationVariants();
  const s = headerVariants();

  const handleExport = useCallback(
    () => handleFileExport(dataRows, "proteomics-data"),
    [dataRows],
  );

  const visualizationsByMatrix = useMemo(
    () =>
      matrices.reduce<Record<string, IcarusVisualization[]>>((acc, matrix) => {
        acc[matrix.id] = getVisualizationsForMatrix(visualizations, matrix.id);
        return acc;
      }, {}),
    [matrices, visualizations],
  );

  return (
    <div className={`${tabList()} justify-between items-stretch`}>
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex flex-shrink-0 items-center border-r border-gray-300"
      >
        <img
          alt="icarus-image"
          src="assets/icarus-compressed.png"
          loading="lazy"
          className="mx-4 my-2 h-8 w-auto select-none"
        />
      </button>

      <div className="flex w-full overflow-x-auto overflow-y-hidden border-x border-gray-300">
        {matrices.map((matrix) => (
          <MatrixTabGroup
            key={matrix.id}
            matrix={matrix}
            isActive={activeMatrixId === matrix.id}
            activeTab={activeTab}
            visualizations={visualizationsByMatrix[matrix.id] ?? []}
            activeVisualizationId={activeVisualizationId}
            onMatrixSelect={onMatrixSelect}
            onVisualizationSelect={onVisualizationSelect}
          />
        ))}
        &nbsp;
      </div>

      {activeMatrixId && (
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
      )}
    </div>
  );
};

const MatrixTabGroup = ({
  matrix,
  isActive,
  activeTab,
  visualizations,
  activeVisualizationId,
  onMatrixSelect,
  onVisualizationSelect,
}: MatrixTabGroupProps) => {
  const visibleVisualizations = visualizations.slice(
    0,
    MAX_VISIBLE_VISUALIZATION_TABS,
  );
  const hiddenVisualizationCount =
    visualizations.length - visibleVisualizations.length;

  const { tabButton, visualizationList } = tabNavigationVariants({
    active: isActive,
  });
  const { wrapper } = matrixTabVariants({ active: isActive });
  const isVisualizationView = activeTab === "visualization";

  return (
    <div className={wrapper()} aria-label={`${matrix.id} matrix tab group`}>
      <button
        type="button"
        onClick={() => onMatrixSelect(matrix.id)}
        className={tabButton()}
        title={matrix.id}
      >
        <span className="block truncate">{matrix.id}</span>
      </button>

      {visibleVisualizations.length > 0 && (
        <div
          className={visualizationList()}
          role="tablist"
          aria-label={`${matrix.id} visualizations`}
        >
          {visibleVisualizations.map((visualization, index) => (
            <VisualizationTabButton
              key={visualization.id}
              matrixId={matrix.id}
              visualization={visualization}
              index={index}
              isActive={activeVisualizationId === visualization.id}
              onVisualizationSelect={
                isVisualizationView
                  ? () => onMatrixSelect(matrix.id)
                  : onVisualizationSelect
              }
            />
          ))}

          {hiddenVisualizationCount > 0 && (
            <span className="px-1 text-[10px] font-medium text-gray-500">
              +{hiddenVisualizationCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MatrixTab;
