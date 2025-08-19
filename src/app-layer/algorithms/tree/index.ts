import { IcarusActivity } from "../workflow/main.types";
import { ActivityTreeNode } from "./tree.types";

export const generateIcarusActivityNode = (activities: IcarusActivity[]) => {
  const createKey = (matrices: (number | string | undefined)[][]): string =>
    matrices?.length
      ? matrices
          .map((row) => row.map((id) => id ?? "undefined").join(","))
          .join("|")
      : "no-input";

  const groups = activities.reduce((acc, activity) => {
    const key = createKey(activity.inputMatrixIds);
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
