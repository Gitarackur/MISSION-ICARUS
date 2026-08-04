import { db, IcarusDB } from ".";
import {
  IcarusActivityRecord,
  IcarusMatrixRecord,
  IcarusSessionRecord,
  IcarusSessionWithWorkflowRecord,
  IcarusVisualizationRecord,
  IcarusWorkflowRecord,
} from "./database.types";
import {
  assertDeletionPlanIntegrity,
  getPhysicalDeletionScope,
  hasSameDeletionScope,
  planActivityDeletion,
  planMatrixDeletion,
  planVisualizationDeletion,
  type DeletionPlan,
  type SessionDeletionResult,
} from "./deletion";

class DBAdapter {
  db: IcarusDB = db;

  constructor() {
    this.db = db;
  }

  // Save or update a session
  async saveSession(session: IcarusSessionRecord) {
    return await this.db.sessions.put(session);
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
    return await this.db.sessions.delete(id);
  }

  // Save or update a workflow
  async saveWorkflow(workflow: IcarusWorkflowRecord) {
    return await this.db.workflows.put(workflow);
  }

  // Get workflow by ID
  async getWorkflowById(id: string): Promise<IcarusWorkflowRecord | undefined> {
    return await this.db.workflows.get(id);
  }

  // Get workflows by array of IDs
  async getWorkflowsByIds(ids: string[]): Promise<IcarusWorkflowRecord[]> {
    return await this.db.workflows.where("id").anyOf(ids).toArray();
  }

  // Delete a workflow by ID
  async deleteWorkflow(id: string) {
    return await this.db.workflows.delete(id);
  }

  // update a workflow by ID
  async updateWorkflow(id: string, changes: Partial<IcarusWorkflowRecord>) {
    return await this.db.workflows.update(id, changes);
  }

  // Update workflowIds linked to a session
  async updateSessionWorkflows(
    {
      sessionId,
      workflowIds,
      matrixIds,
      activityIds,
      visualizationIds
    }: {
      sessionId: string,
      workflowIds?: string[],
      matrixIds?: string[],
      activityIds?: string[],
      visualizationIds?: string[]
    }
  ) {
    const session = await this.db.sessions.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);

    if (workflowIds) {
      session.workflowIds = Array.from(
        new Set([...(session.workflowIds ?? []), ...workflowIds])
      );
    }

    if (activityIds) {
      session.activityIds = Array.from(
        new Set([...(session.activityIds ?? []), ...activityIds])
      );
    }

    if (matrixIds) {
      session.matrixIds = Array.from(
        new Set([...(session.matrixIds ?? []), ...matrixIds])
      );
    }

    if (visualizationIds) {
      session.visualizationIds = Array.from(
        new Set([...(session.visualizationIds ?? []), ...visualizationIds])
      );
    }

