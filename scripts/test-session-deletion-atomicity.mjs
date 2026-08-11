import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: [
    fileURLToPath(new URL("../src/app-layer/database/store.tsx", import.meta.url)),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  tsconfig: fileURLToPath(new URL("../tsconfig.json", import.meta.url)),
  write: false,
});
const encodedModule = Buffer.from(bundle.outputFiles[0].text).toString("base64");
const { IcarusDBAdapter } = await import(
  `data:text/javascript;base64,${encodedModule}`
);

const db = IcarusDBAdapter.db;

const seed = async () => {
  await db.sessions.put({
    id: "s1",
    name: "Atomic delete test",
    date: "2026-08-11",
    matrixIds: ["m1"],
    activityIds: ["a1"],
    visualizationIds: ["v1"],
  });
  await db.matrices.put({
    id: "m1",
    createdAt: 1,
    columns: ["c"],
    rowCount: 1,
    columnCount: 1,
    chunkCount: 1,
    estimatedBytes: 8,
    storageFormat: "chunked",
  });
  await db.matrixChunks.put({
    matrixId: "m1",
    chunkIndex: 0,
    rowStart: 0,
    rowCount: 1,
    columns: [{ kind: "values", values: [[1]] }],
  });
  await db.activities.put({ id: "a1", name: "analysis", timestamp: 2 });
  await db.visualizations.put({
    id: "v1",
    createdByActivityId: "a1",
    createdAt: 3,
    data: {},
  });
};

const existingRecords = async () => ({
  session: await db.sessions.get("s1"),
  matrix: await db.matrices.get("m1"),
  chunks: await db.matrixChunks.where("matrixId").equals("m1").count(),
  activity: await db.activities.get("a1"),
  visualization: await db.visualizations.get("v1"),
});

await seed();
const before = await existingRecords();
assert.ok(before.session);
assert.ok(before.matrix);
assert.equal(before.chunks, 1);
assert.ok(before.activity);
assert.ok(before.visualization);

db.sessions.hook("deleting", (sessionId) => {
  if (sessionId === "s1") throw new Error("forced deletion failure");
});

await assert.rejects(
  () => IcarusDBAdapter.deleteSessionWithAllData("s1"),
  /forced deletion failure/
);

const after = await existingRecords();
assert.ok(after.session, "session should survive the rolled-back delete");
assert.ok(after.matrix, "matrix should survive the rolled-back delete");
assert.equal(
  after.chunks,
  1,
  "matrix chunks should survive the rolled-back delete"
);
assert.ok(after.activity, "activity should survive the rolled-back delete");
assert.ok(
  after.visualization,
  "visualization should survive the rolled-back delete"
);
assert.deepEqual(after.session.matrixIds, ["m1"]);
assert.deepEqual(after.session.activityIds, ["a1"]);
assert.deepEqual(after.session.visualizationIds, ["v1"]);

console.log("Session deletion atomicity tests passed");
