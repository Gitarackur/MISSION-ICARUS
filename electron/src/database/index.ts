import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

// Path: ~/Library/Application Support/<AppName>/icarus.db
const dbPath = path.join(app.getPath('userData'), 'icarus.db');
const db = new Database(dbPath);

db.prepare(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    workflowIds TEXT DEFAULT '[]', -- JSON array of workflow IDs
    activityIds TEXT DEFAULT '[]', -- JSON array of activity IDs
    matrixIds TEXT DEFAULT '[]', -- JSON array of matrix IDs
    visualizationIds TEXT DEFAULT '[]' -- JSON array of visualization IDs
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    createdAt INTEGER NOT NULL,
    data BLOB NOT NULL -- store serialized workflow
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS matrices (
    id TEXT PRIMARY KEY,
    createdAt INTEGER NOT NULL,
    columns TEXT NOT NULL, -- JSON array of column names
    data TEXT NOT NULL, -- JSON array of matrix data
    createdByFirstActivity BOOLEAN DEFAULT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    timestamp TEXT NOT NULL, -- string or number timestamp
    pluginId TEXT DEFAULT NULL,
    sourceMatrixId TEXT DEFAULT NULL,
    inputColumnNames TEXT DEFAULT NULL, -- JSON array
    outputColumnNames TEXT DEFAULT NULL, -- JSON array
    inputParameters TEXT DEFAULT NULL, -- JSON object
    outputMetrics TEXT DEFAULT NULL, -- JSON object
    inputMatrixReferences TEXT DEFAULT NULL,
    outputMatrixReference TEXT DEFAULT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS visualizations (
    id TEXT PRIMARY KEY,
    createdByActivityId TEXT DEFAULT NULL,
    createdAt INTEGER DEFAULT NULL,
    data TEXT NOT NULL -- JSON data
  )
`).run();


db.prepare(`CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_workflows_createdAt ON workflows(createdAt)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_matrices_createdAt ON matrices(createdAt)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_activities_sourceMatrixId ON activities(sourceMatrixId)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_visualizations_createdByActivityId ON visualizations(createdByActivityId)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_visualizations_createdAt ON visualizations(createdAt)`).run();

export default db;