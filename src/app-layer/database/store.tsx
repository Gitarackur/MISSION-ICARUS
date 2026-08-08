import { db, IcarusDB } from ".";
import type { IcarusSession, IcarusSessionWithWorkflow } from "@/domain/session";
import type {
  IcarusActivity,
  IcarusMatrix,
  IcarusVisualization,
  IcarusWorkflowRecord,
} from "@/domain/workflow/main.types";

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
import { matrixCodec } from "./matrix-codec";
import {
  isChunkedMatrixRecord,
  toLoadedLegacyMatrix,
  toMatrixMetadataPlaceholder,
} from "./matrix-storage";
import type {
  EncodedMatrix,
  InitialSessionGraph,
  PersistedMatrixRecord,
  SessionLoadOptions,
  StatisticalResultGraph,
  VisualizationResultGraph,
} from "@/domain/storage/index.types";
import {
  announceStorageChange,
  asStorageWriteError,
} from "./storage-health";

const orderedRecords = <T extends { id: string }>(ids: string[], rows: T[]) => {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });
};

const mergeIds = (current: string[] | undefined, added: string[] | undefined) =>
  added ? Array.from(new Set([...(current ?? []), ...added])) : current ?? [];

class DBAdapter {
  db: IcarusDB = db;
  private legacyOptimizationQueue: IcarusMatrix[] = [];
  private queuedLegacyMatrixIds = new Set<string>();
  private isOptimizingLegacyMatrices = false;

  constructor() {
    this.db = db;
  }

