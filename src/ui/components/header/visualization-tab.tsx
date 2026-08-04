import { IcarusVisualization } from '@/domain/workflow/main.types'
import { getVisualizationLabel } from '@/domain/visualization/utils/main'
import { tabNavigationVariants } from './variants'
import { BarChart3, X } from 'lucide-react';

export const VisualizationTabButton = ({
  matrixId,
  visualization,
  index,
  isActive,
  onVisualizationSelect,
  onVisualizationDelete,
}: {
  matrixId: string;
  visualization: IcarusVisualization;
  index: number;
  isActive: boolean;
  onVisualizationSelect?: (visualizationId: string, matrixId?: string) => void;
  onVisualizationDelete?: (visualizationId: string) => void;
}) => {
  const { visualizationButton } = tabNavigationVariants({ active: isActive });

  const label = getVisualizationLabel(visualization, index);

  return (
    <div className="flex flex-shrink-0 items-center rounded ring-1 ring-gray-200 dark:ring-gray-700">
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onVisualizationSelect?.(visualization.id, matrixId);
      }}
      className={visualizationButton()}
      title={label}
      role="tab"
      aria-selected={isActive}
    >
      <BarChart3 className="h-3 w-3 flex-shrink-0" />
      <span className="sr-only">{label}</span>
    </button>
      {onVisualizationDelete && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onVisualizationDelete(visualization.id);
          }}
          className="flex h-6 w-5 items-center justify-center rounded-r text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          title={`Delete ${label}`}
          aria-label={`Delete ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
