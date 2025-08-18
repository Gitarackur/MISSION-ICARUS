import { useState, useMemo } from 'react';
import { IcarusActivity } from '@/app-layer/algorithms/workflow/main.types';
import { IcarusSessionWithWorkflowRecord } from '@/app-layer/database/database.types';
import { activityStyleVariants } from './variants/activity.style.variant.tsx';
import { ActivityTreeNode } from './types/activity-node.types.ts';
import TreeNode from './tree-node.tsx';



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