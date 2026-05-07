// 2. MIGRATION DEFINITIONS (src/database/migrations/index.ts)
import Database from 'better-sqlite3';
import { MigrationRunner } from './migration-runner';
import { IcarusActivityRecord } from '@/app-layer/database/database.types';

export function setupMigrations(db: Database.Database): MigrationRunner {
  const migrationRunner = new MigrationRunner(db);

  // Migration 001: Initial schema
  migrationRunner.addMigration({
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          date TEXT NOT NULL,
          workflowIds TEXT DEFAULT '[]'
        )
      `).run();

      db.prepare(`
        CREATE TABLE IF NOT EXISTS workflows (
          id TEXT PRIMARY KEY,
          createdAt INTEGER NOT NULL,
          data BLOB NOT NULL
        )
      `).run();
    },
    down: (db) => {
      db.prepare('DROP TABLE IF EXISTS workflows').run();
      db.prepare('DROP TABLE IF EXISTS sessions').run();
    }
  });

  // Migration 002: Add new columns to sessions
  migrationRunner.addMigration({
    version: 2,
    name: 'add_session_arrays',
    up: (db) => {
      // Add new columns with default values
      db.prepare(`ALTER TABLE sessions ADD COLUMN activityIds TEXT DEFAULT '[]'`).run();
      db.prepare(`ALTER TABLE sessions ADD COLUMN matrixIds TEXT DEFAULT '[]'`).run();
      db.prepare(`ALTER TABLE sessions ADD COLUMN visualizationIds TEXT DEFAULT '[]'`).run();
    },
    down: (db) => {
      // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
      db.prepare(`CREATE TABLE sessions_backup AS SELECT id, name, date, workflowIds FROM sessions`).run();
      db.prepare(`DROP TABLE sessions`).run();
      db.prepare(`ALTER TABLE sessions_backup RENAME TO sessions`).run();
    }
  });

  // Migration 003: Create matrices table
  migrationRunner.addMigration({
    version: 3,
    name: 'create_matrices_table',
    up: (db) => {
      db.prepare(`
        CREATE TABLE matrices (
          id TEXT PRIMARY KEY,
          createdAt INTEGER NOT NULL,
          columns TEXT NOT NULL,
          data TEXT NOT NULL,
          createdByFirstActivity BOOLEAN DEFAULT NULL
        )
      `).run();
      
      db.prepare(`CREATE INDEX idx_matrices_createdAt ON matrices(createdAt)`).run();
    },
    down: (db) => {
      db.prepare('DROP TABLE IF EXISTS matrices').run();
    }
  });

  // Migration 004: Create activities table
  migrationRunner.addMigration({
    version: 4,
    name: 'create_activities_table',
    up: (db) => {
      db.prepare(`
        CREATE TABLE activities (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          pluginId TEXT DEFAULT NULL,
          sourceMatrixId TEXT DEFAULT NULL,
          inputColumnNames TEXT DEFAULT NULL,
          outputColumnNames TEXT DEFAULT NULL,
          inputParameters TEXT DEFAULT NULL,
          outputMetrics TEXT DEFAULT NULL,
          inputMatrixReferences TEXT DEFAULT NULL,
          outputMatrixReference TEXT DEFAULT NULL
        )
      `).run();
      
      db.prepare(`CREATE INDEX idx_activities_timestamp ON activities(timestamp)`).run();
      db.prepare(`CREATE INDEX idx_activities_sourceMatrixId ON activities(sourceMatrixId)`).run();
    },
    down: (db) => {
      db.prepare('DROP TABLE IF EXISTS activities').run();
    }
  });

  // Migration 005: Create visualizations table
  migrationRunner.addMigration({
    version: 5,
    name: 'create_visualizations_table',
    up: (db) => {
      db.prepare(`
        CREATE TABLE visualizations (
          id TEXT PRIMARY KEY,
          createdByActivityId TEXT DEFAULT NULL,
          createdAt INTEGER DEFAULT NULL,
          data TEXT NOT NULL
        )
      `).run();
      
      db.prepare(`CREATE INDEX idx_visualizations_createdByActivityId ON visualizations(createdByActivityId)`).run();
      db.prepare(`CREATE INDEX idx_visualizations_createdAt ON visualizations(createdAt)`).run();
    },
    down: (db) => {
      db.prepare('DROP TABLE IF EXISTS visualizations').run();
    }
  });

  // Migration 006: Example of adding a new column to existing table
  migrationRunner.addMigration({
    version: 6,
    name: 'add_session_description',
    up: (db) => {
      db.prepare(`ALTER TABLE sessions ADD COLUMN description TEXT DEFAULT NULL`).run();
    },
    down: (db) => {
      // Recreate table without the description column
      db.prepare(`CREATE TABLE sessions_backup AS SELECT id, name, date, workflowIds, activityIds, matrixIds, visualizationIds FROM sessions`).run();
      db.prepare(`DROP TABLE sessions`).run();
      db.prepare(`ALTER TABLE sessions_backup RENAME TO sessions`).run();
    }
  });

  // Migration 007: Example of modifying data
  migrationRunner.addMigration({
    version: 7,
    name: 'normalize_timestamps',
    up: (db) => {
      // Convert string timestamps to integers for activities
      const activities = db.prepare(`SELECT id, timestamp FROM activities WHERE typeof(timestamp) = 'text'`).all();
      
      for (const activity of activities as IcarusActivityRecord[]) {
        const numericTimestamp = Date.parse(activity.timestamp as unknown as string);
        if (!isNaN(numericTimestamp)) {
          db.prepare(`UPDATE activities SET timestamp = ? WHERE id = ?`)
            .run(numericTimestamp.toString(), activity.id);
        }
      }
    },
    down: (db) => {
      // Convert back to ISO strings
      const activities = db.prepare(`SELECT id, timestamp FROM activities WHERE typeof(timestamp) = 'text' AND timestamp GLOB '[0-9]*'`).all();
      
      for (const activity of activities as IcarusActivityRecord[]) {
        const date = new Date(parseInt(activity.timestamp as unknown as string, 10));
        db.prepare(`UPDATE activities SET timestamp = ? WHERE id = ?`)
          .run(date.toISOString(), activity.id);
      }
    }
  });

  migrationRunner.addMigration({
    version: 8,
    name: 'add_visualization_metadata',
    up: (db) => {
      const columns = db.prepare(`PRAGMA table_info(visualizations)`).all() as { name: string }[];
      const columnNames = new Set(columns.map((column) => column.name));

      if (!columnNames.has('sourceMatrixId')) {
        db.prepare(`ALTER TABLE visualizations ADD COLUMN sourceMatrixId TEXT DEFAULT NULL`).run();
      }
      if (!columnNames.has('renderer')) {
        db.prepare(`ALTER TABLE visualizations ADD COLUMN renderer TEXT DEFAULT NULL`).run();
      }
      if (!columnNames.has('visualizationType')) {
        db.prepare(`ALTER TABLE visualizations ADD COLUMN visualizationType TEXT DEFAULT NULL`).run();
      }
      if (!columnNames.has('title')) {
        db.prepare(`ALTER TABLE visualizations ADD COLUMN title TEXT DEFAULT NULL`).run();
      }

      db.prepare(`CREATE INDEX IF NOT EXISTS idx_visualizations_sourceMatrixId ON visualizations(sourceMatrixId)`).run();
    },
    down: () => {
      // SQLite column removal requires table recreation; keeping this migration additive.
    }
  });

  return migrationRunner;
}
