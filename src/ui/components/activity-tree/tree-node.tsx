import { ChevronRight, Activity, GitBranch, Plug, ArrowRight, Clock } from "lucide-react";
import { useState } from "react";
import { activityStyleVariants } from "./variants/activity.style.variant";
import MatrixModal from "./modal/matrix-modal";
import { MatrixModalData } from "./types/activity-node.types";
import MatrixBadge from "./matrix-badge";
import { ActivityTreeNode } from "@/app-layer/algorithms/tree/tree.types";




const TreeNode = ({ node, level = 0 }: { node: ActivityTreeNode; level?: number }) => {
  const styles = activityStyleVariants();

  const [expanded, setExpanded] = useState(level < 1);
  const [modal, setModal] = useState<MatrixModalData | null>(null);

  const hasChildren = node.children?.length > 0;
  const hasDetails = !!(node.activity?.pluginId || node.activity?.inputMatrixIds?.length || node.activity?.outputMatrixId?.length);
  const canInteract = hasChildren || hasDetails;

  const getChevronClass = () => {
    if (!hasChildren) return styles.nodeChevronHidden();
    return `${styles.nodeChevron()} ${expanded ? styles.nodeChevronRotated() : ''}`;
  };

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
                <span className={styles.textPlugin()}>{node.activity.pluginId}</span>
              </div>
            )}

            {!node.activity && node.inputMatrixKey && (
              <div className={styles.textMatrixKey()}>
                {node.inputMatrixKey.length > 20 ? `${node.inputMatrixKey.slice(0, 20)}...` : node.inputMatrixKey}
              </div>
            )}
          </div>
        </div>

        {expanded && node.activity && hasDetails && (
          <div className={styles.detailsContainer()}>
            <div className={styles.detailsWrapper()}>
              {node.activity.inputMatrixIds && (
                <MatrixBadge
                  data={node.activity.inputMatrixIds}
                  label="Input"
                  icon={<ArrowRight className={styles.iconArrowIn()} />}
                  onOpen={setModal}
                />
              )}

              {node.activity.outputMatrixId && (
                <MatrixBadge
                  data={[node.activity.outputMatrixId] as unknown as (number | string | undefined)[][]}
                  label="Output"
                  icon={<ArrowRight className={styles.iconArrowOut()} />}
                  onOpen={setModal}
                />
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

      <MatrixModal modal={modal} onClose={() => setModal(null)} />
    </>
  );
};


export default TreeNode;