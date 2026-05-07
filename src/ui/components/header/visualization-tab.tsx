import { IcarusVisualization } from '@/domain/workflow/main.types'
import { getVisualizationLabel } from '@/domain/visualization/utils/main'
import { tabNavigationVariants } from './variants'
import { BarChart3 } from 'lucide-react';

export const VisualizationTabButton = ({
  matrixId,
  visualization,
  index,
  isActive,
  onVisualizationSelect,
}: {
  matrixId: string;
  visualization: IcarusVisualization;
  index: number;
  isActive: boolean;
  onVisualizationSelect?: (visualizationId: string, matrixId?: string) => void;
}) => {
  const { visualizationButton } = tabNavigationVariants({ active: isActive });

  const label = getVisualizationLabel(visualization, index);

  return (
    <button
      type="button"
      onClick={() => onVisualizationSelect?.(visualization.id, matrixId)}
      className={visualizationButton()}
      title={label}
      role="tab"
      aria-selected={isActive}
    >
      <BarChart3 className="h-3 w-3 flex-shrink-0" />
      <span className="sr-only">{label}</span>
    </button>
  );
};
