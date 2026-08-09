import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: [
    fileURLToPath(
      new URL(
        "../src/ui/components/activity-tree/utils/navigation.ts",
        import.meta.url
      )
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const encodedModule = Buffer.from(bundle.outputFiles[0].text).toString("base64");
const { getActivityMatrixId, getActivityTreeSelection } = await import(
  `data:text/javascript;base64,${encodedModule}`
);

const matrixActivity = {
  id: "activity-matrix",
  name: "matrix activity",
  timestamp: 1,
  sourceMatrixId: "source-matrix",
  inputMatrixReferences: "input-matrix",
  outputMatrixReference: "output-matrix",
};
assert.equal(getActivityMatrixId(matrixActivity), "output-matrix");
assert.deepEqual(getActivityTreeSelection(matrixActivity, []), {
  kind: "matrix",
  matrixId: "output-matrix",
});

const visualizationActivity = {
  id: "activity-visualization",
  name: "visualization activity",
  timestamp: 2,
  sourceMatrixId: "activity-source",
  inputMatrixReferences: "activity-input",
};
const visualizations = [
  {
    id: "older-visualization",
    createdAt: 10,
    createdByActivityId: visualizationActivity.id,
    sourceMatrixId: "older-matrix",
    data: {},
  },
  {
    id: "newer-visualization",
    createdAt: 20,
    createdByActivityId: visualizationActivity.id,
    sourceMatrixId: "visualization-matrix",
    data: {},
  },
];
assert.deepEqual(
  getActivityTreeSelection(visualizationActivity, visualizations),
  {
    kind: "visualization",
    visualizationId: "newer-visualization",
    sourceMatrixId: "visualization-matrix",
  }
);

assert.deepEqual(
  getActivityTreeSelection(visualizationActivity, [
    {
      id: "legacy-visualization",
      createdAt: 30,
      createdByActivityId: visualizationActivity.id,
      data: { matrixId: "legacy-matrix" },
    },
  ]),
  {
    kind: "visualization",
    visualizationId: "legacy-visualization",
    sourceMatrixId: "legacy-matrix",
  }
);

assert.equal(
  getActivityTreeSelection(
    { id: "empty", name: "empty", timestamp: 3 },
    []
  ),
  null
);

console.log("Activity navigation tests passed");
