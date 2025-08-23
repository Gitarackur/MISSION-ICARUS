import {
  IcarusActivity,
} from "@/domain/workflow/main.types";
import { ActivityTreeNode } from "@/domain/tree/tree.types";
import { IcarusActivityNodeParams } from "@/domain/activity/main.types";

export const generateIcarusActivityNode = ({
  sourceMatrixId,
  activities,
}: IcarusActivityNodeParams) => {
  const groups = activities.reduce((acc, activity) => {
    // TODO: I have to find a way to group these activities based on a shared source /data which i may include intp the IcarusActivity interface soon

    // const key = createKeyFromTableMatrices(activity.inputMatrixIds as unknown as never);

    const key = sourceMatrixId as string;
    (acc[key] ||= []).push(activity);
    return acc;
  }, {} as Record<string, IcarusActivity[]>);

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
