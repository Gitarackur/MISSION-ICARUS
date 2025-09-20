// src/database/index.ts
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { setupMigrations } from './migrations';

// Path: ~/Library/Application Support/<AppName>/icarus.db
const dbPath = path.join(app.getPath('userData'), 'icarus.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Run migrations - this will create all tables and indexes
const migrationRunner = setupMigrations(db);
migrationRunner.runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

export default db;
export { migrationRunner };