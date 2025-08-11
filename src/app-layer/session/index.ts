import { v4 as uuidv4 } from 'uuid';
import IcarusWorkflow from "../algorithms/workflow";

class IcarusSession {
    id: string
    name: string;
    date: Date | string;
    workflow: IcarusWorkflow | null = null;

    constructor() {
        this.id = uuidv4();
        // this.id= crypto.randomUUID();
        this.name = `icarus-session-${crypto.randomUUID()}`;
        this.date = new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    addWorkflow(workflow: IcarusWorkflow) {
        this.workflow = workflow
        return this.getSessionValues();
    }

    changeSessionName(name: string) {
        this.name = name;
    }

    getSessionValues() {
        return {
            id: this.id,
            name: this.name,
            date: this.date,
            workflow: this.workflow
        }
    }
}


export default IcarusSession;