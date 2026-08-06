import SlidingSheet from "@/ui/design-system/Sheet/main";
import ActivityTree2 from "@/ui/components/activity-tree/index2";
import type { IcarusSessionWithWorkflow } from "@/domain/session";


export function ActivitySheet({
  activeMatrixId,
  activeSession,
  isOpen,
  onClose,
  onMatrixSelect,
  onVisualizationSelect,
  onMatrixDelete,
  onActivityDelete,
  onVisualizationDelete,
}: {
  activeMatrixId: string | null;
  activeSession: IcarusSessionWithWorkflow | null;
  isOpen: boolean;
  onClose: () => void;
  onMatrixSelect: (matrixId: string) => void;
  onVisualizationSelect: (visualizationId: string, sourceMatrixId?: string) => void;
  onMatrixDelete: (matrixId: string) => void;
  onActivityDelete: (activityId: string) => void;
  onVisualizationDelete: (visualizationId: string) => void;
}) {
  return (
    <SlidingSheet
      isOpen={isOpen && !!activeSession}
      onClose={onClose}
      position="right"
      title="Activity Tree"
      sidebarWidth="100rem"
      overlayClassName="!bg-opacity-80"
      panelClassName="bg-blue-50 border border-gray-200 w-150 dark:border-gray-800 dark:bg-gray-950"
      headerClassName="border-blue-300 dark:border-gray-800"
      bodyClassName="p-0"
    >
      {activeSession && (
        <ActivityTree2
          sessionData={activeSession}
          activeMatrixId={activeMatrixId}
          onClickOfOutputButton={onMatrixSelect}
          onClickOfInputButton={onMatrixSelect}
          onClickOfVisualizationButton={onVisualizationSelect}
          onDeleteMatrix={onMatrixDelete}
          onDeleteActivity={onActivityDelete}
          onDeleteVisualization={onVisualizationDelete}
        />
      )}
    </SlidingSheet>
  );
}
