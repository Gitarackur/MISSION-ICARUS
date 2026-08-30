import { useCallback, useMemo } from "react";
import { Download, Settings, X } from "lucide-react";
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
        className="flex h-8 shrink-0 items-center rounded-md px-1 transition-colors hover:bg-white dark:hover:bg-gray-900"
      >
        <img
          alt="Icarus"
          src="assets/icarus-compressed.png"
          loading="lazy"
          className="mx-2 h-6 w-auto select-none dark:hidden"
        />
        <img
          alt="Icarus"
          src="assets/icarus-mark.svg"
          loading="lazy"
          className="mx-2 hidden h-6 w-auto select-none dark:block"
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
        <div className="flex border-l border-gray-200 h-8 flex-row items-center gap-1.5 px-2 dark:bg-gray-950">
          <button
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white"
            onClick={handleExport}
          >
            <Download className={s.buttonIcon()} />
            <span>Export</span>
          </button>

          <button
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white"
            onClick={onOpenSettings}
          >
            <Settings className={s.buttonIcon()} />
            <span>Settings</span>
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
  const { tabButton, visualizationList, matrixDeleteButton } =
    tabNavigationVariants({
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
      <div className="flex min-w-0 flex-1 items-stretch">
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
            className={matrixDeleteButton()}
            title={`Delete matrix ${matrix.id}`}
            aria-label={`Delete matrix ${matrix.id}`}
          >
            <X className="h-3.5 w-3.5" />
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
