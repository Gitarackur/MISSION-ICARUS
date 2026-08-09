import { v4 as uuidv4 } from 'uuid';

class IcarusSession {
    id: string
    name: string;
    date: Date | string;

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

    changeSessionName(name: string) {
        this.name = name;
    }

    getSessionValues() {
        return {
            id: this.id,
            name: this.name,
            date: this.date
        }
    }
}


export default IcarusSession;
