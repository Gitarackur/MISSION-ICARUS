import React, { useState, useMemo } from 'react';
import { ChevronRight, Activity, Plug, Clock, ArrowRight, GitBranch, Eye, X } from 'lucide-react';
import { IcarusActivity } from '@/app-layer/algorithms/workflow/main.types';
import { IcarusSessionWithWorkflowRecord } from '@/app-layer/database/database.types';
import { activityStyleVariants } from './variants/activity.style.variant.tsx';

interface ActivityTreeNode {
  activity?: IcarusActivity;
  inputMatrixKey?: string;
  children: ActivityTreeNode[];
}

interface MatrixData {
  title: string;
  data: (number | string | undefined)[][];
}



const MatrixModal = ({ modal, onClose }: { modal: MatrixData | null; onClose: () => void }) => {
  if (!modal) return null;

  const styles = activityStyleVariants();

  return (
    <div className={styles.modalOverlay()} onClick={onClose}>
      <div className={styles.modalContent()} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader()}>
          <h3 className={styles.modalTitle()}>{modal.title}</h3>
          <button onClick={onClose} className={styles.modalCloseBtn()}>
            <X className={styles.iconClose()} />
          </button>
        </div>
        <div className={styles.modalDataContainer()}>
          {modal.data.map((row, i) => (
            <div key={i} className={styles.modalRow()}>
              <span className={styles.modalRowLabel()}>Row {i + 1}:</span>
              <div className={styles.modalRowItems()}>
                {row.map((item, j) => (
                  <span key={j} className={styles.modalItem()}>
                    {item ?? 'undefined'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MatrixBadge = ({
  data,
  label,
  icon,
  onOpen
}: {
  data: (number | string | undefined)[][];
  label: string;
  icon: React.ReactNode;
  onOpen: (modal: MatrixData) => void;
}) => {
  const styles = activityStyleVariants();

  if (!data?.length) return null;

  const preview = `${data.length}×${Math.max(...data.map(row => row.length))}`;

  return (
    <div className={styles.badgeContainer()}>
      {icon}
      <span className={styles.badgeLabel()}>{label}:</span>
      <button
        onClick={() => onOpen({ title: label, data })}
        className={styles.badgeButton()}
      >
        {preview} <Eye className={styles.iconEye()} />
      </button>
    </div>
  );
};

const TreeNode = ({ node, level = 0 }: { node: ActivityTreeNode; level?: number }) => {
  const styles = activityStyleVariants();

  const [expanded, setExpanded] = useState(level < 1);
  const [modal, setModal] = useState<MatrixData | null>(null);

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
                {!node.activity && <span className={styles.textSecondary()}>({node.children.length})</span>}
              </div>
              {node.activity?.timestamp && (
                <div className={styles.textTimestamp()}>
                  {new Date(node.activity.timestamp).toLocaleTimeString()}
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












const ActivityTree = ({ sessionData }: { sessionData: IcarusSessionWithWorkflowRecord }) => {
  const styles = activityStyleVariants();

  const [selectedWorkflow, setSelectedWorkflow] = useState(0);
  const currentWorkflow = sessionData.workflows?.[selectedWorkflow];

  const activityTree = useMemo(() => {
    const activities = currentWorkflow.data.activities;

    const createKey = (matrices: (number | string | undefined)[][]): string =>
      matrices?.length ? matrices.map(row => row.map(id => id ?? 'undefined').join(',')).join('|') : 'no-input';

    const groups = activities.reduce((acc, activity) => {
      const key = createKey(activity.inputMatrixIds);
      (acc[key] ||= []).push(activity);
      return acc;
    }, {} as Record<string, IcarusActivity[]>);

    Object.values(groups).forEach(group =>
      group.sort((a, b) => {
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      })
    );

    const nodes: ActivityTreeNode[] = Object.entries(groups).map(([key, acts]) =>
      acts.length === 1
        ? { activity: acts[0], children: [] }
        : { inputMatrixKey: key, children: acts.map(activity => ({ activity, children: [] })) }
    );

    return nodes.sort((a, b) => {
      const getTime = (node: ActivityTreeNode): number => {
        const time = node.activity?.timestamp || node.children[0]?.activity?.timestamp;
        return time ? new Date(time).getTime() : Infinity;
      };
      return getTime(a) - getTime(b);
    });
  }, [currentWorkflow]);

  return (
    <div className={styles.layoutRoot()}>
      <div className={styles.layoutHeader()}>
        <div>
          <h2 className={styles.layoutHeaderText()}>Activity Tree</h2>
          <div className={styles.layoutHeaderSub()}>
            {sessionData.name} • {activityTree.length} groups • {currentWorkflow.data.activities.length} activities
          </div>
        </div>
        {sessionData.workflows.length > 1 && (
          <select
            value={selectedWorkflow}
            onChange={e => setSelectedWorkflow(Number(e.target.value))}
            className={styles.layoutSelect()}
          >
            {sessionData.workflows.map((_, i) => (
              <option key={i} value={i}>Workflow {i + 1}</option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.layoutContent()}>
        {activityTree.length ? (
          <div>
            {activityTree.map((node, i) => (
              <TreeNode key={node.activity?.id || node.inputMatrixKey || i} node={node} />
            ))}
          </div>
        ) : (
          <div className={styles.layoutEmpty()}>No activities found</div>
        )}
      </div>
    </div>
  );
};

export default ActivityTree;