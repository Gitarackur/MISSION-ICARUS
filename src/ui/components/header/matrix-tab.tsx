import { useCallback, useMemo } from "react";
import { Download, Settings } from "lucide-react";
import { handleFileExport } from "@/app-layer/shared/utils";
import { IcarusVisualization } from "@/domain/workflow/main.types";
import { getVisualizationsForMatrix } from "@/domain/visualization/utils/main";
import { ThemeModeControl } from "@/ui/theme/theme-mode-control";
import {
  headerVariants,
  tabNavigationVariants,
  matrixTabVariants,
} from "./variants";
import { VisualizationTabButton } from "./visualization-tab";
import { MatrixTabProps, MatrixTabGroupProps } from "./types/index.types";

const MatrixTab = ({
  matrices,
  activeMatrixId,
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
        className="flex flex-shrink-0 items-center border-r border-gray-300 dark:border-gray-700 dark:bg-gray-950"
      >
        <img
          alt="icarus-image"
          src="assets/icarus-compressed.png"
          loading="lazy"
          className="mx-4 my-2 h-8 w-auto select-none"
        />
      </button>

      <div className="flex w-full overflow-x-auto overflow-y-hidden border-x border-gray-300 dark:border-gray-700">
        {matrices.map((matrix) => (
          <MatrixTabGroup
            key={matrix.id}
            matrix={matrix}
            isActive={activeMatrixId === matrix.id}
            visualizations={visualizationsByMatrix[matrix.id] ?? []}
            activeVisualizationId={activeVisualizationId}
            onMatrixSelect={onMatrixSelect}
            onVisualizationSelect={onVisualizationSelect}
          />
        ))}
        &nbsp;
      </div>

      {activeMatrixId && (
        <div className="flex flex-row gap-3 px-5 dark:bg-gray-950">
          <button
            type="button"
            className="flex items-center gap-2 text-gray-700 dark:text-gray-200"
            onClick={handleExport}
          >
            <Download className={s.buttonIcon()} />
            <span className="text-sm">Export</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 text-gray-700 dark:text-gray-200"
          >
            <Settings className={s.buttonIcon()} />
            <span className="text-sm">Settings</span>
          </button>

          <ThemeModeControl />
        </div>
      )}
    </div>
  );
};

const MatrixTabGroup = ({
  matrix,
  isActive,
  visualizations,
  activeVisualizationId,
  onMatrixSelect,
  onVisualizationSelect,
}: MatrixTabGroupProps) => {
  const { tabButton, visualizationList } = tabNavigationVariants({
    active: isActive,
  });
  const { wrapper } = matrixTabVariants({ active: isActive });

  return (
    <div
      className={wrapper()}
      aria-label={`${matrix.id} matrix tab group`}
      onClick={() => onMatrixSelect(matrix.id)}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMatrixSelect(matrix.id);
        }}
        className={tabButton()}
        title={matrix.id}
      >
        <span className="block truncate">{matrix.id}</span>
      </button>

      {visualizations.length > 0 && (
        <div
          className={visualizationList()}
          role="tablist"
          aria-label={`${matrix.id} visualizations`}
        >
          {visualizations.map((visualization, index) => (
            <VisualizationTabButton
              key={visualization.id}
              matrixId={matrix.id}
              visualization={visualization}
              index={index}
              isActive={activeVisualizationId === visualization.id}
              onVisualizationSelect={onVisualizationSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MatrixTab;
