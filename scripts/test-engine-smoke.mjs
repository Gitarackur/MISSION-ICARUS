import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      export {
        performPCA,
        detectIQROutliers,
        detectGrubbsOutliers,
        quantileNormalization,
        filterRowsByRange,
        filterRowsByOutlier,
        filterRowsByMissing,
        addColumn,
        fillColumn,
        deleteColumns,
      } from "./src/app-layer/statistics/utils/statistical-engine.ts";
    `,
    resolveDir: repositoryRoot,
    sourcefile: "engine-test-entry.ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const encodedModule = Buffer.from(bundle.outputFiles[0].text).toString("base64");
const engine = await import(`data:text/javascript;base64,${encodedModule}`);

// --- IQR outliers (Type-7 quantiles) ---
const iqr = engine.detectIQROutliers([1, 2, 3, 4, 5, 100]);
// [1..5] Q1=2 Q3=4 IQR=2; fences -1 and 7 → 100 flagged, 5 is NOT an outlier.
assert.deepEqual(iqr.map((o) => o.isOutlier).slice(0, 5), [
  false,
  false,
  false,
  false,
  false,
]);
assert.equal(iqr[5].isOutlier, true);

// --- Grubbs critical value (n=6, alpha=0.05) ≈ 1.887 ** [(5 / sqrt(6)) * sqrt(t^2 / (4 + t^2))] ---
const grubbs = engine.detectGrubbsOutliers([1, 2, 3, 4, 5, 100]);
assert.equal(grubbs[5].isOutlier, true);

// --- PCA on linear-dependent data → one component explains ~100% ---
const pca = engine.performPCA(
  [
    [1, 2, 3, 4, 5],
    [2, 4, 6, 8, 10],
  ],
  2
);
const total = pca.explained_variance.reduce((a, b) => a + b, 0);
assert.ok(total > 0, "PCA explained variance is nonzero");
assert.ok(pca.explained_variance[0] / total > 0.99, "PC1 dominates linear data");

// --- Quantile normalization excludes NaN and preserves holes ---
const qn = engine.quantileNormalization([
  [1, NaN, 2, null].map((v) => (v === null ? NaN : v)),
  [10, 11, NaN, 12].map((v) => (v === null ? NaN : v)),
]);
assert.ok(isNaN(qn[0][1]), "missing value stays missing");
assert.ok(isNaN(qn[1][2]), "missing value stays missing");
assert.ok(Number.isFinite(qn[0][0]), "observed value normalized");

// --- Filter rows by range: keep rows where ANY column in [2,4] ---
const ranged = engine.filterRowsByRange(
  [
    [1, 2, 3, 4, 5],
    [0, 0, 9, 0, 0],
  ],
  2,
  4
);
assert.equal(ranged[0].length, 3, "rows 2,3,4 kept");

// --- Filter rows by outlier (iqr) ---
const outlierRows = engine.filterRowsByOutlier(
  [
    [1, 2, 3, 4, 5, 100],
    [1, 1, 1, 1, 1, 1],
  ],
  "iqr"
);
assert.equal(outlierRows[0].length, 1, "only outlier row kept");
assert.equal(outlierRows[0][0], 100);

// --- Column ops ---
assert.deepEqual(addColumnFixture(), [7, 8, 9]);
assert.deepEqual(addColumnFallbackFixture(), [NaN, NaN, NaN]);
assert.deepEqual(fillColumnFixture(), [5, 5, 5]);
assert.deepEqual(deleteColumnsFixture(), [[10, 20]]);

function addColumnFixture() {
  const res = engine.addColumn(
    [
      [1, 2, 3],
      [4, 5, 6],
    ],
    [7, 8, 9]
  );
  return res.updatedData[2];
}
function addColumnFallbackFixture() {
  const res = engine.addColumn(
    [
      [1, 2, 3],
      [4, 5, 6],
    ],
    []
  );
  return res.updatedData[2];
}
function fillColumnFixture() {
  return engine.fillColumn([[1, 2, 3]], 0, 5)[0];
}
function deleteColumnsFixture() {
  return engine.deleteColumns(
    [
      [1, 2],
      [10, 20],
      [3, 4],
    ],
    [0, 2]
  );
}

// --- filter by missing (mode without-missing) ---
const missingData = [
  [1, NaN, 3],
  [4, 5, 6],
];
const withoutMissing = engine.filterRowsByMissing(missingData, "without-missing");
assert.equal(withoutMissing[0].length, 2, "two complete rows");
assert.deepEqual(withoutMissing[0], [1, 3], "missing-loaded column keeps complete rows");
assert.deepEqual(withoutMissing[1], [4, 6], "second column aligned");

console.log("Engine math smoke tests passed (Track B)");