import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Database from "better-sqlite3";
import { build } from "esbuild";

const bundleDirectory = mkdtempSync(join(tmpdir(), "icarus-workflow-migration-"));
const bundlePath = join(bundleDirectory, "migrations.mjs");
let migrationsModule;
try {
  await build({
    entryPoints: [
      fileURLToPath(
        new URL("../electron/src/database/migrations/index.ts", import.meta.url)
      ),
    ],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: bundlePath,
  });
  migrationsModule = await import(pathToFileURL(bundlePath).href);
} finally {
  rmSync(bundleDirectory, { recursive: true, force: true });
}

const database = new Database(":memory:");
database.exec(`
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    workflowIds TEXT DEFAULT '[]',
    activityIds TEXT DEFAULT '[]',
    matrixIds TEXT DEFAULT '[]',
    visualizationIds TEXT DEFAULT '[]',
    description TEXT DEFAULT NULL
  );
  CREATE TABLE workflows (
    id TEXT PRIMARY KEY,
    createdAt INTEGER NOT NULL,
    data BLOB NOT NULL
  );
`);

database
  .prepare(`
    INSERT INTO sessions (
      id, name, date, workflowIds, activityIds, matrixIds, visualizationIds
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  .run(
    "session",
    "Migration test",
    "2026-08-09",
    JSON.stringify(["workflow"]),
    JSON.stringify(["activity"]),
    JSON.stringify(["matrix"]),
    JSON.stringify(["visualization"])
  );
database
  .prepare(`INSERT INTO workflows (id, createdAt, data) VALUES (?, ?, ?)`)
  .run("workflow", Date.now(), Buffer.from("{}"));

const migrationRunner = migrationsModule.setupMigrations(database);
const migrationInsert = database.prepare(`
  INSERT INTO schema_migrations (version, name, applied_at)
  VALUES (?, ?, ?)
`);
for (let version = 1; version <= 8; version += 1) {
  migrationInsert.run(version, `existing_${version}`, Date.now());
}

await migrationRunner.runMigrations();

const tableNames = database
  .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
  .all()
  .map(({ name }) => name);
assert.equal(tableNames.includes("workflows"), false);

const sessionColumns = database
  .prepare(`PRAGMA table_info(sessions)`)
  .all()
  .map(({ name }) => name);
assert.equal(sessionColumns.includes("workflowIds"), false);
assert.deepEqual(
  database.prepare(`SELECT * FROM sessions WHERE id = ?`).get("session"),
  {
    id: "session",
    name: "Migration test",
    date: "2026-08-09",
    activityIds: JSON.stringify(["activity"]),
    matrixIds: JSON.stringify(["matrix"]),
    visualizationIds: JSON.stringify(["visualization"]),
    description: null,
  }
);

await migrationRunner.rollback(8);
const rolledBackColumns = database
  .prepare(`PRAGMA table_info(sessions)`)
  .all()
  .map(({ name }) => name);
assert.equal(rolledBackColumns.includes("workflowIds"), true);
assert.equal(
  database
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get("workflows")?.name,
  "workflows"
);

database.close();
console.log("Workflow removal migration tests passed");
