import Dexie, { Table } from 'dexie';
import { IcarusSessionRecord, IcarusWorkflowRecord } from './database.types';


const VERSION_NUMBER = 1;



export class IcarusDB extends Dexie {
  workflows!: Table<IcarusWorkflowRecord, string>;
  sessions!: Table<IcarusSessionRecord, string>;

  constructor() {
    super("IcarusDatabase");
    this.version(VERSION_NUMBER).stores({
      workflows: 'id,createdAt',
      sessions: 'id,name,date'
    });
  }
}


export const db = new IcarusDB();
