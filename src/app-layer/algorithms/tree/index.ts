import { ActivityTreeNode, ActivityTreeNodeForD3, ActivityTreeNodeForNonD3 } from "@/domain/tree/tree.types";
import { IcarusActivityNodeParams, MapIcarusActivity } from "@/domain/activity/main.types";
import { IcarusActivityRecord } from "@/app-layer/database/database.types";

export const generateIcarusActivityNode = ({
  sourceMatrixId,
  activities,
}: IcarusActivityNodeParams) => {
  const groups = activities.reduce((acc, activity) => {
    const key = sourceMatrixId as string;
    (acc[key] ||= []).push(activity);
    return acc;
  }, {} as MapIcarusActivity);

  Object.values(groups).forEach((group) =>
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
      : {
          inputMatrixKey: key,
          children: acts.map((activity) => ({ activity, children: [] })),
        }
  );

  return nodes.sort((a, b) => {
    const getTime = (node: ActivityTreeNode): number => {
      const time =
        node.activity?.timestamp || node.children[0]?.activity?.timestamp;
      return time ? new Date(time).getTime() : Infinity;
    };
    return getTime(a) - getTime(b);
  });
};




// Build a tree structure from a flat list of activities
// Each activity may reference an input matrix and produce an output matrix
// The tree is built by linking activities based on these matrix references

export const buildActivityTree = (activities: IcarusActivityRecord[]): ActivityTreeNodeForD3[] => {
  if (!activities.length) return [];

  const activityMap = new Map<string, ActivityTreeNodeForD3>();
  activities.forEach((activity) => {
    activityMap.set(activity.id, { activity, children: [], depth: 0 });
  });

  const outputMatrixMap = new Map<string, ActivityTreeNodeForD3>();
  activities.forEach((activity) => {
    if (activity.outputMatrixReference) {
      outputMatrixMap.set(activity.outputMatrixReference, activityMap.get(activity.id)!);
    }
  });

  const roots: ActivityTreeNodeForD3[] = [];

  activities.forEach((activity) => {
    const inputMatrixId = activity.inputMatrixReferences;
    if (inputMatrixId) {
      const parent = outputMatrixMap.get(inputMatrixId);
      if (parent) {
        const child = activityMap.get(activity.id)!;
        child.depth = parent.depth + 1;
        parent.children.push(child);
      } else {
        roots.push(activityMap.get(activity.id)!);
      }
    } else {
      roots.push(activityMap.get(activity.id)!);
    }
  });

  return roots;
};







// Similar to buildActivityTree but returns a structure without D3-specific properties
// This can be useful for rendering in non-D3 contexts
// and for simpler tree manipulations

export const buildActivityTreeForNonD3 = (
  activities: IcarusActivityRecord[]
): ActivityTreeNodeForNonD3[] => {
  if (!activities.length) return [];

  const activityMap = new Map<string, ActivityTreeNodeForNonD3>();
  activities.forEach((activity) => {
    activityMap.set(activity.id, {
      activity,
      children: [],
      depth: 0,
    });
  });

  const outputMatrixMap = new Map<string, ActivityTreeNodeForNonD3>();
  activities.forEach((activity) => {
    if (activity.outputMatrixReference) {
      outputMatrixMap.set(
        activity.outputMatrixReference,
        activityMap.get(activity.id)!
      );
    }
  });

  const roots: ActivityTreeNodeForNonD3[] = [];

  activities.forEach((activity) => {
    const inputMatrixId = activity.inputMatrixReferences;
    if (inputMatrixId) {
      const parent = outputMatrixMap.get(inputMatrixId);
      if (parent) {
        const child = activityMap.get(activity.id)!;
        child.depth = parent.depth + 1;
        parent.children.push(child);
      } else {
        roots.push(activityMap.get(activity.id)!);
      }
    } else {
      roots.push(activityMap.get(activity.id)!);
    }
  });

  return roots;
};





// Determine the variant style based on the depth of the node
// This can be used to apply different styles or behaviors to nodes at different levels of the tree
// For example, root nodes might have a distinct appearance compared to leaf nodes
// This function returns a variant identifier based on the depth
export const getNodeDepthVariant = (depth: number) => {
  switch (depth) {
    case 0:
      return 0;
    case 1:
      return 1;
    case 2:
      return 2;
    default:
      return "default";
  }
};
