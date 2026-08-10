import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import jStatPkg from "jstat";
const { jStat } = jStatPkg;
import * as ss from "simple-statistics";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      export {
        mean,
        median,
        variance,
        stddev,
        sum,
        tTestTwoSample,
        oneWayANOVA,
        fTest,
        chiSquareTest,
        normalization,
        zScoreNormalization,
        meanCenteringNormalization,
        movingAverage,
        rollingStdDev,
        detectZScoreOutliers,
        detectIQROutliers,
        detectGrubbsOutliers,
        imputeMeanColumn,
        imputeMedianColumn,
        knnImputeTarget,
        multipleImputationMice,
        performPCA,
        adjustPValues,
        limmaBatchAnalysis,
      } from "./src/app-layer/statistics/utils/statistical-engine.ts";
      export { runStatisticalAnalysis } from "./src/app-layer/statistics/utils/statistical-action-runner.ts";
      export { composeStatisticalOutputMatrix } from "./src/app-layer/statistics/utils/statistical-matrix-composer.ts";
    `,
    resolveDir: repositoryRoot,
    sourcefile: "statistics-validation-entry.ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  logLevel: "silent",
});
const encodedModule = Buffer.from(bundle.outputFiles[0].text).toString("base64");
const engine = await import(`data:text/javascript;base64,${encodedModule}`);

const TOL = 1e-9;
const approx = (actual, expected, tol = TOL) => {
  if (Number.isNaN(actual) && Number.isNaN(expected)) return true;
  if (!Number.isFinite(actual) || !Number.isFinite(expected))
    return Math.abs(actual - expected) <= tol;
  return Math.abs(actual - expected) <= tol;
};
const approxArr = (actual, expected, tol = TOL) =>
  actual.length === expected.length &&
  actual.every((v, i) => approx(v, expected[i], tol));

let checks = 0;

// ---------------------------------------------------------------------------
// 1. Descriptive statistics vs simple-statistics
// ---------------------------------------------------------------------------
const data = [1, 2, 3, 4, 5, 6, 7, 8];
assert.ok(approx(engine.mean(data), ss.mean(data)), "mean matches ss");
assert.ok(approx(engine.median(data), ss.median(data)), "median matches ss");
assert.ok(
  approx(engine.variance(data), ss.sampleVariance(data)),
  "sample variance matches ss"
);
assert.ok(
  approx(engine.stddev(data), ss.sampleStandardDeviation(data)),
  "sample stddev matches ss"
);
assert.ok(approx(engine.sum(data), ss.sum(data)), "sum matches ss");
checks += 5;

// Edge cases: empty / NaN filtering
assert.equal(engine.mean([]), 0);
assert.equal(engine.mean([NaN, Infinity, -Infinity]), 0);
assert.equal(engine.sum([NaN, 1, 2]), 3);
assert.equal(engine.variance([5]), 0);
assert.equal(engine.stddev([5]), 0);
checks += 5;

// ---------------------------------------------------------------------------
// 2. Hypothesis tests vs jStat reference math
// ---------------------------------------------------------------------------
const g1 = [2, 4, 4, 4, 5, 5, 7, 9];
const g2 = [1, 2, 2, 3, 3, 4, 5, 5];

// Welch t-test reference computed with jStat primitives
const m1 = ss.mean(g1);
const m2 = ss.mean(g2);
const v1 = ss.sampleVariance(g1);
const v2 = ss.sampleVariance(g2);
const n1 = g1.length;
const n2 = g2.length;
const se = Math.sqrt(v1 / n1 + v2 / n2);
const tRef = (m1 - m2) / se;
const dfRef =
  se ** 4 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
const pRef = 2 * (1 - jStat.studentt.cdf(Math.abs(tRef), dfRef));

const tRes = engine.tTestTwoSample(g1, g2);
assert.ok(approx(tRes.tStatistic, tRef), "welch t statistic matches reference");
assert.ok(approx(tRes.degreesOfFreedom, dfRef), "welch df matches reference");
assert.ok(approx(tRes.pValue, pRef), "welch p-value matches reference");
checks += 3;

// One-way ANOVA reference
const ga = [1, 2, 3];
const gb = [4, 5, 6];
const gc = [7, 8, 9];
const groups = [ga, gb, gc];
const grand = [...ga, ...gb, ...gc];
const grandMean = ss.mean(grand);
let ssb = 0;
let ssw = 0;
let totalN = 0;
for (const group of groups) {
  const gm = ss.mean(group);
  ssb += group.length * (gm - grandMean) ** 2;
  for (const x of group) ssw += (x - gm) ** 2;
  totalN += group.length;
}
const dfb = groups.length - 1;
const dfw = totalN - groups.length;
const fRef = (ssb / dfb) / (ssw / dfw);
const pAnovaRef = 1 - jStat.centralF.cdf(fRef, dfb, dfw);

const anovaRes = engine.oneWayANOVA(groups);
assert.ok(approx(anovaRes.fStatistic, fRef), "ANOVA F matches reference");
assert.ok(approx(anovaRes.pValue, pAnovaRef), "ANOVA p-value matches reference");
assert.equal(anovaRes.dfBetween, dfb);
assert.equal(anovaRes.dfWithin, dfw);
checks += 4;

// Two-sample F-test (variance ratio) reference
const fa = [1, 2, 3, 4, 5];
const fb = [1, 2, 2, 3, 5];
const fva = ss.sampleVariance(fa);
const fvb = ss.sampleVariance(fb);
const fRes = engine.fTest(fa, fb);
// Engine places larger variance in numerator
const [big, small] = fva >= fvb ? [fva, fvb] : [fvb, fva];
const fStatRef = big / small;
const fdf1 = (fva >= fvb ? fa : fb).length - 1;
const fdf2 = (fva >= fvb ? fb : fa).length - 1;
const pFRef = 2 * Math.min(jStat.centralF.cdf(fStatRef, fdf1, fdf2), 1 - jStat.centralF.cdf(fStatRef, fdf1, fdf2));
assert.ok(approx(fRes.fStatistic, fStatRef), "F-test statistic matches reference");
assert.ok(approx(fRes.pValue, pFRef), "F-test p-value matches reference");
checks += 2;

// Chi-square goodness-of-fit reference
const obs = [16, 18, 16, 14, 12, 12];
const exp = Array(obs.length).fill(ss.sum(obs) / obs.length);
const chiRef = obs.reduce((s, o, i) => s + (o - exp[i]) ** 2 / exp[i], 0);
const pChiRef = 1 - jStat.chisquare.cdf(chiRef, obs.length - 1);
const chiRes = engine.chiSquareTest(obs);
assert.ok(approx(chiRes.chiSquareStatistic, chiRef), "chi-square statistic matches reference");
assert.ok(approx(chiRes.pValue, pChiRef), "chi-square p-value matches reference");
checks += 2;

// ---------------------------------------------------------------------------
// 3. Normalization vs reference math
// ---------------------------------------------------------------------------
const minmax = engine.normalization([[1, 2, 3, 4]]);
const minmaxRef = [0, 1 / 3, 2 / 3, 1];
assert.ok(approxArr(minmax[0], minmaxRef), "min-max normalization matches reference");
checks += 1;

const zs = engine.zScoreNormalization([[1, 2, 3, 4, 5]]);
const zsRef = [1, 2, 3, 4, 5].map(
  (v) => (v - ss.mean([1, 2, 3, 4, 5])) / ss.sampleStandardDeviation([1, 2, 3, 4, 5])
);
assert.ok(approxArr(zs[0], zsRef), "z-score normalization matches reference");
checks += 1;

const mc = engine.meanCenteringNormalization([[1, 2, 3, 4]]);
const mcRef = [1, 2, 3, 4].map((v) => v - ss.mean([1, 2, 3, 4]));
assert.ok(approxArr(mc[0], mcRef), "mean-centering matches reference");
checks += 1;

// ---------------------------------------------------------------------------
// 4. Time series (moving average / rolling stddev)
// ---------------------------------------------------------------------------
// movingAverage is length-preserving: cumulative average until window is full
const ma = engine.movingAverage([1, 2, 3, 4, 5], 3);
assert.ok(
  approxArr(ma, [1, 1.5, 2, 3, 4]),
  "movingAverage length-preserving series"
);
const rs = engine.rollingStdDev([1, 2, 3, 4, 5], 3);
assert.equal(rs.length, 5, "rollingStdDev is length-preserving");
assert.ok(Number.isFinite(rs[0]) && Number.isFinite(rs[4]), "rolling stddev finite");
checks += 2;

// ---------------------------------------------------------------------------
// 5. Outlier detection vs library/reference quantiles
// ---------------------------------------------------------------------------
// IQR: Type-7 quantiles via simple-statistics
const iqrVals = [1, 2, 3, 4, 5, 6, 7, 100];
const iqrRes = engine.detectIQROutliers(iqrVals);
const q1 = ss.quantileSorted(iqrVals, 0.25);
const q3 = ss.quantileSorted(iqrVals, 0.75);
const iqr = q3 - q1;
const upperFence = q3 + 1.5 * iqr;
assert.ok(approx(iqrRes[0].q1, q1), "IQR q1 matches ss");
assert.ok(approx(iqrRes[0].q3, q3), "IQR q3 matches ss");
assert.equal(iqrRes[iqrVals.length - 1].isOutlier, true, "100 is IQR outlier");
assert.ok(iqrRes.slice(0, -1).every((o) => !o.isOutlier), "no false IQR positives");
checks += 4;

// Z-score outliers (threshold 3) — larger sample so the outlier doesn't mask itself
const zData = Array.from({ length: 40 }, (_, i) => 10 + (i % 5));
zData.push(500);
const zOut = engine.detectZScoreOutliers(zData);
assert.equal(zOut[zOut.length - 1].isOutlier, true, "500 is z-score outlier");
assert.ok(
  zOut.slice(0, -1).every((o) => !o.isOutlier),
  "no false z-score positives"
);
checks += 2;

// Grubbs critical value for n=6, alpha=0.05 ≈ 1.887
const grubbs = engine.detectGrubbsOutliers([1, 2, 3, 4, 5, 100]);
assert.ok(approx(grubbs[0].criticalValue, 1.887, 1e-3), "Grubbs critical value ≈1.887");
assert.equal(grubbs[5].isOutlier, true, "100 is Grubbs outlier");
checks += 2;

// ---------------------------------------------------------------------------
// 6. Imputation
// ---------------------------------------------------------------------------
assert.deepEqual(engine.imputeMeanColumn([1, NaN, 3]), [1, 2, 3]);
assert.deepEqual(engine.imputeMedianColumn([1, NaN, 3, 4]), [1, 3, 3, 4]);
assert.deepEqual(engine.imputeMeanColumn([NaN, NaN]), [NaN, NaN]);
checks += 3;

// ---------------------------------------------------------------------------
// 7. PCA: linear dependent data -> PC1 explains ~100%
// ---------------------------------------------------------------------------
const pca = engine.performPCA(
  [
    [1, 2, 3, 4, 5],
    [2, 4, 6, 8, 10],
  ],
  2
);
const totalVar = pca.explained_variance.reduce((a, b) => a + b, 0);
assert.ok(totalVar > 0, "PCA explained variance nonzero");
assert.ok(pca.explained_variance[0] / totalVar > 0.99, "PC1 dominates linear data");
checks += 2;

// Row-aligned results extend the active matrix; aggregates and matrix
// transforms remain standalone regardless of coincidental output dimensions.
const sourceMatrix = {
  id: "source",
  createdAt: 1,
  columns: ["id", "a", "b"],
  data: [
    ["r1", 1, 3],
    ["r2", 3, 5],
    ["r3", 5, 7],
  ],
};
const selectedMatrix = new Map([
  ["a", [1, 3, 5]],
  ["b", [3, 5, 7]],
]);

const zResult = engine.runStatisticalAnalysis("z", selectedMatrix);
assert.equal(zResult.outputParameters.granularity, "row-aligned");
const extendedZ = engine.composeStatisticalOutputMatrix(zResult, sourceMatrix);
assert.deepEqual(extendedZ.columns, ["id", "a", "b", "a_z", "b_z"]);
assert.equal(extendedZ.data.length, sourceMatrix.data.length);
assert.deepEqual(
  extendedZ.data.map((row) => row.slice(0, 3)),
  sourceMatrix.data,
  "z output preserves every source cell"
);
assert.ok(
  extendedZ.data.every((row) => row.length === extendedZ.columns.length),
  "z output appends one value per derived column"
);

const twoDResult = engine.runStatisticalAnalysis("2d", selectedMatrix);
const extendedTwoD = engine.composeStatisticalOutputMatrix(
  twoDResult,
  sourceMatrix
);
assert.deepEqual(extendedTwoD.columns, [
  "id",
  "a",
  "b",
  "PC1_2d",
  "PC2_2d",
]);
assert.equal(extendedTwoD.data.length, sourceMatrix.data.length);
assert.ok(
  extendedTwoD.data.every((row) => row.length === extendedTwoD.columns.length),
  "2d output appends two row-aligned principal components"
);

const pmResult = engine.runStatisticalAnalysis("pm", selectedMatrix);
assert.deepEqual(pmResult.newly_created_columns, ["mu", "p_value"]);
assert.deepEqual(
  pmResult.data.map((row) => row[0]),
  [2, 4, 6],
  "pμ means are calculated for each source row"
);
const extendedPm = engine.composeStatisticalOutputMatrix(pmResult, sourceMatrix);
assert.deepEqual(extendedPm.columns, ["id", "a", "b", "mu", "p_value"]);
assert.equal(extendedPm.data.length, sourceMatrix.data.length);
assert.ok(
  extendedPm.data.every((row) => row.length === extendedPm.columns.length),
  "pμ output is row-aligned with the source matrix"
);

const normalizationResult = engine.runStatisticalAnalysis(
  "normalization",
  selectedMatrix
);
const extendedNormalization = engine.composeStatisticalOutputMatrix(
  normalizationResult,
  sourceMatrix
);
assert.equal(normalizationResult.outputParameters.granularity, "row-aligned");
assert.equal(extendedNormalization.extendsSourceMatrix, true);
assert.deepEqual(extendedNormalization.columns, [
  "id",
  "a",
  "b",
  "a_normalized",
  "b_normalized",
]);

const oneDimensionalResult = engine.runStatisticalAnalysis(
  "1d-normalize",
  selectedMatrix
);
const extendedOneDimensional = engine.composeStatisticalOutputMatrix(
  oneDimensionalResult,
  sourceMatrix
);
assert.deepEqual(oneDimensionalResult.newly_created_columns, ["a_1d", "b_1d"]);
assert.ok(
  oneDimensionalResult.data.every(
    (row) => row.length === oneDimensionalResult.newly_created_columns.length
  ),
  "row-aligned results contain only their derived columns"
);
assert.equal(extendedOneDimensional.extendsSourceMatrix, true);

const oneRowSource = {
  id: "one-row-source",
  createdAt: 2,
  columns: ["id", "a", "b"],
  data: [["r1", 1, 3]],
};
const oneRowSelection = new Map([
  ["a", [1]],
  ["b", [3]],
]);
const aggregateMean = engine.runStatisticalAnalysis("mean", oneRowSelection);
const standaloneMean = engine.composeStatisticalOutputMatrix(
  aggregateMean,
  oneRowSource
);
assert.equal(aggregateMean.outputParameters.granularity, "aggregate");
assert.equal(
  standaloneMean.extendsSourceMatrix,
  false,
  "aggregate output does not extend even when its single row matches the source"
);

const sortedResult = engine.runStatisticalAnalysis("sort-asc", selectedMatrix);
const standaloneSort = engine.composeStatisticalOutputMatrix(
  sortedResult,
  sourceMatrix
);
assert.equal(sortedResult.outputParameters.granularity, "matrix-transform");
assert.equal(
  standaloneSort.extendsSourceMatrix,
  false,
  "a full-size matrix transform is not appended to the source rows"
);

const incompleteRowAlignedResult = {
  ...zResult,
  data: zResult.data.slice(0, 2),
};
assert.equal(
  engine.composeStatisticalOutputMatrix(
    incompleteRowAlignedResult,
    sourceMatrix
  ).extendsSourceMatrix,
  false,
  "a limited row-aligned result cannot extend the full source matrix"
);

const originalConsoleError = console.error;
try {
  console.error = () => {};
  assert.throws(
    () =>
      engine.runStatisticalAnalysis(
        "2d",
        new Map([
          ["a", [1]],
          ["b", [2]],
        ])
      ),
    /at least two rows/,
    "2d rejects a single-row matrix"
  );
} finally {
  console.error = originalConsoleError;
}
checks += 25;

// ---------------------------------------------------------------------------
// 8. Multiple-testing correction (BH + Bonferroni) & batch LIMMA
// ---------------------------------------------------------------------------
// BH reference computed by hand (step-up): p=[0.01,0.02,0.03], n=3
// sorted asc: q3=0.03, q2=min(0.02*3/2=0.03,0.03)=0.03, q1=min(0.01*3/1=0.03,0.03)=0.03
const bh = engine.adjustPValues([0.01, 0.02, 0.03], "BH");
assert.deepEqual(bh, [0.03, 0.03, 0.03], "BH [0.01,0.02,0.03] -> all 0.03");
// p=[0.01,0.04,0.5], n=3: q3=min(0.5*3/3,1)=0.5, q2=min(0.04*3/2,1)=0.06, q1=min(0.01*3,1)=0.03
// monotone: 0.03,0.06,0.5
const bh2 = engine.adjustPValues([0.01, 0.04, 0.5], "BH");
assert.deepEqual(bh2, [0.03, 0.06, 0.5], "BH [0.01,0.04,0.5] monotone");
// Bonferroni: p*n capped at 1
const bf = engine.adjustPValues([0.01, 0.02, 0.03], "bonferroni");
assert.deepEqual(bf, [0.03, 0.06, 0.09], "Bonferroni p*3");
// NaN p-values pass through, excluded from family size
const bhNaN = engine.adjustPValues([0.01, NaN, 0.02], "BH");
assert.equal(bhNaN[1], NaN, "BH keeps NaN p-value");
assert.ok(Number.isFinite(bhNaN[0]) && Number.isFinite(bhNaN[2]), "BH adjusts finite entries");
checks += 5;

// Batch LIMMA: 3 genes x 3 replicates per group, cross-check adjusted p-values
// against adjustPValues applied to per-gene raw p-values.
const treatmentMatrix = [
  [10, 12, 11],
  [5, 6, 7],
  [8, 9, 10],
];
const controlMatrix = [
  [2, 3, 4],
  [5, 5, 6],
  [1, 2, 2],
];
const batch = engine.limmaBatchAnalysis(treatmentMatrix, controlMatrix, ["g1", "g2", "g3"], "BH");
const rawP = batch.map((r) => r.pValue);
const expectedAdjusted = engine.adjustPValues(rawP, "BH");
batch.forEach((r, i) => {
  assert.ok(
    Number.isFinite(r.adjustedPValue) && Math.abs(r.adjustedPValue - expectedAdjusted[i]) < 1e-12,
    `limmaBatch adjusted matches BH for gene ${i}`
  );
  assert.equal(r.geneName, `g${i + 1}`, "gene name preserved");
});
assert.ok(batch[0].logFoldChange > 1, "strong treatment/control fold change for g1");
checks += batch.length + 2;

// Insufficient replicates -> NaN row, other genes unaffected
const shortBatch = engine.limmaBatchAnalysis(
  [[10, 11], [1]],
  [[3, 4], [2]],
  ["ok", "short"],
  "BH"
);
assert.equal(shortBatch[1].pValue, NaN, "gene with <2 replicates yields NaN p-value");
assert.equal(shortBatch[1].adjustedPValue, NaN, "gene with <2 replicates yields NaN adjusted p");
assert.ok(Number.isFinite(shortBatch[0].pValue), "valid gene still computed");
checks += 3;

// ---------------------------------------------------------------------------
// 9. Multiple imputation (MICE + Rubin's rules)
// ---------------------------------------------------------------------------
// Fully observed data: no missing cells -> pooled output equals the input and
// every imputed dataset equals the input.
const completeData = [
  [1, 2, 3, 4, 5],
  [2, 4, 6, 8, 10],
];
const completeMi = engine.multipleImputationMice(completeData, "pmm", 5, 10, 7);
assert.equal(completeMi.missingCount, 0, "fully observed data has no missing cells");
assert.equal(completeMi.imputedCount, 0, "fully observed data imputes nothing");
assert.equal(completeMi.iterationsPerformed, 0, "no iteration cycles for complete data");
assert.ok(approxArr(completeMi.pooledData[0], completeData[0]), "pooled column preserved");
assert.equal(completeMi.imputedDatasets.length, 5, "m complete datasets are returned");
checks += 5;

// Determinism: a fixed seed reproduces the pooled dataset exactly.
const missingData = [
  [1, 2, NaN, 4, 5],
  [2, 4, 6, NaN, 10],
  [3, 6, 9, 12, 15],
];
const miA = engine.multipleImputationMice(missingData, "pmm", 5, 10, 42);
const miB = engine.multipleImputationMice(missingData, "pmm", 5, 10, 42);
assert.deepEqual(miA.pooledData, miB.pooledData, "seeded runs are reproducible");
assert.deepEqual(miA.imputedDatasets, miB.imputedDatasets, "seeded datasets reproducible");
checks += 2;

// Observed values are never altered by imputation and every missing cell is
// filled in the pooled dataset.
for (let j = 0; j < missingData.length; j++) {
  for (let i = 0; i < missingData[j].length; i++) {
    if (Number.isFinite(missingData[j][i])) {
      assert.equal(miA.pooledData[j][i], missingData[j][i], `observed cell ${j},${i} preserved`);
    } else {
      assert.ok(Number.isFinite(miA.pooledData[j][i]), `missing cell ${j},${i} is imputed`);
    }
  }
}
checks += 1;

// PMM donors are drawn from observed values only, so the pooled imputation
// must stay within the observed range of each column.
for (let j = 0; j < missingData.length; j++) {
  const observed = missingData[j].filter(Number.isFinite);
  const lo = Math.min(...observed);
  const hi = Math.max(...observed);
  for (let i = 0; i < missingData[j].length; i++) {
    if (!Number.isFinite(missingData[j][i])) {
      const value = miA.pooledData[j][i];
      assert.ok(
        value >= lo && value <= hi,
        `pmm pooled cell ${j},${i} within observed range [${lo}, ${hi}]`
      );
    }
  }
}
checks += 1;

// The exact linear structure (col1 = col3/3, col2 = 2*col1) must be recovered
// by the pooled estimate when using the regression method (PMM cannot emit a
// value that was never observed, so donor-based recovery is bounded by the
// observed range).
const miLin = engine.multipleImputationMice(missingData, "regression", 20, 20, 7);
assert.ok(
  Math.abs(miLin.pooledData[0][2] - 3) / 3 < 0.05,
  "col1 = col3/3 recovered by regression imputation"
);
assert.ok(
  Math.abs(miLin.pooledData[1][3] - 8) / 8 < 0.05,
  "col2 = 2*col1 recovered by regression imputation"
);
checks += 2;

// Rubin's summaries: shape, counts, and within/between variance structure.
assert.equal(miA.columnSummaries.length, 3, "one summary per column");
assert.equal(miA.columnSummaries[0].missingCount, 1, "column 0 has one missing cell");
assert.ok(Number.isFinite(miA.columnSummaries[0].qbar), "qbar is finite");
assert.ok(miA.columnSummaries[0].betweenVariance >= 0, "between-imputation variance non-negative");
assert.ok(miA.columnSummaries[0].totalVariance >= 0, "total variance non-negative");
assert.ok(miA.columnSummaries[0].fractionMissingInfo <= 1, "FMI bounded by 1");
checks += 6;

// Validation and method clamping.
assert.throws(
  () => engine.multipleImputationMice([[1, NaN]], "pmm", 3),
  /at least 2 columns/,
  "rejects single-column input"
);
const regressionMi = engine.multipleImputationMice(missingData, "regression", 2, 4, 11);
assert.equal(regressionMi.method, "regression", "regression method honored");
assert.equal(regressionMi.m, 2, "m clamped/set to 2");
assert.equal(regressionMi.imputedDatasets.length, 2, "two datasets produced");
assert.ok(Number.isFinite(regressionMi.pooledData[0][2]), "regression pooled cell finite");
checks += 5;

// ---------------------------------------------------------------------------
console.log(`\nStatistics validation passed (${checks} checks vs library references)\n`);
