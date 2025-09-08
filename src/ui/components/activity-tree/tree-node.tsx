import { ChevronRight, Activity, GitBranch, Plug, ArrowRight, Clock } from "lucide-react";
import { useState } from "react";
import { activityStyleVariants } from "./variants/activity.style.variant";
import MatrixModal from "./modal/matrix-modal";
import MatrixBadge from "./matrix-badge";
import { useModal } from "@/ui/design-system/Modal/context";
import { TableColumns } from "@/domain/workflow/main.types";
import { TreeNodeUI } from "./types/activity-node.types";




const TreeNode = ({
  node,
  level = 0,
  onClickOfInputButton,
  onClickOfOutputButton
}: TreeNodeUI) => {
  const styles = activityStyleVariants();

  const { openModal, closeModal } = useModal();
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;
  const canInteract = hasChildren;

  const getChevronClass = () => {
    if (!hasChildren) return styles.nodeChevronHidden();
    return `${styles.nodeChevron()} ${expanded ? styles.nodeChevronRotated() : ''}`;
  };


  const openMatrixModal = (title: string, columns: TableColumns) => {
    return;
    return openModal(
      <MatrixModal
        title={title}
        tableColumns={columns}
        onClose={() => closeModal()}
      />,
      "Another Example Modal"
    );
  };


  const openShowMatrixModal = (name: string, columns: TableColumns) => {
    return;
    return openMatrixModal(
      name,
      columns as TableColumns
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

              {Array.isArray(node.activity.inputColumnNames) ? (
                <MatrixBadge
                  data={node.activity.inputColumnNames}
                  label="Input"
                  icon={<ArrowRight className={styles.iconArrowIn()} />}
                  onOpen={() => {
                    if (node.activity?.name && node.activity.inputMatrixReferences && Array.isArray(node.activity.inputMatrixReferences)) {
                      onClickOfInputButton?.(node.activity.inputMatrixReferences);
                      openShowMatrixModal(node.activity.name, node.activity.inputMatrixReferences);
                    }
                  }}
                />

              ) : (
                <div className={`${styles.badgeContainer()} bg-red-100 text-red-700`}>
                  <span className={styles.textLabel()}>
                    Input:
                    - {node.activity.inputColumnNames ? JSON.stringify(node.activity.inputColumnNames) : "------"}
                  </span>
                </div>
              )}

              {Array.isArray(node.activity.outputColumnNames) ? (
                <MatrixBadge
                  data={node.activity.outputColumnNames}
                  label="Output"
                  icon={<ArrowRight className={styles.iconArrowOut()} />}
                  onOpen={() => {
                    if (node.activity?.name && node.activity.outputColumnNames && Array.isArray(node.activity.outputColumnNames)) {
                      onClickOfOutputButton?.(node.activity.outputMatrixReference as string);
                      openShowMatrixModal(node.activity.name, node.activity.outputColumnNames);
                    }
                  }}
                />
              ) : (
                <div className={`${styles.badgeContainer()} bg-red-100 text-red-700`}>
                  <span className={styles.textLabel()}>
                    Output:
                    {node.activity.outputMatrixReference ? JSON.stringify(node.activity.outputMatrixReference) : "------"}
                  </span>
                </div>
              )}

              {node.activity.timestamp && (
                <div className={styles.detailsTimeContainer()}>
                  <Clock className={styles.iconClock()} />
                  <span className={styles.textLabel()}>Time:</span>
                  <span className={styles.textValue()}>
                    {new Date(node.activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {expanded && hasChildren && (
          <div>
            {node.children.map((child, i) => (
              <TreeNode
                key={child.activity?.id || child.inputMatrixKey || i}
                node={child}
                level={level + 1}
                onClickOfInputButton={onClickOfInputButton}
                onClickOfOutputButton={onClickOfOutputButton}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};


export default TreeNode;