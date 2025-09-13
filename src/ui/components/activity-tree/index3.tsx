import { useState, useMemo } from "react";
import { nodeVariants, treeVariants } from "./variants/activity.style.variant";
import { ActivityTreeNodeForNonD3 } from "@/domain/tree/tree.types";
import {
  DisplayedActivityTree,
  TreeNodeProps,
} from "./types/activity-node.types";
import {
  buildActivityTreeForNonD3,
  getNodeDepthVariant,
} from "@/app-layer/algorithms/tree";

const TreeNode = ({
  node,
  onClickOfInputButton,
  onClickOfOutputButton,
}: TreeNodeProps) => {
  const nodeStyles = nodeVariants({ depth: getNodeDepthVariant(node.depth) });
  const hasChildren = node.children.length > 0;
  const hasMultipleChildren = node.children.length > 1;

  return (
    <div className={nodeStyles.wrapper()}>
      <div className={nodeStyles.nodeContainer()}>
        {/* Vertical line coming from above (except for root nodes) */}
        {node.depth > 0 && (
          <div className={nodeStyles.verticalLineChildFromTop()} />
        )}

        {/* Node Card */}
        <div
          className={nodeStyles.card()}
          onClick={() => onClickOfInputButton?.(node)}
        >
          <div className={nodeStyles.title()}>{node.activity.name}</div>
          <div className={nodeStyles.id()}>
            ID: {node.activity.id.slice(-8)}
          </div>
          <div className={nodeStyles.buttonGroup()}>
            <button
              className={`${nodeStyles.button()} ${nodeStyles.inputButton()}`}
              onClick={(e) => {
                e.stopPropagation();
                onClickOfInputButton?.(node);
              }}
            >
              ⬇ Input
            </button>
            <button
              className={`${nodeStyles.button()} ${nodeStyles.outputButton()}`}
              onClick={(e) => {
                e.stopPropagation();
                onClickOfOutputButton?.(node);
              }}
            >
              ⬆ Output
            </button>
          </div>
        </div>

        {/* Vertical line going down to children */}
        {hasChildren && (
          <>
            <div className={nodeStyles.verticalLineChildren()} />
            {/* Connection dot */}
            <div
              className={nodeStyles.connectionDot()}
            />
          </>
        )}
      </div>

      {/* Children */}
      {hasChildren && (
        <div className={nodeStyles.childrenContainer()}>
          {/* Horizontal line connecting multiple children */}
          {hasMultipleChildren && (
            <>
              <div
                className={nodeStyles.horizontalLine()}
                style={{
                  left: `${(1 / node.children.length) * 50}%`,
                  right: `${(1 / node.children.length) * 50}%`,
                }}
              />
              {/* Vertical lines dropping down to each child */}
              {node.children.map((_, index) => (
                <div
                  key={index}
                  className={nodeStyles.verticalLineChild()}
                  style={{
                    left: `${((index + 1) / (node.children.length + 1)) * 100}%`,
                  }}
                />
              ))}
            </>
          )}

          {node.children.map((child, index) => (
            <TreeNode
              key={child.activity.id}
              node={child}
              onClickOfInputButton={onClickOfInputButton}
              onClickOfOutputButton={onClickOfOutputButton}
              isFirst={index === 0}
              isLast={index === node.children.length - 1}
              siblingCount={node.children.length}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// === Main Component ===
const ActivityTree3 = ({
  sessionData,
  onClickOfInputButton,
  onClickOfOutputButton,
}: DisplayedActivityTree) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(0);
  const treeStyles = treeVariants();

  const activities = useMemo(
    () => sessionData.activities,
    [sessionData.activities]
  );
  const activityTree = useMemo(
    () => buildActivityTreeForNonD3(activities),
    [activities]
  );

  const handleInputButtonClick = (node: ActivityTreeNodeForNonD3) => {
    if (node.activity.inputMatrixReferences) {
      onClickOfInputButton?.(node.activity.inputMatrixReferences);
    }
  };

  const handleOutputButtonClick = (node: ActivityTreeNodeForNonD3) => {
    if (node.activity.outputMatrixReference) {
      onClickOfOutputButton?.(node.activity.outputMatrixReference);
    }
  };

  return (
    <div className={treeStyles.root()}>
      {/* Header */}
      <div className={treeStyles.header()}>
        <div className={treeStyles.headerContent()}>
          <div>
            <h2 className={treeStyles.title()}>{sessionData.name}</h2>
            <p className={treeStyles.subtitle()}>
              {sessionData.workflows?.[0]?.id}
            </p>
            <div className={treeStyles.stats()}>
              <span className={treeStyles.statBadge()}>
                {activities.length} Activities
              </span>
              {sessionData.workflows && (
                <span className={treeStyles.statBadge()}>
                  {sessionData.workflows.length} Workflow
                  {sessionData.workflows.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {sessionData.workflows?.length > 1 && (
            <select
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(Number(e.target.value))}
              className={treeStyles.select()}
            >
              {sessionData.workflows.map((_, i) => (
                <option key={i} value={i}>
                  Workflow {i + 1}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={treeStyles.content()}>
        <div className={treeStyles.container()}>
          {activityTree.length > 0 ? (
            <div className={treeStyles.treeWrapper()}>
              <div className="flex justify-center gap-12">
                {activityTree.map((rootNode, index) => (
                  <TreeNode
                    key={rootNode.activity.id}
                    node={rootNode}
                    onClickOfInputButton={handleInputButtonClick}
                    onClickOfOutputButton={handleOutputButtonClick}
                    isFirst={index === 0}
                    isLast={index === activityTree.length - 1}
                    siblingCount={activityTree.length}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className={treeStyles.empty()}>
              <div className={treeStyles.emptyIcon()}>🌳</div>
              <div className={treeStyles.emptyText()}>No Activities Found</div>
              <div className={treeStyles.emptySubtext()}>
                Add some activities to see the tree visualization
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityTree3;
