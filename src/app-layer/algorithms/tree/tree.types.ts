export type MatrixNode = {
  id: string;
  createdByActivityId: string | null;
  createdAt?: string;
  children?: TreeNode[];
};

export type ActivityNode = {
  id: string;
  pluginId: string;
  params: Record<string, unknown>;
  inputMatrixIds: string[];
  outputMatrixId: string;
  timestamp?: string;
  humanLabel?: string;
  children?: TreeNode[];
};

type TreeNode = MatrixNode | ActivityNode;