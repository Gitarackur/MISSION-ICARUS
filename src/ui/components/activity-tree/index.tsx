import { useState, useMemo } from 'react';
import { IcarusSessionWithWorkflowRecord } from '@/app-layer/database/database.types';
import { activityStyleVariants } from './variants/activity.style.variant.tsx';
import TreeNode from './tree-node.tsx';
import { generateIcarusActivityNode } from '@/app-layer/algorithms/tree/index.ts';



const ActivityTree = ({ sessionData }: { sessionData: IcarusSessionWithWorkflowRecord }) => {
  const styles = activityStyleVariants();

  // sourceMatrixId
  const sourceMatrixId = useMemo(() => sessionData?.workflows?.[0]?.data?.matrices?.[0]?.id, [sessionData?.workflows])


  const [selectedWorkflow, setSelectedWorkflow] = useState(0);
  const currentWorkflow = sessionData.workflows?.[selectedWorkflow];

  generateIcarusActivityNode({
    sourceMatrixId: sourceMatrixId,
    activities: currentWorkflow?.data?.activities
  })

  const activityTree = useMemo(() => {
    return generateIcarusActivityNode({
      sourceMatrixId: sourceMatrixId,
      activities: currentWorkflow?.data?.activities
    });
  }, [currentWorkflow?.data?.activities, sourceMatrixId]);

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