  async saveSession(session: IcarusSession) {
    try {
      const result = await this.db.sessions.put(session);
      announceStorageChange();
      return result;
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async getSessionById(id: string): Promise<IcarusSession | undefined> {
    return this.db.sessions.get(id);
  }

  async getAllSessions(): Promise<IcarusSession[]> {
    return this.db.sessions.toArray();
  }

  async deleteSession(id: string) {
    const result = await this.db.sessions.delete(id);
    announceStorageChange();
    return result;
  }

  async saveWorkflow(workflow: IcarusWorkflowRecord) {
    try {
      const result = await this.db.workflows.put(workflow);
      announceStorageChange();
      return result;
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async getWorkflowById(id: string): Promise<IcarusWorkflowRecord | undefined> {
    return this.db.workflows.get(id);
  }

  async getWorkflowsByIds(ids: string[]): Promise<IcarusWorkflowRecord[]> {
    if (!ids.length) return [];
    const rows = await this.db.workflows.where("id").anyOf(ids).toArray();
    return orderedRecords(ids, rows);
  }

  async deleteWorkflow(id: string) {
    const result = await this.db.workflows.delete(id);
    announceStorageChange();
    return result;
  }

  async updateWorkflow(id: string, changes: Partial<IcarusWorkflowRecord>) {
    try {
      const result = await this.db.workflows.update(id, changes);
      announceStorageChange();
      return result;
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async updateSessionWorkflows({
    sessionId,
    workflowIds,
    matrixIds,
    activityIds,
    visualizationIds,
  }: {
    sessionId: string;
    workflowIds?: string[];
    matrixIds?: string[];
    activityIds?: string[];
    visualizationIds?: string[];
  }) {
    try {
      const result = await this.db.transaction(
        "rw",
        this.db.sessions,
        async () => {
          const session = await this.db.sessions.get(sessionId);
          if (!session) throw new Error(`Session with id ${sessionId} not found`);

          return this.db.sessions.put({
            ...session,
            workflowIds: mergeIds(session.workflowIds, workflowIds),
            matrixIds: mergeIds(session.matrixIds, matrixIds),
            activityIds: mergeIds(session.activityIds, activityIds),
            visualizationIds: mergeIds(
              session.visualizationIds,
              visualizationIds
            ),
          });
        }
      );
      announceStorageChange();
      return result;
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async saveInitialSessionGraph({
    session,
    matrix,
    activity,
    workflow,
  }: InitialSessionGraph) {
    const encoded = await matrixCodec.encode(matrix);

    try {
      await this.db.transaction(
        "rw",
        [
          this.db.sessions,
          this.db.workflows,
          this.db.activities,
          this.db.matrices,
          this.db.matrixChunks,
        ],
        async () => {
          await this.putEncodedMatrix(encoded);
          await this.db.activities.put(activity);
          await this.db.workflows.put(workflow);
          await this.db.sessions.put(session);
        }
      );
      announceStorageChange();
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async saveStatisticalResultGraph({
    sessionId,
    matrix,
    activity,
  }: StatisticalResultGraph) {
    const encoded = await matrixCodec.encode(matrix);

    try {
      await this.db.transaction(
        "rw",
        [
          this.db.sessions,
          this.db.activities,
          this.db.matrices,
          this.db.matrixChunks,
        ],
        async () => {
          const session = await this.db.sessions.get(sessionId);
          if (!session) throw new Error(`Session with id ${sessionId} not found`);

          await this.putEncodedMatrix(encoded);
          await this.db.activities.put(activity);
          await this.db.sessions.put({
            ...session,
            matrixIds: mergeIds(session.matrixIds, [matrix.id]),
            activityIds: mergeIds(session.activityIds, [activity.id]),
          });
        }
      );
      announceStorageChange();
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async saveMatrixForSession(sessionId: string, matrix: IcarusMatrix) {
    const encoded = await matrixCodec.encode(matrix);

    try {
      await this.db.transaction(
        "rw",
        [this.db.sessions, this.db.matrices, this.db.matrixChunks],
        async () => {
          const session = await this.db.sessions.get(sessionId);
          if (!session) throw new Error(`Session with id ${sessionId} not found`);
          await this.putEncodedMatrix(encoded);
          await this.db.sessions.put({
            ...session,
            matrixIds: mergeIds(session.matrixIds, [matrix.id]),
          });
        }
      );
      announceStorageChange();
      return matrix.id;
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async saveActivityForSession(sessionId: string, activity: IcarusActivity) {
    try {
      await this.db.transaction(
        "rw",
        [this.db.sessions, this.db.activities],
        async () => {
          const session = await this.db.sessions.get(sessionId);
          if (!session) throw new Error(`Session with id ${sessionId} not found`);
          await this.db.activities.put(activity);
          await this.db.sessions.put({
            ...session,
            activityIds: mergeIds(session.activityIds, [activity.id]),
          });
        }
      );
      announceStorageChange();
      return activity.id;
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async saveVisualizationResultGraph({
    sessionId,
    activity,
    visualization,
  }: VisualizationResultGraph) {
    try {
      await this.db.transaction(
        "rw",
        [this.db.sessions, this.db.activities, this.db.visualizations],
        async () => {
          const session = await this.db.sessions.get(sessionId);
          if (!session) throw new Error(`Session with id ${sessionId} not found`);

          await this.db.activities.put(activity);
          await this.db.visualizations.put(visualization);
          await this.db.sessions.put({
            ...session,
            activityIds: mergeIds(session.activityIds, [activity.id]),
            visualizationIds: mergeIds(session.visualizationIds, [
              visualization.id,
            ]),
          });
        }
      );
      announceStorageChange();
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async deleteSessionWithWorkflows(sessionId: string) {
    return this.deleteSessionWithAllData(sessionId);
  }

  async deleteSessionWithAllData(sessionId: string) {
    const result = await this.db.transaction(
      "rw",
      [
        this.db.sessions,
        this.db.workflows,
        this.db.activities,
        this.db.matrices,
        this.db.matrixChunks,
        this.db.visualizations,
      ],
      async () => {
        const session = await this.db.sessions.get(sessionId);
        if (!session) return;

        const normalizeIds = (ids?: (string | number)[]) =>
          (ids || []).map((id) => String(id));
        const workflowIds = normalizeIds(session.workflowIds);
        const activityIds = normalizeIds(session.activityIds);
        const matrixIds = normalizeIds(session.matrixIds);
        const visualizationIds = normalizeIds(session.visualizationIds);

        if (workflowIds.length) await this.db.workflows.bulkDelete(workflowIds);
        if (activityIds.length) await this.db.activities.bulkDelete(activityIds);
        if (matrixIds.length) {
          await this.deleteMatrixChunks(matrixIds);
          await this.db.matrices.bulkDelete(matrixIds);
        }
        if (visualizationIds.length) {
          await this.db.visualizations.bulkDelete(visualizationIds);
        }
        await this.db.sessions.delete(sessionId);
      }
    );
    announceStorageChange();
    return result;
  }

  async saveMatrix(matrix: IcarusMatrix) {
    const encoded = await matrixCodec.encode(matrix);

    try {
      await this.db.transaction(
        "rw",
        [this.db.matrices, this.db.matrixChunks],
        () => this.putEncodedMatrix(encoded)
      );
      announceStorageChange();
      return matrix.id;
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async getMatrixById(id: string): Promise<IcarusMatrix | undefined> {
    const record = await this.db.matrices.get(id);
    if (!record) return undefined;

    if (!isChunkedMatrixRecord(record)) {
      const matrix = toLoadedLegacyMatrix(record);
      this.queueLegacyOptimization(matrix);
      return matrix;
    }

    const chunks = await this.db.matrixChunks
      .where("matrixId")
      .equals(id)
      .sortBy("chunkIndex");
    return matrixCodec.decode(record, chunks);
  }

  async getMatrixMetadataById(id: string): Promise<IcarusMatrix | undefined> {
    const record = await this.db.matrices.get(id);
    return record ? toMatrixMetadataPlaceholder(record) : undefined;
  }

  async getAllMatrices(): Promise<IcarusMatrix[]> {
    const records = await this.db.matrices.toArray();
    const matrices = await Promise.all(
      records.map((record) => this.getMatrixById(record.id))
    );
    return matrices.filter((matrix): matrix is IcarusMatrix => !!matrix);
  }

  async getMatricesByIds(ids: string[]): Promise<IcarusMatrix[]> {
    const matrices = await Promise.all(ids.map((id) => this.getMatrixById(id)));
    return matrices.filter((matrix): matrix is IcarusMatrix => !!matrix);
  }

  async getMatrixMetadataByIds(ids: string[]): Promise<IcarusMatrix[]> {
    if (!ids.length) return [];
    const records = await this.db.matrices.where("id").anyOf(ids).toArray();
    return orderedRecords(ids, records).map(toMatrixMetadataPlaceholder);
  }

  async saveActivity(activity: IcarusActivity) {
    try {
      const result = await this.db.activities.put(activity);
      announceStorageChange();
      return result;
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async getActivityById(id: string): Promise<IcarusActivity | undefined> {
    return this.db.activities.get(id);
  }

  async getAllActivities(): Promise<IcarusActivity[]> {
    return this.db.activities.toArray();
  }

  async getActivitiesByIds(ids: string[]): Promise<IcarusActivity[]> {
    if (!ids.length) return [];
    const rows = await this.db.activities.where("id").anyOf(ids).toArray();
    return orderedRecords(ids, rows);
  }

  async saveVisualization(visualization: IcarusVisualization) {
    try {
      const result = await this.db.visualizations.put(visualization);
      announceStorageChange();
      return result;
    } catch (error) {
      throw asStorageWriteError(error);
    }
  }

  async getVisualizationById(
    id: string
  ): Promise<IcarusVisualization | undefined> {
    return this.db.visualizations.get(id);
  }

  async getAllVisualization(): Promise<IcarusVisualization[]> {
    return this.db.visualizations.toArray();
  }

  async getVisualizationsByIds(
    ids: string[]
  ): Promise<IcarusVisualization[]> {
    if (!ids.length) return [];
    const rows = await this.db.visualizations.where("id").anyOf(ids).toArray();
    return orderedRecords(ids, rows);
  }

  private async getDeletionSnapshot(
    sessionId: string
  ): Promise<IcarusSessionWithWorkflow> {
    const session = await this.getSessionWithAllData(sessionId, {
      matrixPayloads: "none",
    });
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    return session;
  }

  async getMatrixDeletionPlan(sessionId: string, matrixId: string) {
    return planMatrixDeletion(await this.getDeletionSnapshot(sessionId), matrixId);
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
    createPlan: (session: IcarusSessionWithWorkflow) => DeletionPlan,
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
        this.db.matrixChunks,
        this.db.visualizations,
      ],
      async () => {
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
        const updatedSession: IcarusSession = {
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
          await this.deleteMatrixChunks(physicalScope.matrixIds);
          await this.db.matrices.bulkDelete(physicalScope.matrixIds);
        }

        committedPlan = plan;
      }
    );

    if (!committedPlan) {
      throw new Error("Deletion transaction did not produce a plan");
    }

    announceStorageChange();
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

  async getSessionWithAllData(
    id: string,
    options: SessionLoadOptions = {}
  ): Promise<IcarusSessionWithWorkflow | null> {
    const session = await this.getSessionById(id);
    if (!session) return null;

    const requestedMatrixIds = options.matrixIds ?? [];
    const loadAllMatrices =
      options.matrixPayloads !== "none" && options.matrixIds === undefined;
    const [workflows, activities, matrixMetadata, visualizations] =
      await Promise.all([
        this.getWorkflowsByIds(session.workflowIds || []),
        this.getActivitiesByIds(session.activityIds || []),
        this.getMatrixMetadataByIds(session.matrixIds || []),
        this.getVisualizationsByIds(session.visualizationIds || []),
      ]);

    let matrices = matrixMetadata;
    if (loadAllMatrices) {
      matrices = await this.getMatricesByIds(session.matrixIds || []);
    } else if (requestedMatrixIds.length) {
      const hydrated = await this.getMatricesByIds(
        requestedMatrixIds.filter((matrixId) =>
          session.matrixIds.includes(matrixId)
        )
      );
      const hydratedById = new Map(hydrated.map((matrix) => [matrix.id, matrix]));
      matrices = matrixMetadata.map(
        (matrix) => hydratedById.get(matrix.id) ?? matrix
      );
    }

    return {
      ...session,
      workflows,
      activities,
      matrices,
      visualizations,
    };
  }

  private async putEncodedMatrix(encoded: EncodedMatrix) {
    await this.deleteMatrixChunks([encoded.metadata.id]);
    if (encoded.chunks.length) {
      await this.db.matrixChunks.bulkPut(encoded.chunks);
    }
    await this.db.matrices.put(encoded.metadata);
  }

  private async deleteMatrixChunks(matrixIds: string[]) {
    if (!matrixIds.length) return;
    await this.db.matrixChunks.where("matrixId").anyOf(matrixIds).delete();
  }

  private queueLegacyOptimization(matrix: IcarusMatrix) {
    if (this.queuedLegacyMatrixIds.has(matrix.id)) return;
    this.queuedLegacyMatrixIds.add(matrix.id);
    this.legacyOptimizationQueue.push(matrix);
    void this.runLegacyOptimizationQueue();
  }

  private async runLegacyOptimizationQueue() {
    if (this.isOptimizingLegacyMatrices) return;
    this.isOptimizingLegacyMatrices = true;

    try {
      let matrix = this.legacyOptimizationQueue.shift();
      while (matrix) {
        try {
          const encoded = await matrixCodec.encode(matrix);
          await this.db.transaction(
            "rw",
            [this.db.matrices, this.db.matrixChunks],
            async () => {
              const current = (await this.db.matrices.get(
                matrix!.id
              )) as PersistedMatrixRecord | undefined;
              if (!current || isChunkedMatrixRecord(current)) return;
              await this.putEncodedMatrix(encoded);
            }
          );
          announceStorageChange();
        } catch (error) {
          // Legacy data remains untouched because metadata replacement and chunk
          // creation share one transaction.
          console.warn(`Unable to optimize legacy matrix ${matrix.id}`, error);
        } finally {
          this.queuedLegacyMatrixIds.delete(matrix.id);
        }
        matrix = this.legacyOptimizationQueue.shift();
      }
    } finally {
      this.isOptimizingLegacyMatrices = false;
    }
  }
}

export const IcarusDBAdapter = new DBAdapter();
