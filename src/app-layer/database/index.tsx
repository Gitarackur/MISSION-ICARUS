import Dexie, { Table } from 'dexie';
import type { IcarusSession } from "@/domain/session";
import type { IcarusActivity, IcarusVisualization, IcarusWorkflowRecord } from "@/domain/workflow/main.types";
import type {
  PersistedMatrixChunk,
  PersistedMatrixRecord,
} from "@/domain/storage/index.types";



const VERSION_NUMBER = 2;



export class IcarusDB extends Dexie {
  workflows!: Table<IcarusWorkflowRecord, string>;
  sessions!: Table<IcarusSession, string>;
  matrices!: Table<PersistedMatrixRecord, string>;
  matrixChunks!: Table<PersistedMatrixChunk, [string, number]>;
  activities!: Table<IcarusActivity, string>;
  visualizations!: Table<IcarusVisualization, string>

  constructor() {
    super("IcarusDatabase");
    this.version(1).stores({
      workflows: 'id,createdAt',
      sessions: 'id,name,date',
      matrices: 'id,name,date',
      activities: 'id,name,date',
      visualizations: 'id,name,date'
    });

    // Existing v1 matrix objects remain valid. They are converted to the
    // chunked representation lazily after a successful read.
    this.version(VERSION_NUMBER).stores({
      workflows: "id,createdAt",
      sessions: "id,name,date",
      matrices: "id,createdAt,createdByFirstActivity,storageFormat",
      matrixChunks: "[matrixId+chunkIndex],matrixId,chunkIndex",
      activities:
        "id,name,timestamp,pluginId,sourceMatrixId,outputMatrixReference",
      visualizations:
        "id,createdAt,createdByActivityId,sourceMatrixId,renderer,visualizationType",
    });
  }
}


export const db = new IcarusDB();
