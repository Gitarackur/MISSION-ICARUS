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
        performPCA,
        adjustPValues,
        limmaBatchAnalysis,
      } from "./src/app-layer/statistics/utils/statistical-engine.ts";
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
console.log(`\nStatistics validation passed (${checks} checks vs library references)\n`);
