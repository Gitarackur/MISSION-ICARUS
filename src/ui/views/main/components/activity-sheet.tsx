import SlidingSheet from "@/ui/design-system/Sheet/main";
import ActivityTree2 from "@/ui/components/activity-tree/index2";
import { IcarusSessionWithWorkflowRecord } from "@/app-layer/database/database.types";

export function ActivitySheet({
  activeMatrixId,
  activeSession,
  isOpen,
  onClose,
  onMatrixSelect,
}: {
  activeMatrixId: string | null;
  activeSession: IcarusSessionWithWorkflowRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onMatrixSelect: (matrixId: string) => void;
}) {
  return (
    <SlidingSheet
      isOpen={isOpen && !!activeSession}
      onClose={onClose}
      position="right"
      title="Activity Tree"
      sidebarWidth="100rem"
      overlayClassName="!bg-opacity-80"
      panelClassName="bg-blue-50 border border-gray-200 w-150"
      headerClassName="border-blue-300"
      bodyClassName="p-0"
    >
      {activeSession && (
        <ActivityTree2
          sessionData={activeSession}
          activeMatrixId={activeMatrixId}
          onClickOfOutputButton={onMatrixSelect}
          onClickOfInputButton={onMatrixSelect}
        />
      )}
    </SlidingSheet>
  );
}