    return await this.db.sessions.put(session);
  }


  // delete sessions with workflows
  async deleteSessionWithWorkflows(sessionId: string) {
    return this.deleteSessionWithAllData(sessionId);
  }


  async deleteSessionWithAllData(sessionId: string) {
    return this.db.transaction(
      "rw",
      [
        this.db.sessions,
        this.db.workflows,
        this.db.activities,
        this.db.matrices,
        this.db.visualizations,
      ],
      async () => {
        const session = await this.db.sessions.get(sessionId);
        if (!session) return;

        // Normalize helper (make sure IDs are strings for Dexie PKs)
        const normalizeIds = (ids?: (string | number)[]) =>
          (ids || []).map((id) => String(id));

        const workflowIds = normalizeIds(session.workflowIds);
        const activityIds = normalizeIds(session.activityIds);
        const matrixIds = normalizeIds(session.matrixIds);
        const visualizationIds = normalizeIds(session.visualizationIds);

        // Bulk delete related records if any
        if (workflowIds.length) {
          await this.db.workflows.bulkDelete(workflowIds);
        }
        if (activityIds.length) {
          await this.db.activities.bulkDelete(activityIds);
        }
        if (matrixIds.length) {
          await this.db.matrices.bulkDelete(matrixIds);
        }
        if (visualizationIds.length) {
          await this.db.visualizations.bulkDelete(visualizationIds);
        }

        // Finally delete the session itself
        await this.db.sessions.delete(sessionId);
      }
    );
  }


  // get matrixes
  async saveMatrix(matrix: IcarusMatrixRecord) {
    return await this.db.matrices.put(matrix);
  }

  // Get matrix by ID
  async getMatrixById(id: string): Promise<IcarusMatrixRecord | undefined> {
    return await this.db.matrices.get(id);
  }

  // Get all matrices
  async getAllMatrices(): Promise<IcarusMatrixRecord[]> {
    return await this.db.matrices.toArray();
  }

  // Get matrices by array of IDs
  async getMatricesByIds(ids: string[]): Promise<IcarusMatrixRecord[]> {
    return await this.db.matrices.where("id").anyOf(ids).toArray();
  }

  // get activities
  async saveActivity(activity: IcarusActivityRecord) {
    return await this.db.activities.put(activity);
  }

  // Get activity by ID
  async getActivityById(id: string): Promise<IcarusActivityRecord | undefined> {
    return await this.db.activities.get(id);
  }

  // Get all activities
  async getAllActivities(): Promise<IcarusActivityRecord[]> {
    return await this.db.activities.toArray();
  }

  // Get activities by array of IDs
  async getActivitiesByIds(ids: string[]): Promise<IcarusActivityRecord[]> {
    return await this.db.activities.where("id").anyOf(ids).toArray();
  }

  // get visualizations
  async saveVisualization(visualization: IcarusVisualizationRecord) {
    return await this.db.visualizations.put(visualization);
  }

  // Get visualization by ID
  async getVisualizationById(
    id: string
  ): Promise<IcarusVisualizationRecord | undefined> {
    return await this.db.visualizations.get(id);
  }

  // Get all visualizations
  async getAllVisualization(): Promise<IcarusVisualizationRecord[]> {
    return await this.db.visualizations.toArray();
  }

  // Get visualizations by array of IDs
  async getVisualizationsByIds(
    ids: string[]
  ): Promise<IcarusVisualizationRecord[]> {
    return await this.db.visualizations.where("id").anyOf(ids).toArray();
  }

  private async getDeletionSnapshot(
    sessionId: string
  ): Promise<IcarusSessionWithWorkflowRecord> {
    const session = await this.getSessionWithAllData(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    return session;
  }

  async getMatrixDeletionPlan(sessionId: string, matrixId: string) {
    return planMatrixDeletion(
      await this.getDeletionSnapshot(sessionId),
      matrixId
    );
  }

  async getActivityDeletionPlan(sessionId: string, activityId: string) {
    return planActivityDeletion(
      await this.getDeletionSnapshot(sessionId),
      activityId
    );
  }

  async getVisualizationDeletionPlan(
    sessionId: string,
    visualizationId: string
  ) {
    return planVisualizationDeletion(
      await this.getDeletionSnapshot(sessionId),
      visualizationId
    );
  }

  private async executeSessionDeletion(
    sessionId: string,
    createPlan: (session: IcarusSessionWithWorkflowRecord) => DeletionPlan,
    confirmedPlan?: DeletionPlan
  ): Promise<SessionDeletionResult> {
    let committedPlan: DeletionPlan | null = null;

    await this.db.transaction(
      "rw",
      [
        this.db.sessions,
        this.db.workflows,
        this.db.activities,
        this.db.matrices,
        this.db.visualizations,
      ],
      async () => {
        // Rebuild the plan inside the write transaction. A preview shown by the UI
        // can become stale, but the committed operation must always use fresh data.
        const snapshot = await this.getDeletionSnapshot(sessionId);
        const plan = createPlan(snapshot);
        assertDeletionPlanIntegrity(snapshot, plan);
        if (confirmedPlan && !hasSameDeletionScope(plan, confirmedPlan)) {
          throw new Error(
            "Dependencies changed after this warning was opened. No data was deleted; review the updated impact and try again."
          );
        }

        const deletedMatrixIds = new Set(plan.matrixIds);
        const deletedActivityIds = new Set(plan.activityIds);
        const deletedVisualizationIds = new Set(plan.visualizationIds);
        const updatedSession: IcarusSessionRecord = {
          id: snapshot.id,
          name: snapshot.name,
          date: snapshot.date,
          workflowIds: snapshot.workflowIds,
          matrixIds: snapshot.matrixIds.filter(
            (id) => !deletedMatrixIds.has(id)
          ),
          activityIds: snapshot.activityIds.filter(
            (id) => !deletedActivityIds.has(id)
          ),
          visualizationIds: snapshot.visualizationIds.filter(
            (id) => !deletedVisualizationIds.has(id)
          ),
        };

        // Shared records are detached from this session but retained for the
        // other session. IDs are normally unique, and this protects legacy data.
        const physicalScope = getPhysicalDeletionScope({
          plan,
          sessionId,
          sessions: await this.db.sessions.toArray(),
          activities: await this.db.activities.toArray(),
          visualizations: await this.db.visualizations.toArray(),
        });

        await this.db.sessions.put(updatedSession);
        if (physicalScope.visualizationIds.length) {
          await this.db.visualizations.bulkDelete(
            physicalScope.visualizationIds
          );
        }
        if (physicalScope.activityIds.length) {
          await this.db.activities.bulkDelete(physicalScope.activityIds);
        }
        if (physicalScope.matrixIds.length) {
          await this.db.matrices.bulkDelete(physicalScope.matrixIds);
        }

        committedPlan = plan;
      }
    );

    if (!committedPlan) {
      throw new Error("Deletion transaction did not produce a plan");
    }

    const session = await this.getDeletionSnapshot(sessionId);
    return { plan: committedPlan, session };
  }

  async deleteMatrixFromSession(
    sessionId: string,
    matrixId: string,
    confirmedPlan?: DeletionPlan
  ): Promise<SessionDeletionResult> {
    return this.executeSessionDeletion(
      sessionId,
      (session) => planMatrixDeletion(session, matrixId),
      confirmedPlan
    );
  }

  async deleteActivityFromSession(
    sessionId: string,
    activityId: string,
    confirmedPlan?: DeletionPlan
  ): Promise<SessionDeletionResult> {
    return this.executeSessionDeletion(
      sessionId,
      (session) => planActivityDeletion(session, activityId),
      confirmedPlan
    );
  }

  async deleteVisualizationFromSession(
    sessionId: string,
    visualizationId: string,
    confirmedPlan?: DeletionPlan
  ): Promise<SessionDeletionResult> {
    return this.executeSessionDeletion(
      sessionId,
      (session) => planVisualizationDeletion(session, visualizationId),
      confirmedPlan
    );
  }

  // fetch all data at once
  async getSessionWithAllData(
    id: string
  ): Promise<IcarusSessionWithWorkflowRecord | null> {
    const session = await this.getSessionById(id);
    if (!session) return null;

    const [workflows, activities, matrices, visualizations] = await Promise.all(
      [
        this.getWorkflowsByIds(session.workflowIds || []),
        this.getActivitiesByIds(session.activityIds || []),
        this.getMatricesByIds(session.matrixIds || []),
        this.getVisualizationsByIds(session.visualizationIds || []),
      ]
    );

    return {
      ...session,
      workflows,
      activities,
      matrices,
      visualizations,
    };
  }
}

export const IcarusDBAdapter = new DBAdapter();
