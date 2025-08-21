import { ChevronRight, Activity, GitBranch, Plug, ArrowRight, Clock } from "lucide-react";
import { useState } from "react";
import { activityStyleVariants } from "./variants/activity.style.variant";
import MatrixModal from "./modal/matrix-modal";
import MatrixBadge from "./matrix-badge";
import { ActivityTreeNode } from "@/domain/tree/tree.types";
import { useModal } from "@/ui/design-system/Modal/context";
import { TableMatrices } from "@/domain/workflow/main.types";




const TreeNode = ({ node, level = 0 }: { node: ActivityTreeNode; level?: number }) => {
  const styles = activityStyleVariants();

  const { openModal, closeModal } = useModal();

  // const [expanded, setExpanded] = useState(level < 1);
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;
  const canInteract = hasChildren;

  const getChevronClass = () => {
    if (!hasChildren) return styles.nodeChevronHidden();
    return `${styles.nodeChevron()} ${expanded ? styles.nodeChevronRotated() : ''}`;
  };


  const openMatrixModal = (title: string, matrices: TableMatrices) => {
    openModal(
      <MatrixModal
        title={title}
        tableMatrices={matrices}
        onClose={() => closeModal()}
      />,
      "Another Example Modal"
    );
  };


  const openShowMatrixModal = (name: string, matrices: TableMatrices | unknown[][]) => {
    return openMatrixModal(
      name,
      matrices as TableMatrices
    )
  }

  return (
    <>
      <div className={`${styles.nodeContainer()} ${level > 0 ? styles.nodeWithBorder() : ''}`}>
        <div
          className={`${styles.nodeContent()} ${canInteract ? styles.nodeInteractive() : ''}`}
          onClick={canInteract ? () => setExpanded(!expanded) : undefined}
        >
          <ChevronRight className={getChevronClass()} />
          {node.activity ? <Activity className={styles.iconActivity()} /> : <GitBranch className={styles.iconGroup()} />}

          <div className="flex-1 min-w-0 flex items-center justify-between">
            <div className="min-w-0">
              <div className={styles.textPrimary()}>
                {node.activity?.id || 'Input Group'}
                {!node.activity && <span className={styles.textSecondary()}>
                  ({node.children.length})
                </span>}
              </div>

              <div className={styles.textPrimary()}>
                {node.activity?.name.toLocaleUpperCase()}
              </div>

              {node.activity?.timestamp && (
                <div className={styles.textTimestamp()}>
                  {new Date(node.activity.timestamp).toString()}
                </div>
              )}
            </div>

            {node.activity?.pluginId && (
              <div className={styles.badgeContainer()}>
                <Plug className={styles.iconPlug()} />
                <span className={styles.textPlugin()}>
                  {node.activity.pluginId}
                </span>
              </div>
            )}

            {!node.activity && node.inputMatrixKey && (
              <div className={styles.textMatrixKey()}>
                {node.inputMatrixKey.length > 20 ? `${node.inputMatrixKey.slice(0, 20)}...` : node.inputMatrixKey}
              </div>
            )}
          </div>
        </div>

        {expanded && node.activity && (
          <div className={styles.detailsContainer()}>
            <div className={styles.detailsWrapper()}>

              {
                // node.activity.inputMatrixIds !== null && node.activity.inputMatrixIds !== undefined && (
                Array.isArray(node.activity.inputMatrixIds) ? (
                  <MatrixBadge
                    data={node.activity.inputMatrixIds}
                    label="Input"
                    icon={<ArrowRight className={styles.iconArrowIn()} />}
                    onOpen={() => {
                      if (node.activity?.name && node.activity.inputMatrixIds && Array.isArray(node.activity.inputMatrixIds)) {
                        openShowMatrixModal(node.activity.name, node.activity.inputMatrixIds);
                      }
                    }}
                  />
                ) : (
                  <div className={`${styles.badgeContainer()} bg-red-100 text-red-700`}>
                    <span className={styles.textLabel()}>
                      Input:
                      {/* Unknown Type */}
                      {/* - {typeof node.activity.inputMatrixIds} */}
                      - {node.activity.inputMatrixIds ? JSON.stringify(node.activity.inputMatrixIds) : "------"}
                    </span>
                  </div>
                )
                // )
              }

              {node.activity.outputMatrixId !== null && node.activity.outputMatrixId !== undefined && (
                Array.isArray(node.activity.outputMatrixId) ? (
                  <MatrixBadge
                    data={node.activity.outputMatrixId}
                    label="Output"
                    icon={<ArrowRight className={styles.iconArrowOut()} />}
                    onOpen={() => {
                      if (node.activity?.name && node.activity.outputMatrixId && Array.isArray(node.activity.outputMatrixId)) {
                        openShowMatrixModal(node.activity.name, node.activity.outputMatrixId);
                      }
                    }}
                  />
                ) : (
                  <div className={`${styles.badgeContainer()} bg-red-100 text-red-700`}>
                    <span className={styles.textLabel()}>
                      {/* Output: Unknown Type - {typeof node.activity.outputMatrixId} */}
                      Output:
                      {JSON.stringify(node.activity.outputMatrixId)}
                      {/* { node.activity.outputMatrixId as number } */}
                    </span>
                  </div>
                )
              )}

              {node.activity.timestamp && (
                <div className={styles.detailsTimeContainer()}>
                  <Clock className={styles.iconClock()} />
                  <span className={styles.textLabel()}>Time:</span>
                  <span className={styles.textValue()}>{node.activity.timestamp}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {expanded && hasChildren && (
          <div>
            {node.children.map((child, i) => (
              <TreeNode key={child.activity?.id || child.inputMatrixKey || i} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};


export default TreeNode;