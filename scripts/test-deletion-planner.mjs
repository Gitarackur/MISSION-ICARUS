import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: [
    fileURLToPath(
      new URL("../src/app-layer/database/deletion.ts", import.meta.url)
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const encodedModule = Buffer.from(bundle.outputFiles[0].text).toString("base64");
const {
  assertDeletionPlanIntegrity,
  hasSameDeletionScope,
  planActivityDeletion,
  planMatrixDeletion,
  planVisualizationDeletion,
} = await import(`data:text/javascript;base64,${encodedModule}`);

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
const visualizations = [
  {
    id: "visualization",
    createdByActivityId: "visualization-activity",
    // Legacy records can carry the reference only in the payload.
    data: { matrixId: "m2" },
  },
];
const session = {
  id: "session",
  name: "Deletion test",
  date: "",
  workflowIds: [],
  activityIds: activities.map(({ id }) => id),
  matrixIds: matrices.map(({ id }) => id),
  visualizationIds: visualizations.map(({ id }) => id),
  workflows: [],
  activities,
  matrices,
  visualizations,
};

const middleMatrixPlan = planMatrixDeletion(session, "m1");
assert.deepEqual(middleMatrixPlan.matrixIds, ["m1", "m2"]);
assert.deepEqual(middleMatrixPlan.activityIds, [
  "a1",
  "a2",
  "visualization-activity",
]);
assert.deepEqual(middleMatrixPlan.visualizationIds, ["visualization"]);
assertDeletionPlanIntegrity(session, middleMatrixPlan);

const leafMatrixPlan = planMatrixDeletion(session, "m3");
assert.deepEqual(leafMatrixPlan.matrixIds, ["m3"]);
assert.deepEqual(leafMatrixPlan.activityIds, ["branch"]);
assert.equal(leafMatrixPlan.isSourceMatrix, false);
assertDeletionPlanIntegrity(session, leafMatrixPlan);

const rootMatrixPlan = planMatrixDeletion(session, "m0");
assert.deepEqual(rootMatrixPlan.matrixIds, ["m0", "m1", "m2", "m3"]);
assert.equal(rootMatrixPlan.activityIds.length, activities.length);
assert.deepEqual(rootMatrixPlan.visualizationIds, ["visualization"]);
assertDeletionPlanIntegrity(session, rootMatrixPlan);

const activityPlan = planActivityDeletion(session, "a1");
assert.deepEqual(activityPlan.matrixIds, ["m1", "m2"]);
assert.deepEqual(activityPlan.visualizationIds, ["visualization"]);
assertDeletionPlanIntegrity(session, activityPlan);

const visualizationPlan = planVisualizationDeletion(
  session,
  "visualization"
);
assert.deepEqual(visualizationPlan.matrixIds, []);
assert.deepEqual(visualizationPlan.activityIds, ["visualization-activity"]);
assertDeletionPlanIntegrity(session, visualizationPlan);

const sharedCreatorSession = {
  ...session,
  visualizationIds: ["visualization", "visualization-2"],
  visualizations: [
    ...visualizations,
    {
      id: "visualization-2",
      createdByActivityId: "visualization-activity",
      sourceMatrixId: "m2",
      data: {},
    },
  ],
};
assert.deepEqual(
  planVisualizationDeletion(sharedCreatorSession, "visualization").activityIds,
  []
);
assert.throws(() => planMatrixDeletion(session, "missing-matrix"));
assert.throws(() =>
  assertDeletionPlanIntegrity(session, {
    ...leafMatrixPlan,
    matrixIds: ["m0"],
    activityIds: [],
  })
);

assert.equal(hasSameDeletionScope(middleMatrixPlan, { ...middleMatrixPlan }), true);
assert.equal(
  hasSameDeletionScope(middleMatrixPlan, {
    ...middleMatrixPlan,
    matrixIds: [...middleMatrixPlan.matrixIds, "m3"],
  }),
  false
);

console.log("Deletion planner tests passed");
