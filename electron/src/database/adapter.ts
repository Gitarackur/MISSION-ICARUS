import { Database as DatabaseType } from "better-sqlite3";
import {
  IcarusSessionRecord,
  IcarusWorkflowRecord,
  IcarusSessionWithWorkflowRecord,
  IcarusMatrixRecord,
  IcarusActivityRecord,
  IcarusVisualizationRecord,
} from "@/app-layer/database/database.types";

export class IcarusDBAdapter {
  db: DatabaseType;

  constructor(db: DatabaseType) {
    this.db = db;
  }

  // SESSION METHODS
  saveSession(session: IcarusSessionRecord): void {
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

  getSession(id: string): IcarusSessionRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(id) as
      | (Omit<
          IcarusSessionRecord,
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

  getAllSessions(): IcarusSessionRecord[] {
    const rows = this.db.prepare(`SELECT * FROM sessions`).all() as Array<
      Omit<
        IcarusSessionRecord,
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

  getSessionWithWorkflows(id: string): IcarusSessionWithWorkflowRecord | null {
    const session = this.getSession(id);
    if (!session) return null;

    const workflows: IcarusWorkflowRecord[] = session.workflowIds
      .map((wid) => this.getWorkflow(wid))
      .filter((wf): wf is IcarusWorkflowRecord => !!wf);

    const activities: IcarusActivityRecord[] = session.activityIds
      .map((aid) => this.getActivity(aid))
      .filter((activity): activity is IcarusActivityRecord => !!activity);

    const matrices: IcarusMatrixRecord[] = session.matrixIds
      .map((mid) => this.getMatrix(mid))
      .filter((matrix): matrix is IcarusMatrixRecord => !!matrix);

    const visualizations: IcarusVisualizationRecord[] = session.visualizationIds
      .map((vid) => this.getVisualization(vid))
      .filter((viz): viz is IcarusVisualizationRecord => !!viz);

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
  saveMatrix(matrix: IcarusMatrixRecord): void {
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
        createdByFirstActivity: matrix.createdByFirstActivity || null,
      });
  }

  getMatrix(id: string): IcarusMatrixRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM matrices WHERE id = ?`)
      .get(id) as
      | {
          id: string;
          createdAt: number;
          columns: string;
          data: string;
          createdByFirstActivity?: boolean;
        }
      | undefined;

    if (!row) return null;
    return {
      id: row.id,
      createdAt: row.createdAt,
      columns: JSON.parse(row.columns),
      data: JSON.parse(row.data),
      createdByFirstActivity: row.createdByFirstActivity,
    };
  }

  deleteMatrix(id: string): void {
    this.db.prepare(`DELETE FROM matrices WHERE id = ?`).run(id);
  }

  // ACTIVITY METHODS
  saveActivity(activity: IcarusActivityRecord): void {
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

  getActivity(id: string): IcarusActivityRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM activities WHERE id = ?`)
      .get(id) as
      | {
          id: string;
          name: string;
          timestamp: string | number;
          pluginId?: string;
          sourceMatrixId?: string;
          inputColumnNames?: string;
          outputColumnNames?: string;
          inputParameters?: string;
          outputMetrics?: string;
          inputMatrixReferences?: string;
          outputMatrixReference?: string;
        }
      | undefined;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      timestamp: row.timestamp,
      pluginId: row.pluginId,
      sourceMatrixId: row.sourceMatrixId,
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
      inputMatrixReferences: row.inputMatrixReferences,
      outputMatrixReference: row.outputMatrixReference,
    };
  }

  deleteActivity(id: string): void {
    this.db.prepare(`DELETE FROM activities WHERE id = ?`).run(id);
  }

  // VISUALIZATION METHODS
  saveVisualization(visualization: IcarusVisualizationRecord): void {
    const data = JSON.stringify(visualization.data);

    this.db
      .prepare(
        `
        INSERT OR REPLACE INTO visualizations (id, createdByActivityId, createdAt, data)
        VALUES (@id, @createdByActivityId, @createdAt, @data)
      `
      )
      .run({
        id: visualization.id,
        createdByActivityId: visualization.createdByActivityId,
        createdAt: visualization.createdAt || Date.now(),
        data,
      });
  }

  getVisualization(id: string): IcarusVisualizationRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM visualizations WHERE id = ?`)
      .get(id) as
      | {
          id: string;
          createdByActivityId: string | null;
          createdAt: number;
          data: string;
        }
      | undefined;

    if (!row) return null;
    return {
      id: row.id,
      createdByActivityId: row.createdByActivityId,
      createdAt: row.createdAt,
      data: JSON.parse(row.data),
    };
  }

  deleteVisualization(id: string): void {
    this.db.prepare(`DELETE FROM visualizations WHERE id = ?`).run(id);
  }
}
