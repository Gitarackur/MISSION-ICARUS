import { useCallback, useMemo } from "react";
import { Download, Settings, Trash2 } from "lucide-react";
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
import { useActiveTabVisibility } from "./hooks/useActiveTabVisibility";

const MatrixTab = ({
  matrices,
  activeMatrixId,
  onMatrixSelect,
  toggleSidebar,
  visualizations = [],
  activeVisualizationId,
  onVisualizationSelect,
  onMatrixDelete,
  onVisualizationDelete,
  onOpenSettings,
  onOpenExport,
}: MatrixTabProps) => {
  const { tabList, tabScroller } = tabNavigationVariants();
  const s = headerVariants();

  const handleExport = useCallback(
    () => onOpenExport?.(),
    [onOpenExport],
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
    <div className={tabList()}>
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex flex-shrink-0 items-center border-r border-gray-300 dark:border-gray-700 dark:bg-gray-950"
      >
        <img
          alt="Icarus"
          src="assets/icarus-compressed.png"
          loading="lazy"
          className="mx-4 my-2 h-8 w-auto select-none dark:hidden"
        />
        <img
          alt="Icarus"
          src="assets/icarus-mark.svg"
          loading="lazy"
          className="mx-4 my-2 hidden h-8 w-auto select-none dark:block"
        />
      </button>

      <div className={tabScroller()}>
        {matrices.map((matrix) => (
          <MatrixTabGroup
            key={matrix.id}
            matrix={matrix}
            isActive={activeMatrixId === matrix.id}
            visualizations={visualizationsByMatrix[matrix.id] ?? []}
            activeVisualizationId={activeVisualizationId}
            onMatrixSelect={onMatrixSelect}
            onVisualizationSelect={onVisualizationSelect}
            onMatrixDelete={onMatrixDelete}
            onVisualizationDelete={onVisualizationDelete}
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
            onClick={onOpenSettings}
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
  onMatrixDelete,
  onVisualizationDelete,
}: MatrixTabGroupProps) => {
  const { tabButton, visualizationList } = tabNavigationVariants({
    active: isActive,
  });
  const { wrapper } = matrixTabVariants({ active: isActive });
  const groupRef = useActiveTabVisibility<HTMLDivElement>(isActive);

  return (
    <div
      ref={groupRef}
      className={wrapper()}
      aria-label={`${matrix.id} matrix tab group`}
      onClick={() => onMatrixSelect(matrix.id)}
    >
      <div className="flex min-w-[180px] flex-1 items-stretch">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMatrixSelect(matrix.id);
          }}
          className={`${tabButton()} min-w-0 flex-1`}
          title={matrix.id}
        >
          <span className="block truncate">{matrix.id}</span>
        </button>
        {onMatrixDelete && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMatrixDelete(matrix.id);
            }}
            className="flex w-8 flex-shrink-0 items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300"
            title={`Delete matrix ${matrix.id}`}
            aria-label={`Delete matrix ${matrix.id}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

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
              onVisualizationDelete={onVisualizationDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MatrixTab;
