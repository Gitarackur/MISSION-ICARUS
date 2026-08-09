import { IcarusVisualization } from "@/domain/workflow/main.types";
import { getVisualizationLabel } from "@/domain/visualization/utils/main";
import { tabNavigationVariants } from "./variants";
import { BarChart3, X } from "lucide-react";
import { useEffect, useRef } from "react";

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
  const {
    visualizationButton,
    visualizationDeleteButton,
    visualizationTabWrapper,
  } = tabNavigationVariants({ active: isActive });
  const tabRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isActive) return;
    tabRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [isActive]);

  const label = getVisualizationLabel(visualization, index);

  return (
    <div ref={tabRef} className={visualizationTabWrapper()}>
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
          className={visualizationDeleteButton()}
          title={`Delete ${label}`}
          aria-label={`Delete ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
