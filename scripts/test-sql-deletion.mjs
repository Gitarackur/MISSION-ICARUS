import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Database from "better-sqlite3";
import { build } from "esbuild";

const bundleDirectory = mkdtempSync(join(tmpdir(), "icarus-sql-deletion-"));
const bundlePath = join(bundleDirectory, "adapter.mjs");
let adapterModule;
try {
  await build({
    entryPoints: [
      fileURLToPath(
        new URL("../electron/src/database/adapter.ts", import.meta.url)
      ),
    ],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: bundlePath,
  });
  adapterModule = await import(pathToFileURL(bundlePath).href);
} finally {
  rmSync(bundleDirectory, { recursive: true, force: true });
}
const { IcarusDBAdapter } = adapterModule;

const createDatabase = () => {
  const database = new Database(":memory:");
  database.exec(`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      workflowIds TEXT DEFAULT '[]',
      activityIds TEXT DEFAULT '[]',
      matrixIds TEXT DEFAULT '[]',
      visualizationIds TEXT DEFAULT '[]'
    );
    CREATE TABLE workflows (
      id TEXT PRIMARY KEY,
      createdAt INTEGER NOT NULL,
      data BLOB NOT NULL
    );
    CREATE TABLE matrices (
      id TEXT PRIMARY KEY,
      createdAt INTEGER NOT NULL,
      columns TEXT NOT NULL,
      data TEXT NOT NULL,
      createdByFirstActivity BOOLEAN DEFAULT NULL
    );
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
    );
    CREATE TABLE visualizations (
      id TEXT PRIMARY KEY,
      createdByActivityId TEXT DEFAULT NULL,
      createdAt INTEGER DEFAULT NULL,
      sourceMatrixId TEXT DEFAULT NULL,
      renderer TEXT DEFAULT NULL,
      visualizationType TEXT DEFAULT NULL,
      title TEXT DEFAULT NULL,
      data TEXT NOT NULL
    );
  `);
  return database;
};

const seed = (database) => {
  const adapter = new IcarusDBAdapter(database);
  const matrices = ["m0", "m1", "m2", "m3"].map((id, index) => ({
    id,
    createdAt: index,
    columns: [],
    data: [],
    createdByFirstActivity: id === "m0",
  }));
  const activities = [
    {
      id: "load",
      name: "load",
      timestamp: 0,
      outputMatrixReference: "m0",
    },
    {
      id: "a1",
      name: "analysis-1",
      timestamp: 1,
      sourceMatrixId: "m0",
      inputMatrixReferences: "m0",
      outputMatrixReference: "m1",
    },
    {
      id: "a2",
      name: "analysis-2",
      timestamp: 2,
      sourceMatrixId: "m1",
      inputMatrixReferences: "m1",
      outputMatrixReference: "m2",
    },
    {
      id: "branch",
      name: "branch",
      timestamp: 3,
      sourceMatrixId: "m0",
      inputMatrixReferences: "m0",
      outputMatrixReference: "m3",
    },
    {
      id: "visualization-activity",
      name: "visualization--bar",
      timestamp: 4,
      pluginId: "visualization-engine",
      sourceMatrixId: "m2",
      inputMatrixReferences: "m2",
    },
  ];
  const visualization = {
    id: "visualization",
    createdByActivityId: "visualization-activity",
    createdAt: 5,
    sourceMatrixId: "m2",
    renderer: "recharts",
    visualizationType: "bar",
    data: { matrixId: "m2" },
  };

  matrices.forEach((matrix) => adapter.saveMatrix(matrix));
  activities.forEach((activity) => adapter.saveActivity(activity));
  adapter.saveVisualization(visualization);
  adapter.saveSession({
    id: "session",
    name: "SQL deletion test",
    date: "2026-08-04",
    workflowIds: [],
    matrixIds: matrices.map(({ id }) => id),
    activityIds: activities.map(({ id }) => id),
    visualizationIds: [visualization.id],
  });

  return { adapter };
};

