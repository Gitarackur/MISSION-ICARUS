import db from '.';

import type { Session, Workflow, SessionWithWorkflows } from './db.types';

export class IcarusDBAdapter {
    saveSession(session: Session): void {
        const workflowIds = JSON.stringify(session.workflowIds || []);
        db.prepare(
            `
      INSERT OR REPLACE INTO sessions (id, name, date, workflowIds)
      VALUES (@id, @name, @date, @workflowIds)
    `
        ).run({
            ...session,
            workflowIds
        });
    }

    getSession(id: string): Session | null {
        const row = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as
            | (Omit<Session, 'workflowIds'> & { workflowIds: string })
            | undefined;

        if (!row) return null;
        return { ...row, workflowIds: JSON.parse(row.workflowIds) };
    }

    deleteSession(id: string): void {
        const session = this.getSession(id);
        if (session?.workflowIds?.length) {
            for (const wid of session.workflowIds) {
                this.deleteWorkflow(wid);
            }
        }
        db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
    }

    saveWorkflow(workflow: Workflow): void {
        const serialized = Buffer.from(JSON.stringify(workflow.data), 'utf-8');
        db.prepare(
            `
      INSERT OR REPLACE INTO workflows (id, createdAt, data)
      VALUES (@id, @createdAt, @data)
    `
        ).run({
            id: workflow.id,
            createdAt: workflow.createdAt,
            data: serialized
        });
    }

    getWorkflow(id: string): Workflow | null {
        const row = db.prepare(`SELECT * FROM workflows WHERE id = ?`).get(id) as
            | { id: string; createdAt: number; data: Buffer }
            | undefined;

        if (!row) return null;
        return {
            id: row.id,
            createdAt: row.createdAt,
            data: JSON.parse(row.data.toString('utf-8'))
        };
    }

    deleteWorkflow(id: string): void {
        db.prepare(`DELETE FROM workflows WHERE id = ?`).run(id);
    }

    getSessionWithWorkflows(id: string): SessionWithWorkflows | null {
        const session = this.getSession(id);
        if (!session) return null;
        const workflows: Workflow[] = session.workflowIds
            .map((wid) => this.getWorkflow(wid))
            .filter((wf): wf is Workflow => !!wf);
        return { ...session, workflows };
    }

    getAllSessions(): Session[] {
        const rows = db.prepare(`SELECT * FROM sessions`).all() as Array<
            Omit<Session, 'workflowIds'> & { workflowIds: string }
        >;

        return rows.map((s) => ({
            ...s,
            workflowIds: JSON.parse(s.workflowIds)
        }));
    }
}

export const IcarusDB = new IcarusDBAdapter();
