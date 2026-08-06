import type { Database as DatabaseType } from "better-sqlite3";
import type { IcarusSession, IcarusSessionWithWorkflow } from "@/domain/session";
import type { IcarusWorkflowRecord, IcarusMatrix, IcarusActivity, IcarusVisualization } from "@/domain/workflow/main.types";

import {
  assertDeletionPlanIntegrity,
  getPhysicalDeletionScope,
  hasSameDeletionScope,
  planActivityDeletion,
  planMatrixDeletion,
  planVisualizationDeletion,
  type DeletionPlan,
  type SessionDeletionResult,
} from "@/app-layer/database/deletion";
import { ActivityRow, VisualizationRow } from "./db.types";



export class IcarusDBAdapter {
  db: DatabaseType;

  constructor(db: DatabaseType) {
    this.db = db;
  }

  // SESSION METHODS
  saveSession(session: IcarusSession): void {
    const workflowIds = JSON.stringify(session.workflowIds || []);
    const activityIds = JSON.stringify(session.activityIds || []);
    const matrixIds = JSON.stringify(session.matrixIds || []);
    const visualizationIds = JSON.stringify(session.visualizationIds || []);
    const date =
      typeof session.date === "string"
        ? session.date
        : session.date.toISOString();

    this.db
      .prepare(
        `
        INSERT OR REPLACE INTO sessions (id, name, date, workflowIds, activityIds, matrixIds, visualizationIds)
        VALUES (@id, @name, @date, @workflowIds, @activityIds, @matrixIds, @visualizationIds)
      `
      )
      .run({
        id: session.id,
        name: session.name,
        date,
        workflowIds,
        activityIds,
        matrixIds,
        visualizationIds,
      });
  }

  getSession(id: string): IcarusSession | null {
    const row = this.db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(id) as
      | (Omit<
          IcarusSession,
          | "workflowIds"
          | "activityIds"
          | "matrixIds"
          | "visualizationIds"
          | "date"
        > & {
          workflowIds: string;
          activityIds: string;
          matrixIds: string;
          visualizationIds: string;
          date: string;
        })
      | undefined;

    if (!row) return null;

    return {
      ...row,
      date: new Date(row.date),
      workflowIds: JSON.parse(row.workflowIds),
      activityIds: JSON.parse(row.activityIds),
      matrixIds: JSON.parse(row.matrixIds),
      visualizationIds: JSON.parse(row.visualizationIds),
    };
  }

  deleteSession(id: string): void {
    const session = this.getSession(id);
    if (session) {
      // Clean up related records
      if (session.workflowIds?.length) {
        for (const wid of session.workflowIds) {
          this.deleteWorkflow(wid);
        }
      }
      if (session.activityIds?.length) {
        for (const aid of session.activityIds) {
          this.deleteActivity(aid);
        }
      }
      if (session.matrixIds?.length) {
        for (const mid of session.matrixIds) {
          this.deleteMatrix(mid);
        }
      }
      if (session.visualizationIds?.length) {
        for (const vid of session.visualizationIds) {
          this.deleteVisualization(vid);
        }
      }
    }
    this.db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
  }

  getAllSessions(): IcarusSession[] {
    const rows = this.db.prepare(`SELECT * FROM sessions`).all() as Array<
      Omit<
        IcarusSession,
        | "workflowIds"
        | "activityIds"
        | "matrixIds"
        | "visualizationIds"
        | "date"
      > & {
        workflowIds: string;
        activityIds: string;
        matrixIds: string;
        visualizationIds: string;
        date: string;
      }
    >;

    return rows.map((s) => ({
      ...s,
      date: new Date(s.date),
      workflowIds: JSON.parse(s.workflowIds),
      activityIds: JSON.parse(s.activityIds),
      matrixIds: JSON.parse(s.matrixIds),
      visualizationIds: JSON.parse(s.visualizationIds),
    }));
  }

  getSessionWithWorkflows(id: string): IcarusSessionWithWorkflow | null {
    const session = this.getSession(id);
    if (!session) return null;

    const workflows: IcarusWorkflowRecord[] = session.workflowIds
      .map((wid) => this.getWorkflow(wid))
      .filter((wf): wf is IcarusWorkflowRecord => !!wf);

    const activities: IcarusActivity[] = session.activityIds
      .map((aid) => this.getActivity(aid))
      .filter((activity): activity is IcarusActivity => !!activity);

    const matrices: IcarusMatrix[] = session.matrixIds
      .map((mid) => this.getMatrix(mid))
      .filter((matrix): matrix is IcarusMatrix => !!matrix);

    const visualizations: IcarusVisualization[] = session.visualizationIds
      .map((vid) => this.getVisualization(vid))
      .filter((viz): viz is IcarusVisualization => !!viz);

    return {
      ...session,
      workflows,
      activities,
      matrices,
      visualizations,
    };
  }

