// ---- Types ----
export interface Workflow {
  id: string;
  createdAt: number;
  data: unknown; // replace with your workflow schema
}

export interface Session {
  id: string;
  name: string;
  date: string; // ISO date string
  workflowIds: string[];
}

export interface SessionWithWorkflows extends Omit<Session, 'workflowIds'> {
  workflows: Workflow[];
}
