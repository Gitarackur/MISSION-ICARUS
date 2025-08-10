import { v4 as uuidv4 } from 'uuid';
import IcarusWorkflow from "../algorithms/workflow";
import { IntIcarusSession } from './session.types';

class IcarusSession {
    id: string | null = null;
    name: string | null = null;
    date: Date | string | null = null;
    workflow: IcarusWorkflow | null = null;

    constructor() { }

    generateSession(data: { workflow: IcarusWorkflow }): IntIcarusSession {
        const session: IntIcarusSession = {
            // id: crypto.randomUUID(),
            id: uuidv4(),
            name: `icarus-session-${crypto.randomUUID()}`,
            date: new Date().toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }),
            workflow: data.workflow,
        };

        this.mapSession(session);
        return session;
    }

    mapSession({ id, name, date, workflow }: IntIcarusSession) {
        this.id = id;
        this.name = name;
        this.date = date;
        this.workflow = workflow
    }
}


export default IcarusSession;