{
  const database = createDatabase();
  const { adapter } = seed(database);
  const plan = adapter.getMatrixDeletionPlan("session", "m1");
  assert.deepEqual(plan.matrixIds, ["m1", "m2"]);
  assert.deepEqual(plan.activityIds, [
    "a1",
    "a2",
    "visualization-activity",
  ]);
  assert.deepEqual(plan.visualizationIds, ["visualization"]);

  const result = adapter.deleteMatrixFromSession("session", "m1", plan);
  assert.deepEqual(result.session.matrixIds, ["m0", "m3"]);
  assert.deepEqual(result.session.activityIds, ["load", "branch"]);
  assert.deepEqual(result.session.visualizationIds, []);
  assert.equal(adapter.getMatrix("m1"), null);
  assert.equal(adapter.getMatrix("m2"), null);
  assert.equal(adapter.getActivity("a1"), null);
  assert.equal(adapter.getVisualization("visualization"), null);
  database.close();
}

{
  const database = createDatabase();
  const { adapter } = seed(database);
  const plan = adapter.getActivityDeletionPlan("session", "a1");
  const result = adapter.deleteActivityFromSession("session", "a1", plan);
  assert.deepEqual(result.session.matrixIds, ["m0", "m3"]);
  assert.deepEqual(result.session.activityIds, ["load", "branch"]);
  assert.equal(adapter.getActivity("a1"), null);
  assert.equal(adapter.getMatrix("m1"), null);
  assert.equal(adapter.getVisualization("visualization"), null);
  database.close();
}

{
  const database = createDatabase();
  const { adapter } = seed(database);
  const plan = adapter.getVisualizationDeletionPlan(
    "session",
    "visualization"
  );
  const result = adapter.deleteVisualizationFromSession(
    "session",
    "visualization",
    plan
  );
  assert.deepEqual(result.session.matrixIds, ["m0", "m1", "m2", "m3"]);
  assert.equal(adapter.getVisualization("visualization"), null);
  assert.equal(adapter.getActivity("visualization-activity"), null);
  assert.notEqual(adapter.getMatrix("m2"), null);
  database.close();
}

{
  const database = createDatabase();
  const { adapter } = seed(database);
  const confirmedPlan = adapter.getMatrixDeletionPlan("session", "m1");
  adapter.saveMatrix({ id: "m4", createdAt: 6, columns: [], data: [] });
  adapter.saveActivity({
    id: "a3",
    name: "late dependency",
    timestamp: 6,
    sourceMatrixId: "m2",
    inputMatrixReferences: "m2",
    outputMatrixReference: "m4",
  });
  const session = adapter.getSession("session");
  assert.ok(session);
  adapter.saveSession({
    ...session,
    matrixIds: [...session.matrixIds, "m4"],
    activityIds: [...session.activityIds, "a3"],
  });

  assert.throws(
    () => adapter.deleteMatrixFromSession("session", "m1", confirmedPlan),
    /Dependencies changed/
  );
  assert.notEqual(adapter.getMatrix("m1"), null);
  assert.notEqual(adapter.getMatrix("m4"), null);
  assert.notEqual(adapter.getVisualization("visualization"), null);
  database.close();
}

{
  const database = createDatabase();
  const { adapter } = seed(database);
  adapter.saveSession({
    id: "shared-session",
    name: "Shared legacy record",
    date: "2026-08-04",
    workflowIds: [],
    matrixIds: ["m1"],
    activityIds: [],
    visualizationIds: [],
  });
  const plan = adapter.getMatrixDeletionPlan("session", "m1");
  adapter.deleteMatrixFromSession("session", "m1", plan);
  assert.notEqual(adapter.getMatrix("m1"), null);
  const sharedSession = adapter.getSession("shared-session");
  assert.ok(sharedSession);
  assert.deepEqual(sharedSession.matrixIds, ["m1"]);
  database.close();
}

{
  const database = createDatabase();
  const { adapter } = seed(database);
  const originalSession = adapter.getSession("session");
  const plan = adapter.getMatrixDeletionPlan("session", "m1");
  database.exec(`
    CREATE TRIGGER reject_a2_deletion
    BEFORE DELETE ON activities
    WHEN OLD.id = 'a2'
    BEGIN
      SELECT RAISE(ABORT, 'forced deletion failure');
    END;
  `);

  assert.throws(
    () => adapter.deleteMatrixFromSession("session", "m1", plan),
    /forced deletion failure/
  );
  assert.deepEqual(adapter.getSession("session"), originalSession);
  assert.notEqual(adapter.getMatrix("m1"), null);
  assert.notEqual(adapter.getMatrix("m2"), null);
  assert.notEqual(adapter.getActivity("a1"), null);
  assert.notEqual(adapter.getActivity("a2"), null);
  assert.notEqual(adapter.getVisualization("visualization"), null);
  database.close();
}

console.log("SQLite deletion integration tests passed");
