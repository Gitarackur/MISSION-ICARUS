import Dexie, { Table } from 'dexie';
import { IcarusActivityRecord, IcarusMatrixRecord, IcarusSessionRecord, IcarusVisualizationRecord, IcarusWorkflowRecord } from './database.types';


const VERSION_NUMBER = 1;



export class IcarusDB extends Dexie {
  workflows!: Table<IcarusWorkflowRecord, string>;
  sessions!: Table<IcarusSessionRecord, string>;
  matrices!: Table<IcarusMatrixRecord, string>;
  activities!: Table<IcarusActivityRecord, string>;
  visualizations!: Table<IcarusVisualizationRecord, string>

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
