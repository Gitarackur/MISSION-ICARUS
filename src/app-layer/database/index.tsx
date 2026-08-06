import Dexie, { Table } from 'dexie';
import type { IcarusSession } from "@/domain/session";
import type { IcarusActivity, IcarusMatrix, IcarusVisualization, IcarusWorkflowRecord } from "@/domain/workflow/main.types";



const VERSION_NUMBER = 1;



export class IcarusDB extends Dexie {
  workflows!: Table<IcarusWorkflowRecord, string>;
  sessions!: Table<IcarusSession, string>;
  matrices!: Table<IcarusMatrix, string>;
  activities!: Table<IcarusActivity, string>;
  visualizations!: Table<IcarusVisualization, string>

  constructor() {
    super("IcarusDatabase");
    this.version(VERSION_NUMBER).stores({
      workflows: 'id,createdAt',
      sessions: 'id,name,date',
      matrices: 'id,name,date',
      activities: 'id,name,date',
      visualizations: 'id,name,date'
    });
  }
}


export const db = new IcarusDB();
