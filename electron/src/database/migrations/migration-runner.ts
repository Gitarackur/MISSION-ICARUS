// 1. MIGRATION INFRASTRUCTURE (src/database/migrations/migrationRunner.ts)
import Database from "better-sqlite3";

interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

export class MigrationRunner {
  private db: Database.Database;
  private migrations: Migration[] = [];

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeMigrationTable();
  }

  private initializeMigrationTable() {
    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      )
    `
      )
      .run();
  }

  addMigration(migration: Migration) {
    this.migrations.push(migration);
    // Sort by version to ensure proper order
    this.migrations.sort((a, b) => a.version - b.version);
  }

  getCurrentVersion(): number {
    const result = this.db
      .prepare(
        `
      SELECT MAX(version) as version FROM schema_migrations
    `
      )
      .get() as { version: number | null };

    return result?.version || 0;
  }

  getAppliedMigrations(): number[] {
    const results = this.db
      .prepare(
        `
      SELECT version FROM schema_migrations ORDER BY version
    `
      )
      .all() as { version: number }[];

    return results.map((r) => r.version);
  }

  async runMigrations(): Promise<void> {
    const currentVersion = this.getCurrentVersion();
    const appliedMigrations = new Set(this.getAppliedMigrations());

    console.log(`Current database version: ${currentVersion}`);

    // Find migrations that need to be applied
    const pendingMigrations = this.migrations.filter(
      (m) => m.version > currentVersion && !appliedMigrations.has(m.version)
    );

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations");
      return;
    }

    console.log(`Running ${pendingMigrations.length} migrations...`);

    // Run migrations in a transaction
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction((migrations: Migration[]) => {
          for (const migration of migrations) {
            try {
              console.log(
                `Applying migration ${migration.version}: ${migration.name}`
              );
              migration.up(this.db);

              // Record the migration
              this.db
                .prepare(
                  `
              INSERT INTO schema_migrations (version, name, applied_at)
              VALUES (?, ?, ?)
            `
                )
                .run(migration.version, migration.name, Date.now());

              console.log(
                `Migration ${migration.version} applied successfully`
              );
            } catch (error) {
              console.error(`Migration ${migration.version} failed:`, error);
              throw error;
            }
          }
        });

        transaction(pendingMigrations);
        console.log("All migrations completed successfully");
        resolve();
      } catch (error) {
        console.error("Migration transaction failed:", error);
        reject(error);
      }
    });
  }

  async rollback(targetVersion: number) {
    const currentVersion = this.getCurrentVersion();

    if (targetVersion >= currentVersion) {
      console.log("Target version is not lower than current version");
      return;
    }

    // Find migrations to rollback (in reverse order)
    const migrationsToRollback = this.migrations
      .filter((m) => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version); // Descending order

    console.log(`Rolling back ${migrationsToRollback.length} migrations...`);

    const transaction = this.db.transaction((migrations: Migration[]) => {
      for (const migration of migrations) {
        if (!migration.down) {
          throw new Error(
            `Migration ${migration.version} does not support rollback`
          );
        }

        try {
          console.log(
            `Rolling back migration ${migration.version}: ${migration.name}`
          );
          migration.down(this.db);

          // Remove from migration record
          this.db
            .prepare(
              `
            DELETE FROM schema_migrations WHERE version = ?
          `
            )
            .run(migration.version);

          console.log(
            `Migration ${migration.version} rolled back successfully`
          );
        } catch (error) {
          console.error(
            `Rollback of migration ${migration.version} failed:`,
            error
          );
          throw error;
        }
      }
    });

    transaction(migrationsToRollback);
    console.log(`Rollback to version ${targetVersion} completed successfully`);
  }
}