  // WORKFLOW METHODS
  saveWorkflow(workflow: IcarusWorkflowRecord): void {
    const serialized = Buffer.from(JSON.stringify(workflow.data), "utf-8");
    this.db
      .prepare(
        `
        INSERT OR REPLACE INTO workflows (id, createdAt, data)
        VALUES (@id, @createdAt, @data)
      `
      )
      .run({
        id: workflow.id,
        createdAt: workflow.createdAt,
        data: serialized,
      });
  }

  getWorkflow(id: string): IcarusWorkflowRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM workflows WHERE id = ?`)
      .get(id) as { id: string; createdAt: number; data: Buffer } | undefined;

    if (!row) return null;
    return {
      id: row.id,
      createdAt: row.createdAt,
      data: JSON.parse(row.data.toString("utf-8")),
    };
  }

  deleteWorkflow(id: string): void {
    this.db.prepare(`DELETE FROM workflows WHERE id = ?`).run(id);
  }

  // MATRIX METHODS
  saveMatrix(matrix: IcarusMatrix): void {
    const columns = JSON.stringify(matrix.columns);
    const data = JSON.stringify(matrix.data);

    this.db
      .prepare(
        `
        INSERT OR REPLACE INTO matrices (id, createdAt, columns, data, createdByFirstActivity)
        VALUES (@id, @createdAt, @columns, @data, @createdByFirstActivity)
      `
      )
      .run({
        id: matrix.id,
        createdAt: matrix.createdAt,
        columns,
        data,
        createdByFirstActivity: matrix.createdByFirstActivity ? 1 : null,
      });
  }

  getMatrix(id: string): IcarusMatrix | null {
    const row = this.db
      .prepare(`SELECT * FROM matrices WHERE id = ?`)
      .get(id) as
      | {
          id: string;
          createdAt: number;
          columns: string;
          data: string;
          createdByFirstActivity: number | null;
        }
      | undefined;

    if (!row) return null;
    return {
      id: row.id,
      createdAt: row.createdAt,
      columns: JSON.parse(row.columns),
      data: JSON.parse(row.data),
      createdByFirstActivity:
        row.createdByFirstActivity === null
          ? undefined
          : Boolean(row.createdByFirstActivity),
    };
  }

  private deleteMatrix(id: string): void {
    this.db.prepare(`DELETE FROM matrices WHERE id = ?`).run(id);
  }

  // ACTIVITY METHODS
  saveActivity(activity: IcarusActivity): void {
    const inputColumnNames = activity.inputColumnNames
      ? JSON.stringify(activity.inputColumnNames)
      : null;
    const outputColumnNames = activity.outputColumnNames
      ? JSON.stringify(activity.outputColumnNames)
      : null;
    const inputParameters = activity.inputParameters
      ? JSON.stringify(activity.inputParameters)
      : null;
    const outputMetrics = activity.outputMetrics
      ? JSON.stringify(activity.outputMetrics)
      : null;

    this.db
      .prepare(
        `
        INSERT OR REPLACE INTO activities (
          id, name, timestamp, pluginId, sourceMatrixId, 
          inputColumnNames, outputColumnNames, inputParameters, 
          outputMetrics, inputMatrixReferences, outputMatrixReference
        )
        VALUES (
          @id, @name, @timestamp, @pluginId, @sourceMatrixId,
          @inputColumnNames, @outputColumnNames, @inputParameters,
          @outputMetrics, @inputMatrixReferences, @outputMatrixReference
        )
      `
      )
      .run({
        id: activity.id,
        name: activity.name,
        timestamp: activity.timestamp,
        pluginId: activity.pluginId || null,
        sourceMatrixId: activity.sourceMatrixId || null,
        inputColumnNames,
        outputColumnNames,
        inputParameters,
        outputMetrics,
        inputMatrixReferences: activity.inputMatrixReferences || null,
        outputMatrixReference: activity.outputMatrixReference || null,
      });
  }

  private deserializeActivity(row: ActivityRow): IcarusActivity {
    return {
      id: row.id,
      name: row.name,
      timestamp: row.timestamp,
      pluginId: row.pluginId || undefined,
      sourceMatrixId: row.sourceMatrixId || undefined,
      inputColumnNames: row.inputColumnNames
        ? JSON.parse(row.inputColumnNames)
        : undefined,
      outputColumnNames: row.outputColumnNames
        ? JSON.parse(row.outputColumnNames)
        : undefined,
      inputParameters: row.inputParameters
        ? JSON.parse(row.inputParameters)
        : undefined,
      outputMetrics: row.outputMetrics
        ? JSON.parse(row.outputMetrics)
        : undefined,
      inputMatrixReferences: row.inputMatrixReferences || undefined,
      outputMatrixReference: row.outputMatrixReference || undefined,
    };
  }

  getActivity(id: string): IcarusActivity | null {
    const row = this.db
      .prepare(`SELECT * FROM activities WHERE id = ?`)
      .get(id) as ActivityRow | undefined;

    return row ? this.deserializeActivity(row) : null;
  }

  private getAllActivities(): IcarusActivity[] {
    const rows = this.db
      .prepare(`SELECT * FROM activities`)
      .all() as ActivityRow[];
    return rows.map((row) => this.deserializeActivity(row));
  }

  private deleteActivity(id: string): void {
    this.db.prepare(`DELETE FROM activities WHERE id = ?`).run(id);
  }

  // VISUALIZATION METHODS
  saveVisualization(visualization: IcarusVisualization): void {
    const data = JSON.stringify(visualization.data);

    this.db
      .prepare(
        `
        INSERT OR REPLACE INTO visualizations (
          id, createdByActivityId, createdAt, sourceMatrixId, renderer,
          visualizationType, title, data
        )
        VALUES (
          @id, @createdByActivityId, @createdAt, @sourceMatrixId, @renderer,
          @visualizationType, @title, @data
        )
      `
      )
      .run({
        id: visualization.id,
        createdByActivityId: visualization.createdByActivityId,
        createdAt: visualization.createdAt || Date.now(),
        sourceMatrixId: visualization.sourceMatrixId || null,
        renderer: visualization.renderer || null,
        visualizationType: visualization.visualizationType || null,
        title: visualization.title || null,
        data,
      });
  }

  private deserializeVisualization(
    row: VisualizationRow
  ): IcarusVisualization {
    return {
      id: row.id,
      createdByActivityId: row.createdByActivityId,
      createdAt: row.createdAt,
      sourceMatrixId: row.sourceMatrixId || undefined,
      renderer: row.renderer || undefined,
      visualizationType: row.visualizationType || undefined,
      title: row.title || undefined,
      data: JSON.parse(row.data),
    };
  }

  getVisualization(id: string): IcarusVisualization | null {
    const row = this.db
      .prepare(`SELECT * FROM visualizations WHERE id = ?`)
      .get(id) as VisualizationRow | undefined;

    return row ? this.deserializeVisualization(row) : null;
  }

  private getAllVisualizations(): IcarusVisualization[] {
    const rows = this.db
      .prepare(`SELECT * FROM visualizations`)
      .all() as VisualizationRow[];
    return rows.map((row) => this.deserializeVisualization(row));
  }

  private deleteVisualization(id: string): void {
    this.db.prepare(`DELETE FROM visualizations WHERE id = ?`).run(id);
  }

  private getDeletionSnapshot(
    sessionId: string
  ): IcarusSessionWithWorkflow {
    const session = this.getSessionWithWorkflows(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    return session;
  }

  getMatrixDeletionPlan(sessionId: string, matrixId: string): DeletionPlan {
    return planMatrixDeletion(this.getDeletionSnapshot(sessionId), matrixId);
  }

  getActivityDeletionPlan(sessionId: string, activityId: string): DeletionPlan {
    return planActivityDeletion(
      this.getDeletionSnapshot(sessionId),
      activityId
    );
  }

  getVisualizationDeletionPlan(
    sessionId: string,
    visualizationId: string
  ): DeletionPlan {
    return planVisualizationDeletion(
      this.getDeletionSnapshot(sessionId),
      visualizationId
    );
  }

  private executeSessionDeletion(
    sessionId: string,
    createPlan: (session: IcarusSessionWithWorkflow) => DeletionPlan,
    confirmedPlan?: DeletionPlan
  ): SessionDeletionResult {
    const transaction = this.db.transaction(() => {
      const snapshot = this.getDeletionSnapshot(sessionId);
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
        sessions: this.getAllSessions(),
        activities: this.getAllActivities(),
        visualizations: this.getAllVisualizations(),
      });

      this.saveSession(updatedSession);
      physicalScope.visualizationIds.forEach((id) =>
        this.deleteVisualization(id)
      );
      physicalScope.activityIds.forEach((id) => this.deleteActivity(id));
      physicalScope.matrixIds.forEach((id) => this.deleteMatrix(id));

      return plan;
    });

    const plan = transaction();
    return { plan, session: this.getDeletionSnapshot(sessionId) };
  }

  deleteMatrixFromSession(
    sessionId: string,
    matrixId: string,
    confirmedPlan?: DeletionPlan
  ): SessionDeletionResult {
    return this.executeSessionDeletion(
      sessionId,
      (session) => planMatrixDeletion(session, matrixId),
      confirmedPlan
    );
  }

  deleteActivityFromSession(
    sessionId: string,
    activityId: string,
    confirmedPlan?: DeletionPlan
  ): SessionDeletionResult {
    return this.executeSessionDeletion(
      sessionId,
      (session) => planActivityDeletion(session, activityId),
      confirmedPlan
    );
  }

  deleteVisualizationFromSession(
    sessionId: string,
    visualizationId: string,
    confirmedPlan?: DeletionPlan
  ): SessionDeletionResult {
    return this.executeSessionDeletion(
      sessionId,
      (session) => planVisualizationDeletion(session, visualizationId),
      confirmedPlan
    );
  }
}
