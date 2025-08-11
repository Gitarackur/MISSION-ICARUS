import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

// Path: ~/Library/Application Support/<AppName>/icarus.db
const dbPath = path.join(app.getPath('userData'), 'icarus.db');
const db = new Database(dbPath);

// Create tables if they don't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    date TEXT,
    workflowIds TEXT -- JSON array of workflow IDs
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    createdAt INTEGER,
    data BLOB -- store serialized workflow
  )
`).run();

export default db;
