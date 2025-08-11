import { db, IcarusDB } from ".";
import { IcarusSessionRecord, IcarusWorkflowRecord } from "./database.types";


class DBAdapter {
  db:IcarusDB = db;

  constructor() {
    this.db = db;
  }

  // Save or update a session
  async saveSession(session: IcarusSessionRecord) {
    await this.db.sessions.put(session);
  }

  // Get session by ID
  async getSessionById(id: string): Promise<IcarusSessionRecord | undefined> {
    return await this.db.sessions.get(id);
  }

  // Get all sessions
  async getAllSessions(): Promise<IcarusSessionRecord[]> {
    return await this.db.sessions.toArray();
  }

    // Delete a session by ID
  async deleteSession(id: string) {
    await this.db.sessions.delete(id);
  }






  // Save or update a workflow
  async saveWorkflow(workflow: IcarusWorkflowRecord) {
    await this.db.workflows.put(workflow);
  }

  // Get workflow by ID
  async getWorkflowById(id: string): Promise<unknown | undefined> {
    return await this.db.workflows.get(id);
  }

  // Get workflows by array of IDs
  async getWorkflowsByIds(ids: string[]): Promise<unknown[]> {
    return await this.db.workflows.where('id').anyOf(ids).toArray();
  }

  // Delete a workflow by ID
  async deleteWorkflow(id: string) {
    await this.db.workflows.delete(id);
  }





  
  // get session with workflows
  async getSessionWithWorkflows(id: string) {
    const session = await this.getSessionById(id);
    if (!session) return null;

    const workflows = await this.getWorkflowsByIds(session.workflowIds || []);
    return { ...session, workflows };
  }

  // Update workflowIds linked to a session
  async updateSessionWorkflows(sessionId: string, workflowIds: string[]) {
    const session = await this.db.sessions.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    session.workflowIds = workflowIds;
    await this.db.sessions.put(session);
  }




  // delete sessions with workflows
  async deleteSessionWithWorkflows(sessionId: string) {
    const session = await this.db.sessions.get(sessionId);
    if (!session) return;

    if (session.workflowIds && session.workflowIds.length > 0) {
      await this.db.workflows.bulkDelete(session.workflowIds);
    }

    await this.db.sessions.delete(sessionId);
  }
}

export const IcarusDBAdapter = new DBAdapter();
