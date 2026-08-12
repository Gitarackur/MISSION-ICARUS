import { jStat } from "jstat";
import * as ss from "simple-statistics";
import {
  KMeansResult,
  HierarchicalClusteringResult,
  PCAClusteringResult,
  LimmaBatchGeneResult,
  LIMMAResult,
  PValueAdjustmentMethod,
  NormalizationMethod,
  ReporterIonNormalizationResult,
  PurityCorrectionResult,
  SortResult,
  filterMatchType,
  FilterByNameResult,
  filterType,
  FilterByTypeResult,
  AddRowResult,
  DeleteRowResult,
  RenameRowResult,
  AddColumnResult,
  MissingFilterMode,
  OutlierFilterMethod,
  PCAResult,
  PLSDAResult,
  TSNEResult,
  PTMAnnotation,
  RemovePTMResult,
  FTestResult,
  ChiSquareTestResult,
  ZScoreOutlierResult,
  IQROutlierResult,
  GrubbsTestResult,
  ExprToken,
  AddPTMResult,
  ANOVAResult,
  TTestResult,
  MultipleImputationResult,
  MiceMethod,
  MiceColumnSummary,
  FoldChangeResult,
  OLSFit,
} from "@/domain/statistics/index.types";
import { EPSILON, EXPR_CONSTANTS, EXPR_FUNCTIONS, EXPR_PRECEDENCE } from "@/app-layer/statistics/constants";



const finiteNumbers = (values: number[]) => values.filter(Number.isFinite);

const clampProbability = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
};

// Calculates the mean, median, and standard deviation of an array of numbers
export function mean(values: number[]) {
  const finiteValues = finiteNumbers(values);
  if (!finiteValues.length) return 0;
  return ss.mean(finiteValues);
}

// Calculates the median of an array of numbers
export function median(values: number[]) {
  const v = finiteNumbers(values);
  if (!v.length) return 0;
  return ss.median(v);
}

// Calculates sample variance by default. Use sample=false for population variance.
export function variance(values: number[], sample = true) {
  const finiteValues = finiteNumbers(values);
  if (finiteValues.length < 2) return 0;
  return sample ? ss.sampleVariance(finiteValues) : ss.variance(finiteValues);
}

// Calculates sample standard deviation by default. Use sample=false for population stddev.
export function stddev(values: number[], sample = true) {
  const finiteValues = finiteNumbers(values);
  if (finiteValues.length < 2) return 0;
  return sample
    ? ss.sampleStandardDeviation(finiteValues)
    : ss.standardDeviation(finiteValues);
}

// Calculates the sum of an array of numbers
export function sum(values: number[]) {
  const finiteValues = finiteNumbers(values);
  return finiteValues.length ? ss.sum(finiteValues) : 0;
}

// calculate the normalization of the data
export function normalization(values: number[][]) {
  // max-min normalization: (x - min) / (max - min)
  return values.map((firstNestedValue) => {
    const finiteValues = finiteNumbers(firstNestedValue);
    if (finiteValues.length === 0) return firstNestedValue.map(() => 0);

    const max_value = Math.max(...finiteValues);
    const min_value = Math.min(...finiteValues);
    const range = max_value - min_value;

    return firstNestedValue.map((value) => {
      if (!Number.isFinite(value)) return 0;
      return range === 0 ? 0 : (value - min_value) / range;
    });
  });
}

//Imputation of Mean
export const imputeMeanColumn = (col: number[]): number[] => {
  // compute mean from observed (finite) values only
  const obs = col.filter((x) => Number.isFinite(x));
  if (obs.length === 0) return col.slice(); // nothing to impute (all NaN) → return as-is
  const m = mean(obs);
  // replace missing (NaN / ±Infinity) with mean
  return col.map((x) => (Number.isFinite(x) ? x : m));
};

/* ============================
 * Imputation helpers (export)
 * ============================ */

/** Median of a numeric column, ignoring NaN. Returns NaN if no finite values. */
export function columnMedian(col: number[]): number {
  const vals = finiteNumbers(col);
  if (vals.length === 0) return NaN;
  return ss.median(vals);
}

/** Impute a column by its median (fill only non-finite values). */
export function imputeMedianColumn(col: number[]): number[] {
  const med = columnMedian(col);
  if (!Number.isFinite(med)) return col.slice(); // nothing to impute
  return col.map((x) => (Number.isFinite(x) ? x : med));
}

/* ---------- KNN imputation ---------- */

/** Euclidean distance treating any non-finite value as a blocker (∞ distance). */
export function euclideanDist(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i],
      y = b[i];
    if (!Number.isFinite(x) || !Number.isFinite(y))
      return Number.POSITIVE_INFINITY;
    const d = x - y;
    s += d * d;
  }
  return Math.sqrt(s);
}

/**
 * KNN impute a target column using feature columns.
 * @param targetCol column vector (length = nRows)
 * @param featureCols array of feature columns (length = nFeatures), each length = nRows
 * @param k number of neighbors (default 5)
 * @param weighted inverse-distance weighting if true; otherwise simple mean
 * @returns a new target column with missing entries imputed
 */
export function knnImputeTarget(
  targetCol: number[],
  featureCols: number[][],
  k = 5,
  weighted = true
): number[] {
  const nRows = targetCol.length;
  const nFeat = featureCols.length;
  if (nFeat === 0) return targetCol.slice();

  // indices of observed/missing target values
  const observedIdx: number[] = [];
  const missingIdx: number[] = [];
  for (let i = 0; i < nRows; i++) {
    (Number.isFinite(targetCol[i]) ? observedIdx : missingIdx).push(i);
  }
  if (missingIdx.length === 0 || observedIdx.length === 0)
    return targetCol.slice();

  // build observed feature rows + observed targets
  const Xobs: number[][] = observedIdx.map((ri) =>
    Array.from({ length: nFeat }, (_, f) => featureCols[f][ri])
  );
  const yobs: number[] = observedIdx.map((ri) => targetCol[ri] as number);

  const yMean = yobs.reduce((a, b) => a + b, 0) / yobs.length;
  const EPS = 1e-8;
  const out = targetCol.slice();

  for (const ri of missingIdx) {
    const xq = Array.from({ length: nFeat }, (_, f) => featureCols[f][ri]);

    // distances to observed rows
    const pairs = Xobs.map((xo, idx) => ({
      d: euclideanDist(xq, xo),
      y: yobs[idx],
    }))
      .filter((p) => Number.isFinite(p.d))
      .sort((a, b) => a.d - b.d);

    if (pairs.length === 0) {
      out[ri] = yMean; // fallback if no finite neighbors
      continue;
    }

    const kEff = Math.max(1, Math.min(k, pairs.length));
    const neighbors = pairs.slice(0, kEff);

    if (!weighted) {
      out[ri] = neighbors.reduce((s, p) => s + p.y, 0) / neighbors.length;
    } else {
      let num = 0,
        den = 0;
      for (const { d, y } of neighbors) {
        const w = 1 / (d + EPS);
        num += w * y;
        den += w;
      }
      out[ri] = num / den;
    }
  }

  return out;
}

/** Impute a column with zeros (fill only non-finite values). */
export function imputeZeroColumn(col: number[]): number[] {
  return col.map((x) => (Number.isFinite(x) ? x : 0));
}

/* ============================================================
 * MULTIPLE IMPUTATION - MICE (Chained Equations) + Rubin's rules
 * ============================================================ */

/**
 * Deterministic seeded PRNG (mulberry32). Used so multiple imputation runs
 * are reproducible when a seed is supplied.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample via Box-Muller transform (uses the given PRNG). */
function gaussianSample(rng: () => number, mean = 0, std = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * std;
}

/** Fisher-Yates shuffle with a seeded PRNG. */
function seededShuffle<T>(values: T[], rng: () => number): T[] {
  const shuffled = [...values];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Solve an N x N linear system A x = b by Gaussian elimination with pivoting. */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, index) => [...row, b[index]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivotRow][col])) pivotRow = r;
    }
    if (Math.abs(M[pivotRow][col]) < 1e-12) return new Array(n).fill(0);
    [M[col], M[pivotRow]] = [M[pivotRow], M[col]];

    const pivot = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= pivot;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }

  return M.map((row) => row[n]);
}

/** Gauss-Jordan matrix inversion; returns null when the matrix is singular. */
function invertMatrix(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  const aug = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);
  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivotRow][col])) pivotRow = r;
    }
    if (Math.abs(aug[pivotRow][col]) < 1e-12) return null;
    [aug[col], aug[pivotRow]] = [aug[pivotRow], aug[col]];
    const pivot = aug[col][col];
    for (let c = 0; c < 2 * n; c++) aug[col][c] /= pivot;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      for (let c = 0; c < 2 * n; c++) aug[r][c] -= factor * aug[col][c];
    }
  }
  return aug.map((row) => row.slice(n));
}

/** Cholesky factorization (lower triangle L with matrix = L L^T). */
function choleskyDecompose(matrix: number[][]): number[][] {
  const n = matrix.length;
  const lower = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = matrix[i][j];
      for (let k = 0; k < j; k++) sum -= lower[i][k] * lower[j][k];
      if (i === j) {
        lower[i][j] = Math.sqrt(sum > 0 ? sum : 0);
      } else {
        lower[i][j] = sum / (lower[j][j] || 1);
      }
    }
  }
  return lower;
}

/** Gamma draw via the Marsaglia-Tsang method (shape > 0, default scale 1). */
function gammaSample(rng: () => number, shape: number, scale = 1): number {
  if (shape < 1) {
    return gammaSample(rng, shape + 1, scale) * Math.pow(rng(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    const x = gaussianSample(rng);
    const v = 1 + c * x;
    if (v <= 0) continue;
    const cubed = v * v * v;
    const u = rng();
    if (
      u < 1 - 0.0331 * x * x * x * x ||
      Math.log(u) < 0.5 * x * x + d * (1 - cubed + Math.log(cubed))
    ) {
      return scale * d * cubed;
    }
  }
}

/** Chi-square draw used for the scaled-inverse-chi-square residual prior. */
function chiSquareSample(rng: () => number, degreesOfFreedom: number): number {
  return 2 * gammaSample(rng, degreesOfFreedom / 2);
}


/**
 * Ordinary least squares fit of `target` on the standardized predictor
 * columns. Predictor means/stds are returned so predictions can be computed on
 * the same centered/scaled scale.
 */
function olsFit(
  targetObs: number[],
  predictorObs: number[][],
  includeCovariance = true,
): OLSFit & { means: number[]; stds: number[] } {
  const predictorCount = predictorObs.length;
  const standardize = (column: number[]) => {
    const valid = column.filter(Number.isFinite);
    const location = valid.length ? ss.mean(valid) : 0;
    const scale =
      valid.length > 1 ? Math.abs(ss.sampleStandardDeviation(valid)) : 1;
    return { location, scale: scale > 0 ? scale : 1 };
  };

  const summary = predictorObs.map((column) => standardize(column));
  const designRows: number[][] = targetObs.map((_, rowPos) => [
    1,
    ...predictorObs.map((column, p) => {
      const { location, scale } = summary[p];
      return (column[rowPos] - location) / scale;
    }),
  ]);

  const p = predictorCount;
  const A: number[][] = Array.from({ length: p + 1 }, () =>
    new Array(p + 1).fill(0),
  );
  const rhs: number[] = new Array(p + 1).fill(0);
  const n = targetObs.length;

  for (let row = 0; row < n; row++) {
    const x = designRows[row];
    for (let a = 0; a <= p; a++) {
      rhs[a] += x[a] * targetObs[row];
      for (let c = 0; c <= p; c++) A[a][c] += x[a] * x[c];
    }
  }

  // Ridge stabilization keeps the normal equations invertible when predictors
  // are (near-)collinear; the intercept is not penalized.
  for (let a = 1; a <= p; a++) A[a][a] += 1e-4;

  const beta = solveLinearSystem(A, rhs);
  let residualSquares = 0;
  for (let row = 0; row < n; row++) {
    let predicted = 0;
    const x = designRows[row];
    for (let a = 0; a <= p; a++) predicted += beta[a] * x[a];
    const residual = targetObs[row] - predicted;
    residualSquares += residual * residual;
  }

  const degreesOfFreedom = n - (p + 1);
  const residualStd =
    degreesOfFreedom > 0 ? Math.sqrt(residualSquares / degreesOfFreedom) : 0;

  return {
    intercept: beta[0],
    coefficients: beta.slice(1),
    residualStd: Number.isFinite(residualStd) ? residualStd : 0,
    means: summary.map((s) => s.location),
    stds: summary.map((s) => s.scale),
    betaFull: beta,
    // PMM only needs point predictions. Avoid the cubic matrix inversion
    // unless Bayesian-regression posterior draws actually use it.
    covariance: includeCovariance ? invertMatrix(A) : null,
    residualDegreesOfFreedom: degreesOfFreedom,
    residualSumSquares: residualSquares,
  };
}

/** Evaluate a fitted OLS model for one row of standardized predictors. */
function olsPredict(
  fit: OLSFit & { means: number[]; stds: number[] },
  rawPredictors: number[],
): number {
  let predicted = fit.intercept;
  for (let p = 0; p < fit.coefficients.length; p++) {
    const v = rawPredictors[p];
    if (!Number.isFinite(v)) return NaN;
    predicted += fit.coefficients[p] * ((v - fit.means[p]) / fit.stds[p]);
  }
  return predicted;
}

/**
 * Multiple imputation via chained equations (MICE). Generates `m` complete
 * column-major datasets, imputing missing values one column at a time using
 * either predictive mean matching (`pmm`, default) or Bayesian linear
 * regression (`regression`). The regression step draws the residual variance
 * and regression coefficients from their scaled-inverse-chi-square /
 * multivariate-normal posteriors before adding residual noise; PMM samples
 * uniformly from the `k` closest observed donors (bounded k). Pooled point
 * estimates are combined with Rubin's rules.
 */
export async function multipleImputationMice(
  data: number[][],
  method: MiceMethod = "pmm",
  m = 5,
  maxIterations = 10,
  seed?: number,
  onYield?: (
    progress: number,
    detail: string,
  ) => Promise<void> | void,
): Promise<MultipleImputationResult> {
  if (!data || data.length < 2) {
    throw new Error(
      "Multiple imputation requires at least 2 columns (target + >=1 predictor).",
    );
  }

  const clampedM = Math.max(2, Math.floor(m));
  const clampedIterations = Math.max(1, Math.floor(maxIterations));
  const rng = mulberry32(seed ?? Date.now());
  const columnCount = data.length;
  const rowCount = Math.max(...data.map((column) => column.length));

  const missingCount = data.reduce(
    (total, column) =>
      total +
      column.slice(0, rowCount).filter((value) => !Number.isFinite(value)).length,
    0,
  );

  if (missingCount === 0) {
    const pooledData = data.map((column) => [...column]);
    const imputedDatasets = Array.from({ length: clampedM }, () =>
      pooledData.map((column) => [...column]),
    );
    const columnSummaries: MiceColumnSummary[] = pooledData.map(
      (column, index) => {
        const finite = column.filter(Number.isFinite);
        const columnMean = finite.length ? ss.mean(finite) : NaN;
        const columnVariance =
          finite.length > 1 ? ss.sampleVariance(finite) : 0;
        return {
          columnName: `column_${index + 1}`,
          observedCount: finite.length,
          missingCount: 0,
          missingRatio: 0,
          qbar: Number.isFinite(columnMean) ? columnMean : 0,
          withinVariance: finite.length > 0 ? columnVariance / finite.length : 0,
          betweenVariance: 0,
          totalVariance: finite.length > 0 ? columnVariance / finite.length : 0,
          relativeIncreaseVariance: 0,
          fractionMissingInfo: 0,
          nu: finite.length - 1,
        };
      },
    );
    return {
      method,
      m: clampedM,
      maxIterations: clampedIterations,
      seed,
      pooledData,
      imputedDatasets,
      columnSummaries,
      missingCount: 0,
      imputedCount: 0,
      iterationsPerformed: 0,
    };
  }

  // Track which rows are missing per column.
  const missingIndices: number[][] = data.map((_, j) => {
    const indices: number[] = [];
    for (let i = 0; i < rowCount; i++) {
      if (!Number.isFinite(data[j][i])) indices.push(i);
    }
    return indices;
  });

  // Initial fill: column mean (or 0 for fully-missing columns).
  const initialFill = data.map((_, j) => {
    const finite = data[j].filter(Number.isFinite);
    return finite.length ? ss.mean(finite) : 0;
  });

  const imputedDatasets: number[][][] = [];
  let iterationsPerformed = 0;

  const totalColumnWork = clampedM * clampedIterations * columnCount;
  let completedColumnWork = 0;

  for (let datasetIndex = 0; datasetIndex < clampedM; datasetIndex++) {
    const work = data.map((column, j) => {
      const filled = [...column];
      for (const i of missingIndices[j]) filled[i] = initialFill[j];
      return filled;
    });

    for (let iteration = 0; iteration < clampedIterations; iteration++) {
      iterationsPerformed = Math.max(iterationsPerformed, iteration + 1);
      const columnOrder = seededShuffle(
        Array.from({ length: columnCount }, (_, j) => j),
        rng,
      );

      for (const j of columnOrder) {
        completedColumnWork += 1;
        // Cooperative yield: hand control back to the worker's event loop so a
        // liveness heartbeat can be posted. A no-op when no hook is supplied.
        if (onYield && completedColumnWork % 4 === 0) {
          await onYield(
            completedColumnWork / totalColumnWork,
            `dataset ${datasetIndex + 1}/${clampedM}, iteration ${iteration + 1}/${clampedIterations}, column ${j + 1}/${columnCount}`,
          );
        }
        const missing = missingIndices[j];
        if (missing.length === 0) continue;

        // Predictor columns: every column except j must be finite for a row
        // to contribute to the regression (complete-row case only).
        const predictorIndices = Array.from(
          { length: columnCount },
          (_, k) => k,
        ).filter((k) => k !== j);

        const observedRows: number[] = [];
        for (let i = 0; i < rowCount; i++) {
          if (!Number.isFinite(data[j][i])) continue;
          let complete = true;
          for (const k of predictorIndices) {
            if (!Number.isFinite(work[k][i])) {
              complete = false;
              break;
            }
          }
          if (complete) observedRows.push(i);
        }

        if (observedRows.length < 2) continue;

        const predictorObs = predictorIndices.map((k) =>
          observedRows.map((i) => work[k][i] as number),
        );
        const targetObs = observedRows.map((i) => work[j][i] as number);
        const fit = olsFit(targetObs, predictorObs, method === "regression");

        // Pre-compute observed predicted values for PMM donor pool.
        let observedPredictions: { predicted: number; value: number }[] = [];
        if (method === "pmm") {
          observedPredictions = observedRows
            .map((i) => ({
              predicted: olsPredict(
                fit,
                predictorIndices.map((k) => work[k][i] as number),
              ),
              value: work[j][i] as number,
            }))
            .filter((entry) => Number.isFinite(entry.predicted))
            .sort((a, b) => a.predicted - b.predicted);
        }

        const donorPool = Math.min(5, observedPredictions.length);

        // One posterior draw over (residual variance, coefficients) per column
        // per iteration, reused across that column's missing cells.
        let posterior: { sigma: number; betaFull: number[] } | null = null;
        if (method === "regression" && fit.covariance) {
          const degreesOfFreedom = fit.residualDegreesOfFreedom;
          if (degreesOfFreedom > 0 && fit.residualSumSquares > 0) {
            const chiSquared = chiSquareSample(rng, degreesOfFreedom);
            const posteriorSigma =
              chiSquared > 0
                ? fit.residualStd * Math.sqrt(degreesOfFreedom / chiSquared)
                : fit.residualStd;
            const lower = choleskyDecompose(fit.covariance);
            // One shared standard-normal vector per posterior draw keeps the
            // cross-coefficient covariance: shift = posteriorSigma * L z.
            const posteriorDeviates = lower.map(() => gaussianSample(rng));
            const shifts = lower.map(
              (row) =>
                row.reduce((sum, value, k) => sum + value * posteriorDeviates[k], 0) *
                posteriorSigma,
            );
            posterior = {
              sigma: posteriorSigma,
              betaFull: fit.betaFull.map((betaValue, idx) => betaValue + (shifts[idx] ?? 0)),
            };
          }
        }

        for (const i of missing) {
          let predictorsFinite = true;
          const rawPredictors = predictorIndices.map((k) => work[k][i] as number);
          for (const value of rawPredictors) {
            if (!Number.isFinite(value)) {
              predictorsFinite = false;
              break;
            }
          }
          if (!predictorsFinite) continue;

          if (method === "regression") {
            let predicted = olsPredict(fit, rawPredictors);
            let residualStd = fit.residualStd;
            if (posterior) {
              predicted = [
                1,
                ...rawPredictors.map((v, p) => (v - fit.means[p]) / fit.stds[p]),
              ].reduce(
                (sum: number, x, idx) => sum + x * posterior.betaFull[idx],
                0,
              );
              residualStd = posterior.sigma;
            }
            if (Number.isFinite(predicted)) {
              work[j][i] = gaussianSample(rng, predicted, residualStd);
            }
          } else {
            const predicted = olsPredict(fit, rawPredictors);
            if (!Number.isFinite(predicted) || donorPool === 0) continue;

            // Donor predictions are sorted once per fit. Binary search narrows
            // each missing cell to at most 2k+1 candidates instead of scanning
            // the full observed donor set.
            let low = 0;
            let high = observedPredictions.length;
            while (low < high) {
              const mid = (low + high) >>> 1;
              if (observedPredictions[mid].predicted < predicted) low = mid + 1;
              else high = mid;
            }
            const start = Math.max(0, low - donorPool);
            const end = Math.min(
              observedPredictions.length,
              low + donorPool + 1,
            );
            const ranked = observedPredictions
              .slice(start, end)
              .sort(
                (a, b) =>
                  Math.abs(a.predicted - predicted) -
                  Math.abs(b.predicted - predicted),
              )
              .slice(0, donorPool);
            if (ranked.length === 0) continue;

            // Uniform draw from the closest donors.
            work[j][i] = ranked[Math.floor(rng() * ranked.length)].value;
          }
        }
      }
    }

    imputedDatasets.push(
      work.map((column) => column.map((value) => (Number.isFinite(value) ? value : NaN))),
    );
  }

  // Pool the m datasets cell-by-cell (Rubin's point estimate for each cell).
  const pooledData: number[][] = data.map((_, j) => {
    const pooled: number[] = [];
    for (let i = 0; i < rowCount; i++) {
      const values: number[] = [];
      for (let t = 0; t < clampedM; t++) {
        const value = imputedDatasets[t][j][i];
        if (Number.isFinite(value)) values.push(value);
      }
      pooled.push(values.length ? values.reduce((a, b) => a + b, 0) / values.length : NaN);
    }
    return pooled;
  });

  // Per-column Rubin's rules summaries.
  const columnSummaries: MiceColumnSummary[] = data.map((_, j) => {
    const estimates: number[] = [];
    const standardErrors: number[] = [];
    for (let t = 0; t < clampedM; t++) {
      const finite = imputedDatasets[t][j].filter(Number.isFinite);
      if (!finite.length) {
        estimates.push(NaN);
        standardErrors.push(0);
        continue;
      }
      const columnMean = ss.mean(finite);
      const columnVariance =
        finite.length > 1 ? ss.sampleVariance(finite) : 0;
      estimates.push(columnMean);
      standardErrors.push(columnVariance / finite.length);
    }

    const finiteEstimates = estimates.filter(Number.isFinite);
    if (!finiteEstimates.length) {
      return {
        columnName: `column_${j + 1}`,
        observedCount: 0,
        missingCount: missingIndices[j].length,
        missingRatio: 1,
        qbar: 0,
        withinVariance: 0,
        betweenVariance: 0,
        totalVariance: 0,
        relativeIncreaseVariance: 0,
        fractionMissingInfo: 1,
        nu: 0,
      };
    }

    const qbar = ss.mean(finiteEstimates);
    const uBar = ss.mean(
      standardErrors.filter((value) => Number.isFinite(value)),
    );
    const b =
      clampedM > 1
        ? finiteEstimates.reduce(
            (sum, q) => sum + (q - qbar) * (q - qbar),
            0,
          ) /
          (clampedM - 1)
        : 0;

    const totalVariance =
      uBar + b + (clampedM > 1 ? b / clampedM : 0);
    const relativeIncreaseVariance =
      uBar > 0 && clampedM > 1 ? ((1 + 1 / clampedM) * b) / uBar : 0;

    // Rubin's fraction of missing information (lambda).
    const lambda =
      totalVariance > 0
        ? ((1 + 1 / clampedM) * b) / totalVariance
        : 0;
    const dfOld =
      clampedM > 1 && lambda > 0
        ? (clampedM - 1) / (lambda * lambda)
        : clampedM - 1;
    const completeCaseCount =
      data[j].filter(Number.isFinite).length + missingIndices[j].length;
    const nuComplete = Math.max(1, completeCaseCount - 1);
    const dfObs = ((nuComplete + 1) / (nuComplete + 3)) * nuComplete * (1 - lambda);
    const nu = dfOld + dfObs > 0 ? 1 / (1 / dfOld + 1 / dfObs) : 0;

    return {
      columnName: `column_${j + 1}`,
      observedCount: data[j].filter(Number.isFinite).length,
      missingCount: missingIndices[j].length,
      missingRatio: rowCount > 0 ? missingIndices[j].length / rowCount : 0,
      qbar,
      withinVariance: uBar,
      betweenVariance: b,
      totalVariance,
      relativeIncreaseVariance,
      fractionMissingInfo: lambda,
      nu,
    };
  });

  let imputedCount = 0;
  missingIndices.forEach((indices, j) => {
    imputedCount += indices.filter((i) => {
      return Number.isFinite(pooledData[j][i]);
    }).length;
  });

  return {
    method,
    m: clampedM,
    maxIterations: clampedIterations,
    seed,
    pooledData,
    imputedDatasets,
    columnSummaries,
    missingCount,
    imputedCount,
    iterationsPerformed,
  };
}

// Calculate moving average for time series data
export function movingAverage(
  values: number[],
  windowSize: number = 5
): number[] {
  if (!values.length || windowSize <= 0) return [];

  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < windowSize - 1) {
      // For initial values, use all available data up to current point
      const slice = finiteNumbers(values.slice(0, i + 1));
      result.push(slice.length ? mean(slice) : 0);
    } else {
      // Calculate moving average for the window
      const slice = finiteNumbers(values.slice(i - windowSize + 1, i + 1));
      result.push(slice.length ? mean(slice) : 0);
    }
  }
  return result;
}

// Calculate rolling standard deviation for time series data
export function rollingStdDev(
  values: number[],
  windowSize: number = 5
): number[] {
  if (!values.length || windowSize <= 0) return [];

  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < windowSize - 1) {
      // For initial values, use all available data up to current point
      const slice = values.slice(0, i + 1);
      result.push(stddev(slice));
    } else {
      // Calculate rolling standard deviation for the window
      const slice = values.slice(i - windowSize + 1, i + 1);
      result.push(stddev(slice));
    }
  }
  return result;
}

// T-Test implementation (already exists but enhanced)
export function tTestTwoSample(
  group1: number[],
  group2: number[]
): TTestResult {
  const values1 = finiteNumbers(group1);
  const values2 = finiteNumbers(group2);

  if (values1.length < 2 || values2.length < 2) {
    throw new Error("Both groups must have at least two finite values");
  }

  const mean1 = mean(values1);
  const mean2 = mean(values2);
  const std1 = stddev(values1);
  const std2 = stddev(values2);

  const n1 = values1.length;
  const n2 = values2.length;
  const variance1 = variance(values1);
  const variance2 = variance(values2);
  const standardErrorSquared = variance1 / n1 + variance2 / n2;

  const tStatistic =
    standardErrorSquared <= EPSILON
      ? mean1 === mean2
        ? 0
        : (mean1 > mean2 ? 1 : -1) * Number.POSITIVE_INFINITY
      : (mean1 - mean2) / Math.sqrt(standardErrorSquared);

  const degreesOfFreedomNumerator = standardErrorSquared ** 2;
  const degreesOfFreedomDenominator =
    variance1 ** 2 / (n1 ** 2 * (n1 - 1)) +
    variance2 ** 2 / (n2 ** 2 * (n2 - 1));
  const degreesOfFreedom =
    degreesOfFreedomDenominator <= EPSILON
      ? n1 + n2 - 2
      : degreesOfFreedomNumerator / degreesOfFreedomDenominator;

  const pValue = Number.isFinite(tStatistic)
    ? 2 * (1 - jStat.studentt.cdf(Math.abs(tStatistic), degreesOfFreedom))
    : mean1 === mean2
    ? 1
    : 0;

  return {
    tStatistic,
    pValue: clampProbability(pValue),
    degreesOfFreedom,
    mean1,
    mean2,
    std1,
    std2,
  };
}

// ANOVA (One-way Analysis of Variance)
export function oneWayANOVA(groups: number[][]): ANOVAResult {
  const cleanedGroups = groups.map(finiteNumbers).filter((group) => group.length > 0);

  if (cleanedGroups.length < 2) {
    throw new Error("ANOVA requires at least 2 groups");
  }

  const k = cleanedGroups.length; // number of groups
  const groupMeans = cleanedGroups.map((group) => mean(group));
  const groupSizes = cleanedGroups.map((group) => group.length);
  const totalSize = groupSizes.reduce((sum, n) => sum + n, 0);

  if (totalSize <= k) {
    throw new Error("ANOVA requires at least one residual degree of freedom");
  }

  // Calculate grand mean
  const allValues = cleanedGroups.flat();
  const grandMean = mean(allValues);

  // Sum of squares between groups (SSB)
  const ssb = groupSizes.reduce((sum, ni, i) => {
    return sum + ni * Math.pow(groupMeans[i] - grandMean, 2);
  }, 0);

  // Sum of squares within groups (SSW)
  const ssw = cleanedGroups.reduce((sum, group, i) => {
    return (
      sum +
      group.reduce((groupSum, value) => {
        return groupSum + Math.pow(value - groupMeans[i], 2);
      }, 0)
    );
  }, 0);

  const dfBetween = k - 1;
  const dfWithin = totalSize - k;

  const msBetween = ssb / dfBetween;
  const msWithin = ssw / dfWithin;

  const fStatistic =
    msWithin <= EPSILON
      ? msBetween <= EPSILON
        ? 0
        : Number.POSITIVE_INFINITY
      : msBetween / msWithin;

  const pValue = Number.isFinite(fStatistic)
    ? 1 - jStat.centralF.cdf(fStatistic, dfBetween, dfWithin)
    : 0;

  return {
    fStatistic,
    pValue: clampProbability(pValue),
    dfBetween,
    dfWithin,
    msBetween,
    msWithin,
    grandMean,
  };
}

// Fold Change calculation
export function calculateFoldChange(
  group1: number[],
  group2: number[]
): FoldChangeResult {
  const values1 = finiteNumbers(group1);
  const values2 = finiteNumbers(group2);

  if (values1.length === 0 || values2.length === 0) {
    throw new Error("Both groups must have at least one finite value");
  }

  const mean1 = mean(values1);
  const mean2 = mean(values2);

  if (mean1 <= 0 || mean2 <= 0) {
    throw new Error(
      "Fold change requires positive treatment and control means"
    );
  }

  const ratio = mean1 / mean2;
  const foldChange = ratio >= 1 ? ratio : -1 / ratio;
  const log2FoldChange = Math.log2(ratio);

  return {
    foldChange,
    log2FoldChange,
    mean1,
    mean2,
    ratio,
  };
}

// LIMMA (Linear Models for Microarray Data) - Simplified implementation
export function limmaAnalysis(
  treatmentGroup: number[],
  controlGroup: number[]
): LIMMAResult {
  const treatmentValues = finiteNumbers(treatmentGroup);
  const controlValues = finiteNumbers(controlGroup);

  if (treatmentValues.length < 2 || controlValues.length < 2) {
    throw new Error("Both groups must have at least two finite values");
  }

  const meanTreatment = mean(treatmentValues);
  const meanControl = mean(controlValues);

  if (meanTreatment <= 0 || meanControl <= 0) {
    throw new Error("LIMMA log fold change requires positive group means");
  }

  // Log2 fold change
  const logFoldChange = Math.log2(meanTreatment / meanControl);

  // Average expression
  const averageExpression = (meanTreatment + meanControl) / 2;

  // Moderated t-statistic (simplified)
  const pooledVar = (variance(treatmentValues) + variance(controlValues)) / 2;
  const standardError = Math.sqrt(
    pooledVar * (1 / treatmentValues.length + 1 / controlValues.length)
  );
  const tStatistic =
    standardError <= EPSILON
      ? meanTreatment === meanControl
        ? 0
        : (meanTreatment > meanControl ? 1 : -1) * Number.POSITIVE_INFINITY
      : (meanTreatment - meanControl) / standardError;

  // P-value
  const degreesOfFreedom = treatmentValues.length + controlValues.length - 2;
  const pValue = Number.isFinite(tStatistic)
    ? 2 * (1 - jStat.studentt.cdf(Math.abs(tStatistic), degreesOfFreedom))
    : meanTreatment === meanControl
    ? 1
    : 0;

  // Adjusted p-value. This function tests a single gene against a single
  // control group (one p-value per call), so there is no family of tests to
  // run a real Benjamini-Hochberg correction over. With N=1 the adjusted
  // p-value equals the raw p-value; the previous p*1.5 heuristic was not a
  // valid BH correction, so it is replaced here.
  const adjustedPValue = pValue;

  return {
    logFoldChange,
    pValue: clampProbability(pValue),
    adjustedPValue: clampProbability(adjustedPValue),
    tStatistic,
    averageExpression,
  };
}

/**
 * Adjust a family of p-values for multiple testing.
 * - "BH": Benjamini-Hochberg step-up (controls FDR).
 * - "bonferroni": classic Bonferroni (p * n, capped at 1).
 * Non-finite p-values are passed through unchanged and excluded from ranking.
 */
export function adjustPValues(
  pValues: number[],
  method: PValueAdjustmentMethod = "BH"
): number[] {
  const n = pValues.length;
  if (n === 0) return [];

  if (method === "bonferroni") {
    return pValues.map((p) => (Number.isFinite(p) ? Math.min(1, p * n) : p));
  }

  // Benjamini-Hochberg step-up: sort ascending, q_i = p_i * n / rank_i,
  // then enforce monotonicity from the largest p-value down.
  const finite: Array<{ p: number; i: number }> = [];
  const adjusted: number[] = new Array(n).fill(NaN);
  pValues.forEach((p, i) => {
    if (Number.isFinite(p)) finite.push({ p, i });
  });
  finite.sort((a, b) => a.p - b.p);

  let prev = 1;
  for (let k = finite.length - 1; k >= 0; k--) {
    const { p, i } = finite[k];
    const rank = k + 1;
    const q = Math.min(1, (p * n) / rank);
    prev = Math.min(prev, q);
    adjusted[i] = prev;
  }
  return adjusted;
}

/**
 * Real per-gene LIMMA-style differential expression across a batch of genes.
 * Each row of the matrices is one gene; each column is one sample (replicate).
 * Raw p-values are computed per gene (moderated t-statistic), then adjusted
 * across the whole family with BH or Bonferroni.
 */
export function limmaBatchAnalysis(
  treatmentMatrix: number[][],
  controlMatrix: number[][],
  geneNames: string[] = [],
  adjustmentMethod: PValueAdjustmentMethod = "BH"
): LimmaBatchGeneResult[] {
  const geneCount = treatmentMatrix.length;
  const results: LimmaBatchGeneResult[] = [];
  const pValues: number[] = [];

  for (let g = 0; g < geneCount; g++) {
    const treatment = finiteNumbers(treatmentMatrix[g]);
    const control = finiteNumbers(controlMatrix[g]);
    const geneName = geneNames[g] ?? `gene_${g + 1}`;

    if (treatment.length < 2 || control.length < 2) {
      results.push({
        geneName,
        logFoldChange: NaN,
        pValue: NaN,
        adjustedPValue: NaN,
        tStatistic: NaN,
        averageExpression: NaN,
      });
      pValues.push(NaN);
      continue;
    }

    try {
      const r = limmaAnalysis(treatment, control);
      results.push({
        geneName,
        logFoldChange: r.logFoldChange,
        pValue: r.pValue,
        adjustedPValue: r.pValue,
        tStatistic: r.tStatistic,
        averageExpression: r.averageExpression,
      });
      pValues.push(r.pValue);
    } catch {
      results.push({
        geneName,
        logFoldChange: NaN,
        pValue: NaN,
        adjustedPValue: NaN,
        tStatistic: NaN,
        averageExpression: NaN,
      });
      pValues.push(NaN);
    }
  }

  const adjusted = adjustPValues(pValues, adjustmentMethod);
  results.forEach((r, i) => {
    r.adjustedPValue = adjusted[i];
  });
  return results;
}

// ===================================================================
// PROTEOMICS - ISOBARIC LABELING FUNCTIONS
// ===================================================================

/**
 * Normalize reporter ion intensities using various methods
 */
export function normalizeReporterIons(
  reporterIonData: number[][],
  method: NormalizationMethod = "median"
): ReporterIonNormalizationResult {
  if (!reporterIonData || reporterIonData.length === 0) {
    throw new Error("Reporter ion data is empty");
  }

  const numChannels = reporterIonData.length;
  const scalingFactors: number[] = [];

  // Calculate normalization factors for each channel
  for (let i = 0; i < numChannels; i++) {
    const channelData = reporterIonData[i].filter(
      (val) => !isNaN(val) && val > 0
    );

    let factor = 1;
    switch (method) {
      case "median":
        factor = median(channelData);
        break;
      case "mean":
        factor = mean(channelData);
        break;
      case "total":
        factor = channelData.reduce((sum, val) => sum + val, 0);
        break;
    }
    scalingFactors.push(factor);
  }

  // Find the reference scaling factor (e.g., median of all factors)
  const referenceScaling = median(scalingFactors);

  // Normalize each channel
  const normalizedData: number[][] = reporterIonData.map((channel, idx) => {
    const scalingRatio = referenceScaling / scalingFactors[idx];
    return channel.map((val) => val * scalingRatio);
  });

  return {
    normalizedData,
    method,
    scalingFactors,
  };
}

/**
 * Correct reporter ion intensities for isotopic impurity
 * Based on TMT/iTRAQ manufacturer's purity correction matrix
 */
export function correctForPurity(
  reporterIonData: number[][],
  purityMatrix?: number[][]
): PurityCorrectionResult {
  if (!reporterIonData || reporterIonData.length === 0) {
    throw new Error("Reporter ion data is empty");
  }

  const numChannels = reporterIonData.length;

  // Default purity matrix for TMT-10plex (example values)
  // In reality, these should come from the manufacturer's certificate
  const defaultPurityMatrix: number[][] = [];
  for (let i = 0; i < numChannels; i++) {
    const row: number[] = [];
    for (let j = 0; j < numChannels; j++) {
      if (i === j) {
        row.push(0.92); // Main isotope purity (~92%)
      } else if (Math.abs(i - j) === 1) {
        row.push(0.04); // Adjacent isotope contamination (~4%)
      } else {
        row.push(0.0); // No contamination from distant isotopes
      }
    }
    defaultPurityMatrix.push(row);
  }

  const matrix = purityMatrix || defaultPurityMatrix;

  // Verify matrix dimensions
  if (matrix.length !== numChannels) {
    throw new Error(
      `Purity matrix dimensions (${matrix.length}x${matrix[0]?.length}) do not match number of channels (${numChannels})`
    );
  }

  // Calculate the inverse of the purity matrix (simplified approach)
  // For production, you'd want to use a proper matrix inversion library
  const correctedData: number[][] = [];

  // Get the number of data points (assuming all channels have same length)
  const numDataPoints = reporterIonData[0].length;

  // For each data point (peptide/protein), correct the reporter ion values
  for (let pointIdx = 0; pointIdx < numDataPoints; pointIdx++) {
    const observedIntensities: number[] = reporterIonData.map(
      (channel) => channel[pointIdx]
    );

    // Simple correction: divide by main diagonal (approximation)
    // For more accurate correction, implement proper matrix inversion
    const correctedIntensities = observedIntensities.map(
      (intensity, channelIdx) => {
        const mainPurity = matrix[channelIdx][channelIdx];
        return intensity / mainPurity;
      }
    );

    // Store corrected values
    for (let channelIdx = 0; channelIdx < numChannels; channelIdx++) {
      if (!correctedData[channelIdx]) {
        correctedData[channelIdx] = [];
      }
      correctedData[channelIdx].push(correctedIntensities[channelIdx]);
    }
  }

  return {
    correctedData,
    purityMatrix: matrix,
    method: "isotopic_purity_correction",
  };
}

/**
 * Calculate TMT/iTRAQ channel ratios
 */
export function calculateChannelRatios(
  reporterIonData: number[][],
  referenceChannelIndex: number = 0
): number[][] {
  if (!reporterIonData || reporterIonData.length === 0) {
    throw new Error("Reporter ion data is empty");
  }

  if (
    referenceChannelIndex < 0 ||
    referenceChannelIndex >= reporterIonData.length
  ) {
    throw new Error(
      `Invalid reference channel index: ${referenceChannelIndex}`
    );
  }

  const referenceChannel = reporterIonData[referenceChannelIndex];
  const numDataPoints = referenceChannel.length;

  const ratios: number[][] = reporterIonData.map((channel, idx) => {
    if (idx === referenceChannelIndex) {
      return new Array(numDataPoints).fill(1.0); // Reference is always 1.0
    }

    return channel.map((value, pointIdx) => {
      const refValue = referenceChannel[pointIdx];
      if (refValue === 0 || isNaN(refValue)) {
        return NaN;
      }
      return value / refValue;
    });
  });

  return ratios;
}

// ===================================================================
// DATA REARRANGEMENT FUNCTIONS
// ===================================================================

/**
 * Sort array along with indices to maintain data integrity
 */
export function sortDataByColumn(
  data: number[][],
  columnIndex: number,
  direction: "asc" | "desc" = "asc"
): SortResult {
  if (!data || data.length === 0) {
    throw new Error("No data to sort");
  }

  if (columnIndex < 0 || columnIndex >= data.length) {
    throw new Error(`Invalid column index: ${columnIndex}`);
  }

  const column = data[columnIndex];
  const n = column.length;

  // Create array of indices
  const indices = Array.from({ length: n }, (_, i) => i);

  // Sort indices based on column values
  indices.sort((a, b) => {
    const valueA = column[a];
    const valueB = column[b];

    // Handle NaN values (put them at the end)
    if (isNaN(valueA)) return 1;
    if (isNaN(valueB)) return -1;

    if (direction === "asc") {
      return valueA - valueB;
    } else {
      return valueB - valueA;
    }
  });

  // Reorder all columns based on sorted indices
  const sortedData = data.map((col) => indices.map((idx) => col[idx]));

  return {
    sortedData,
    sortedIndices: indices,
    sortColumn: `column_${columnIndex}`,
    sortDirection: direction,
  };
}

/**
 * Transpose a 2D data matrix
 */
export function transposeData(data: number[][]): number[][] {
  if (!data || data.length === 0) {
    throw new Error("No data to transpose");
  }

  const rows = data.length;
  const cols = data[0].length;

  const transposed: number[][] = [];

  for (let j = 0; j < cols; j++) {
    const newRow: number[] = [];
    for (let i = 0; i < rows; i++) {
      newRow.push(data[i][j]);
    }
    transposed.push(newRow);
  }

  return transposed;
}

/**
 * Reorder columns based on a new order specification
 */
export function reorderColumns(
  data: number[][],
  newOrder: number[]
): number[][] {
  if (!data || data.length === 0) {
    throw new Error("No data to reorder");
  }

  if (newOrder.length !== data.length) {
    throw new Error(
      `New order length (${newOrder.length}) must match number of columns (${data.length})`
    );
  }

  // Validate that newOrder contains valid indices
  const uniqueIndices = new Set(newOrder);
  if (uniqueIndices.size !== newOrder.length) {
    throw new Error("New order contains duplicate indices");
  }

  for (const idx of newOrder) {
    if (idx < 0 || idx >= data.length) {
      throw new Error(`Invalid column index in new order: ${idx}`);
    }
  }

  // Reorder columns
  return newOrder.map((idx) => data[idx]);
}

// ===================================================================
// COLUMN FILTERING FUNCTIONS
// ===================================================================

/**
 * Filter columns by name pattern
 */
export function filterColumnsByName(
  columnNames: string[],
  data: number[][],
  pattern: string,
  matchType: filterMatchType,
  caseSensitive: boolean = false
): FilterByNameResult {
  if (!columnNames || columnNames.length === 0) {
    throw new Error("No column names provided");
  }

  const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();

  const matchedIndices: number[] = [];
  const filteredColumns: string[] = [];

  columnNames.forEach((colName, index) => {
    const compareString = caseSensitive ? colName : colName.toLowerCase();
    let matches = false;

    switch (matchType) {
      case "contains":
        matches = compareString.includes(searchPattern);
        break;
      case "starts":
        matches = compareString.startsWith(searchPattern);
        break;
      case "ends":
        matches = compareString.endsWith(searchPattern);
        break;
      case "exact":
        matches = compareString === searchPattern;
        break;
    }

    if (matches) {
      matchedIndices.push(index);
      filteredColumns.push(colName);
    }
  });

  const filteredData = matchedIndices.map((idx) => data[idx]);

  return {
    filteredColumns,
    filteredData,
    matchedCount: filteredColumns.length,
  };
}

/**
 * Filter columns by data type
 */

export function filterColumnsByType(
  columnNames: string[],
  data: number[][],
  targetType: filterType
): FilterByTypeResult {
  if (!columnNames || columnNames.length === 0) {
    throw new Error("No column names provided");
  }

  const matchedIndices: number[] = [];
  const filteredColumns: string[] = [];

  data.forEach((column, index) => {
    let matches = false;

    // Check if column matches the target type
    switch (targetType) {
      case "numeric":
        matches = column.every((val) => typeof val === "number" && !isNaN(val));
        break;
      case "integer":
        matches = column.every((val) => Number.isInteger(val));
        break;
      case "float":
        matches = column.some((val) => !Number.isInteger(val) && !isNaN(val));
        break;
      case "positive":
        matches = column.every((val) => val > 0);
        break;
      case "negative":
        matches = column.every((val) => val < 0);
        break;
      case "nonzero":
        matches = column.every((val) => val !== 0);
        break;
    }

    if (matches) {
      matchedIndices.push(index);
      filteredColumns.push(columnNames[index]);
    }
  });

  const filteredData = matchedIndices.map((idx) => data[idx]);

  return {
    filteredColumns,
    filteredData,
    matchedCount: filteredColumns.length,
  };
}

// ===================================================================
// ROW ANNOTATION/MANIPULATION FUNCTIONS
// ===================================================================

/**
 * Add new rows to the dataset
 */

export function addRows(
  data: number[][],
  rowsToAdd: number[][],
  position: "start" | "end" | number = "end"
): AddRowResult {
  if (!data || data.length === 0) {
    return {
      updatedData: rowsToAdd,
      newRowCount: rowsToAdd[0]?.length || 0,
      addedRows: rowsToAdd[0]?.length || 0,
    };
  }

  const numCols = data.length;
  const updatedData: number[][] = [];

  for (let colIdx = 0; colIdx < numCols; colIdx++) {
    const column = [...data[colIdx]];
    const newValues = rowsToAdd[colIdx] || [];

    if (position === "start") {
      updatedData.push([...newValues, ...column]);
    } else if (position === "end") {
      updatedData.push([...column, ...newValues]);
    } else if (typeof position === "number") {
      column.splice(position, 0, ...newValues);
      updatedData.push(column);
    }
  }

  return {
    updatedData,
    newRowCount: updatedData[0]?.length || 0,
    addedRows: rowsToAdd[0]?.length || 0,
  };
}

/**
 * Delete rows from the dataset
 */

export function deleteRows(
  data: number[][],
  rowIndices: number[]
): DeleteRowResult {
  if (!data || data.length === 0) {
    throw new Error("No data to delete rows from");
  }

  const indicesToDelete = new Set(rowIndices);
  const updatedData: number[][] = [];

  data.forEach((column) => {
    const filteredColumn = column.filter((_, idx) => !indicesToDelete.has(idx));
    updatedData.push(filteredColumn);
  });

  return {
    updatedData,
    deletedCount: rowIndices.length,
    remainingCount: updatedData[0]?.length || 0,
  };
}

/**
 * Rename rows (update row identifiers/labels)
 */

export function renameRows(
  originalLabels: string[],
  renameMap: Map<number, string>
): RenameRowResult {
  const updatedLabels = [...originalLabels];
  let renamedCount = 0;

  renameMap.forEach((newName, index) => {
    if (index >= 0 && index < updatedLabels.length) {
      updatedLabels[index] = newName;
      renamedCount++;
    }
  });

  return {
    updatedLabels,
    renamedCount,
  };
}

// ===================================================================
// COLUMN MANIPULATION FUNCTIONS
// ===================================================================
export function addColumn(
  data: number[][],
  values: number[] | "empty"
): AddColumnResult {
  if (!data || data.length === 0) {
    throw new Error("No data to add a column to");
  }

  const numRows = data[0].length;
  const newColumn =
    Array.isArray(values) && values.length === numRows
      ? values.map((v) => (Number.isFinite(v) ? v : NaN))
      : new Array(numRows).fill(NaN);

  const updatedData = [...data.map((col) => [...col]), newColumn];

  return {
    updatedData,
    newColumnIndex: updatedData.length - 1,
  };
}

export function deleteColumns(
  data: number[][],
  columnIndices: number[]
): number[][] {
  if (!data || data.length === 0) {
    throw new Error("No data to delete columns from");
  }

  const indicesToDelete = new Set(columnIndices);
  const remaining = data.filter((_, idx) => !indicesToDelete.has(idx));

  if (remaining.length === 0) {
    throw new Error("Cannot delete all columns");
  }

  return remaining;
}

export function fillColumn(
  data: number[][],
  columnIndex: number,
  value: number
): number[][] {
  if (!data || data.length === 0) {
    throw new Error("No data to fill");
  }

  if (columnIndex < 0 || columnIndex >= data.length) {
    throw new Error(`Invalid column index: ${columnIndex}`);
  }

  return data.map((col, idx) =>
    idx === columnIndex ? col.map(() => value) : [...col]
  );
}

// ===================================================================
// ROW FILTERING FUNCTIONS (keep rows that match the criterion)
// ===================================================================

/**
 * Keep rows that have (or lack) missing values in any selected column.
 * Operates on column-major data (each column is a number[] of length nRows).
 */
export function filterRowsByMissing(
  data: number[][],
  mode: MissingFilterMode = "with-missing"
): number[][] {
  if (!data || data.length === 0) {
    throw new Error("No data to filter");
  }

  const numRows = data[0].length;
  const keep: boolean[] = new Array(numRows).fill(false);

  for (let r = 0; r < numRows; r++) {
    let rowHasMissing = false;
    for (const col of data) {
      const v = col[r];
      if (v === undefined || isNaN(v) || v === null) {
        rowHasMissing = true;
        break;
      }
    }
    keep[r] = mode === "with-missing" ? rowHasMissing : !rowHasMissing;
  }

  return data.map((col) => col.filter((_, r) => keep[r]));
}

/**
 * Keep rows where at least one selected column value falls within [min, max].
 */
export function filterRowsByRange(
  data: number[][],
  minValue: number,
  maxValue: number
): number[][] {
  if (!data || data.length === 0) {
    throw new Error("No data to filter");
  }

  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    throw new Error("Range bounds must be finite numbers");
  }

  if (minValue > maxValue) {
    throw new Error("Minimum value must be less than or equal to maximum value");
  }

  const numRows = data[0].length;
  const keep: boolean[] = new Array(numRows).fill(false);

  for (let r = 0; r < numRows; r++) {
    for (const col of data) {
      const v = col[r];
      if (Number.isFinite(v) && v >= minValue && v <= maxValue) {
        keep[r] = true;
        break;
      }
    }
  }

  return data.map((col) => col.filter((_, r) => keep[r]));
}

/**
 * Keep rows where at least one selected column value is flagged as an outlier
 * by the chosen detection method.
 */
export function filterRowsByOutlier(
  data: number[][],
  method: OutlierFilterMethod = "iqr"
): number[][] {
  if (!data || data.length === 0) {
    throw new Error("No data to filter");
  }

  const numRows = data[0].length;
  const keep: boolean[] = new Array(numRows).fill(false);

  for (const col of data) {
    // Methods with minimum-size requirements (e.g. Grubbs needs >= 3) should
    // simply not flag anything for that column rather than throwing.
    try {
      let flags: boolean[];
      switch (method) {
        case "z-score":
          flags = detectZScoreOutliers(col).map((o) => o.isOutlier);
          break;
        case "grubbs":
          flags = detectGrubbsOutliers(col).map((o) => o.isOutlier);
          break;
        case "iqr":
        default:
          flags = detectIQROutliers(col).map((o) => o.isOutlier);
          break;
      }
      flags.forEach((isOutlier, r) => {
        if (isOutlier) keep[r] = true;
      });
    } catch {
      // column lacks enough data for the chosen method; skip it
    }
  }

  return data.map((col) => col.filter((_, r) => keep[r]));
}

// ===================================================================
// MACHINE LEARNING / DIMENSIONALITY REDUCTION - COMPLETE WORKING IMPLEMENTATIONS
// ===================================================================

/**
 * Helper: Remove NaN values and get valid data
 */
function getValidValues(values: number[]): number[] {
  return values.filter((v) => !isNaN(v) && isFinite(v));
}

/**
 * PCA - Principal Component Analysis (WORKING VERSION)
 */
export function performPCA(
  data: number[][],
  numComponents: number = 2
): PCAResult {
  if (!data || data.length === 0) {
    throw new Error("No data provided for PCA");
  }

  const numFeatures = data.length;
  const numSamples = data[0].length;

  if (numSamples === 0) {
    throw new Error("No samples in data");
  }

  const maxComponents = Math.min(numFeatures, numSamples);
  const k = Math.max(1, Math.min(numComponents, maxComponents));

  // Step 1: z-score center + scale each feature (missing treated as column mean → 0 after centering).
  const centeredData: number[][] = [];
  for (const column of data) {
    const validValues = getValidValues(column);
    const safeStd = validValues.length > 0 ? stddev(validValues) : 1;

    let columnMean = 0;
    if (validValues.length > 0) {
      columnMean = mean(validValues);
    }
    const colStd = Number.isFinite(safeStd) && safeStd > 0 ? safeStd : 1;

    centeredData.push(
      column.map((val) => {
        if (isNaN(val) || !isFinite(val)) return 0;
        return (val - columnMean) / colStd;
      })
    );
  }

  // Step 2: exact symmetric eigendecomposition of the covariance matrix via
  // the Jacobi rotation method (jStat.PCA). Returns [X, D, Vt, Y] where Vt is
  // the sorted eigenvector matrix and D the sorted eigenvalues.
  const [, eigenvalues, eigenvectors, transformed] = jStat.PCA(centeredData);

  const components: number[][] = [];
  const transformedData: number[][] = [];
  const variances: number[] = [];

  for (let i = 0; i < k; i++) {
    components.push(eigenvectors[i]);
    transformedData.push(transformed[i]);
    const ev = eigenvalues[i];
    variances.push(Number.isFinite(ev) && ev >= 0 ? ev : 0);
  }

  const totalVariance = variances.reduce((s, v) => s + v, 0);
  const explained_variance =
    totalVariance > 0
      ? variances.map((v) => v / totalVariance)
      : variances.map(() => 1 / k);

  return {
    components,
    explained_variance,
    transformed_data: transformedData,
    num_components: k,
  };
}

/**
 * PLS-DA - Partial Least Squares Discriminant Analysis (WORKING VERSION)
 */

export function performPLSDA(
  data: number[][],
  labels: number[],
  numComponents: number = 2
): PLSDAResult {
  if (!data || data.length === 0) {
    throw new Error("No data provided for PLS-DA");
  }

  const numFeatures = data.length;
  const numSamples = data[0].length;

  if (labels.length !== numSamples) {
    throw new Error(
      `Number of labels (${labels.length}) must match number of samples (${numSamples})`
    );
  }

  if (numComponents > Math.min(numFeatures, numSamples)) {
    numComponents = Math.min(numFeatures, numSamples);
  }

  // Step 1: Center and scale data
  const centeredData: number[][] = [];
  const means: number[] = [];

  data.forEach((column) => {
    const validValues = getValidValues(column);

    if (validValues.length === 0) {
      means.push(0);
      centeredData.push(new Array(numSamples).fill(0));
      return;
    }

    const columnMean = mean(validValues);
    const columnStd = stddev(validValues);
    const safeStd = columnStd > 0 ? columnStd : 1;

    means.push(columnMean);

    const centered = column.map((val) => {
      if (isNaN(val) || !isFinite(val)) return 0;
      return (val - columnMean) / safeStd;
    });

    centeredData.push(centered);
  });

  // Step 2: Get unique class labels
  const uniqueLabels = [...new Set(labels)];
  const numClasses = uniqueLabels.length;

  // Step 3: Create discriminant components
  const components: number[][] = [];
  const transformed_data: number[][] = [];

  for (let i = 0; i < numComponents; i++) {
    let component: number[] = new Array(numFeatures).fill(0);

    // For each feature, calculate between-class vs within-class variance
    for (let j = 0; j < numFeatures; j++) {
      let betweenClassVar = 0;
      let withinClassVar = 0;

      // Calculate class means
      const classMeans: number[] = [];
      uniqueLabels.forEach((label) => {
        const classIndices = labels
          .map((l, idx) => (l === label ? idx : -1))
          .filter((idx) => idx >= 0);
        const classValues = classIndices
          .map((idx) => centeredData[j][idx])
          .filter((v) => isFinite(v));
        classMeans.push(classValues.length > 0 ? mean(classValues) : 0);
      });

      const overallMean = mean(classMeans);

      // Between-class variance
      classMeans.forEach((classMean) => {
        betweenClassVar += Math.pow(classMean - overallMean, 2);
      });

      // Within-class variance (simplified)
      withinClassVar = variance(getValidValues(centeredData[j]));

      // Fisher's discriminant ratio
      component[j] =
        withinClassVar > 0 ? betweenClassVar / withinClassVar : betweenClassVar;
    }

    // Orthogonalize against previous components
    for (let k = 0; k < i; k++) {
      const dotProduct = component.reduce(
        (sum, val, idx) => sum + val * components[k][idx],
        0
      );
      component = component.map(
        (val, idx) => val - dotProduct * components[k][idx]
      );
    }

    // Normalize
    const norm = Math.sqrt(component.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      component = component.map((val) => val / norm);
    } else {
      component = component.map(
        () => (Math.random() - 0.5) / Math.sqrt(numFeatures)
      );
    }

    components.push(component);

    // Project data onto this component
    const lvValues: number[] = [];
    for (let sample = 0; sample < numSamples; sample++) {
      let value = 0;
      for (let feature = 0; feature < numFeatures; feature++) {
        value += centeredData[feature][sample] * component[feature];
      }
      lvValues.push(value);
    }
    transformed_data.push(lvValues);
  }

  // Calculate class separation score
  let separationScore = 0;
  if (transformed_data.length > 0) {
    const lv1 = transformed_data[0];
    uniqueLabels.forEach((label1, idx1) => {
      uniqueLabels.forEach((label2, idx2) => {
        if (idx1 < idx2) {
          const class1Indices = labels
            .map((l, i) => (l === label1 ? i : -1))
            .filter((i) => i >= 0);
          const class2Indices = labels
            .map((l, i) => (l === label2 ? i : -1))
            .filter((i) => i >= 0);

          const class1Mean = mean(class1Indices.map((i) => lv1[i]));
          const class2Mean = mean(class2Indices.map((i) => lv1[i]));

          separationScore += Math.abs(class1Mean - class2Mean);
        }
      });
    });
    separationScore = Math.min(
      separationScore / ((numClasses * (numClasses - 1)) / 2),
      1
    );
  }

  return {
    components,
    transformed_data,
    num_components: numComponents,
    class_separation: separationScore,
  };
}

/**
 * t-SNE - t-Distributed Stochastic Neighbor Embedding (WORKING VERSION)
 */
export async function performTSNE(
  data: number[][],
  numDimensions: number = 2,
  perplexity: number = 30,
  iterations: number = 1000,
  onIteration?: (
    iteration: number,
    total: number,
  ) => Promise<void> | void,
): Promise<TSNEResult> {
  if (!data || data.length === 0) {
    throw new Error("No data provided for t-SNE");
  }

  const numFeatures = data.length;
  const numSamples = data[0].length;

  if (numSamples < 2) {
    throw new Error("t-SNE requires at least 2 samples");
  }

  // Validate perplexity
  const safePerplexity = Math.min(
    Math.max(perplexity, 5),
    Math.floor(numSamples / 3)
  );

  // Step 1: Normalize input data
  const normalizedData: number[][] = [];

  data.forEach((column) => {
    const validValues = getValidValues(column);

    if (validValues.length === 0) {
      normalizedData.push(new Array(numSamples).fill(0));
      return;
    }

    const columnMean = mean(validValues);
    const columnStd = stddev(validValues);
    const safeStd = columnStd > 0 ? columnStd : 1;

    const normalized = column.map((val) => {
      if (isNaN(val) || !isFinite(val)) return 0;
      return (val - columnMean) / safeStd;
    });

    normalizedData.push(normalized);
  });

  // Step 2: Compute pairwise distances in high-dimensional space
  const distances: number[][] = [];
  for (let i = 0; i < numSamples; i++) {
    distances[i] = [];
    for (let j = 0; j < numSamples; j++) {
      if (i === j) {
        distances[i][j] = 0;
      } else {
        let dist = 0;
        for (let k = 0; k < numFeatures; k++) {
          const diff = normalizedData[k][i] - normalizedData[k][j];
          dist += diff * diff;
        }
        distances[i][j] = Math.sqrt(dist);
      }
    }
  }

  // Step 3: Initialize embedding randomly in low-dimensional space
  const embedded_data: number[][] = [];
  for (let i = 0; i < numDimensions; i++) {
    const dimension: number[] = [];
    for (let j = 0; j < numSamples; j++) {
      dimension.push((Math.random() - 0.5) * 0.0001); // Small random initialization
    }
    embedded_data.push(dimension);
  }

  // Step 4: Simplified t-SNE optimization
  // This is a very simplified version - for production use a proper t-SNE library
  const learningRate = Math.max(200, numSamples / 12);
  const momentum = 0.5;
  const previousGradient: number[][] = embedded_data.map((dim) =>
    dim.map(() => 0)
  );

  for (let iter = 0; iter < Math.min(iterations, 1000); iter++) {
    if (onIteration) await onIteration(iter, Math.min(iterations, 1000));
    const gradients: number[][] = embedded_data.map((dim) => dim.map(() => 0));

    // Compute gradients (simplified attractive and repulsive forces)
    for (let i = 0; i < numSamples; i++) {
      for (let j = 0; j < numSamples; j++) {
        if (i === j) continue;

        // Compute low-dimensional distance
        let lowDimDist = 0;
        for (let d = 0; d < numDimensions; d++) {
          const diff = embedded_data[d][i] - embedded_data[d][j];
          lowDimDist += diff * diff;
        }
        lowDimDist = Math.sqrt(lowDimDist) + 1e-10;

        // Simplified force calculation
        const highDimSimilarity = Math.exp(
          (-distances[i][j] * distances[i][j]) / (2 * safePerplexity)
        );
        const lowDimSimilarity = 1 / (1 + lowDimDist * lowDimDist);

        const force =
          (highDimSimilarity - lowDimSimilarity) / (lowDimDist + 1e-10);

        for (let d = 0; d < numDimensions; d++) {
          const diff = embedded_data[d][i] - embedded_data[d][j];
          gradients[d][i] += force * diff;
        }
      }
    }

    // Update positions with momentum
    const currentMomentum = iter < 250 ? momentum : 0.8;
    const currentLearningRate = learningRate * (1 - iter / iterations);

    for (let d = 0; d < numDimensions; d++) {
      for (let i = 0; i < numSamples; i++) {
        const gradient = gradients[d][i];
        const update =
          currentMomentum * previousGradient[d][i] -
          currentLearningRate * gradient;
        embedded_data[d][i] += update;
        previousGradient[d][i] = update;
      }
    }

    // Center the embedding every 50 iterations
    if (iter % 50 === 0) {
      for (let d = 0; d < numDimensions; d++) {
        const dimMean = mean(embedded_data[d]);
        embedded_data[d] = embedded_data[d].map((val) => val - dimMean);
      }
    }
  }

  // Final centering and scaling
  for (let d = 0; d < numDimensions; d++) {
    const validValues = getValidValues(embedded_data[d]);
    if (validValues.length > 0) {
      const dimMean = mean(validValues);
      const dimStd = stddev(validValues);
      const safeStd = dimStd > 0 ? dimStd : 1;

      embedded_data[d] = embedded_data[d].map(
        (val) => (val - dimMean) / safeStd
      );
    }
  }

  return {
    embedded_data,
    num_dimensions: numDimensions,
    perplexity: safePerplexity,
    iterations: Math.min(iterations, 1000),
  };
}


// ===================================================================
// PTM (POST-TRANSLATIONAL MODIFICATION) FUNCTIONS
// ===================================================================
/**
 * Add PTM annotations to protein data
 */
export function addPTMAnnotations(
  data: number[][],
  ptmList: PTMAnnotation[]
): AddPTMResult {
  if (!data || data.length === 0) {
    throw new Error("No data provided for PTM annotation");
  }
  
  // Group PTMs by row/protein index
  const ptmAnnotations = new Map<number, PTMAnnotation[]>();
  
  ptmList.forEach(ptm => {
    if (!ptmAnnotations.has(ptm.position)) {
      ptmAnnotations.set(ptm.position, []);
    }
    ptmAnnotations.get(ptm.position)!.push(ptm);
  });
  
  // Data remains unchanged (PTMs are metadata)
  const annotatedData = data.map(col => [...col]);
  
  return {
    annotatedData,
    ptmAnnotations,
    totalPTMs: ptmList.length
  };
}

/**
 * Remove PTM annotations from protein data
 */
export function removePTMAnnotations(
  data: number[][],
  currentPTMs: PTMAnnotation[],
  ptmTypesToRemove: string[],
  positionsToRemove?: number[]
): RemovePTMResult {
  if (!data || data.length === 0) {
    throw new Error("No data provided for PTM removal");
  }
  
  const removedPTMs: PTMAnnotation[] = [];
  const remainingPTMs: PTMAnnotation[] = [];
  
  currentPTMs.forEach(ptm => {
    let shouldRemove = false;
    
    // Check if PTM type matches removal criteria
    if (ptmTypesToRemove.includes(ptm.modificationType)) {
      shouldRemove = true;
    }
    
    // Check if position matches (if specified)
    if (positionsToRemove && positionsToRemove.includes(ptm.position)) {
      shouldRemove = true;
    }
    
    if (shouldRemove) {
      removedPTMs.push(ptm);
    } else {
      remainingPTMs.push(ptm);
    }
  });
  
  // Data remains unchanged (PTMs are metadata)
  const cleanedData = data.map(col => [...col]);
  
  return {
    cleanedData,
    removedPTMs,
    remainingPTMs
  };
}

// ===================================================================
// CLUSTERING ALGORITHMS - COMPLETE IMPLEMENTATIONS
// ===================================================================

/**
 * Helper: Calculate Euclidean distance between two points
 */
function euclideanDistance(point1: number[], point2: number[]): number {
  let sum = 0;
  for (let i = 0; i < point1.length; i++) {
    const diff = point1[i] - point2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * K-Means Clustering Implementation
 */
export function performKMeans(
  data: number[][],
  k: number,
  maxIterations: number = 100,
  tolerance: number = 0.0001
): KMeansResult {
  if (!data || data.length === 0) {
    throw new Error("No data provided for K-Means");
  }
  
  const numFeatures = data.length;
  const numSamples = data[0].length;
  
  if (k <= 0 || k > numSamples) {
    throw new Error(`K must be between 1 and ${numSamples}`);
  }
  
  // Transpose data: convert from columnar to row-based format
  const samples: number[][] = [];
  for (let i = 0; i < numSamples; i++) {
    const sample: number[] = [];
    for (let j = 0; j < numFeatures; j++) {
      const val = data[j][i];
      sample.push(isNaN(val) || !isFinite(val) ? 0 : val);
    }
    samples.push(sample);
  }
  
  // Initialize centroids randomly (K-means++)
  const centroids: number[][] = [];
  const usedIndices = new Set<number>();
  
  // First centroid: random
  const firstIdx = Math.floor(Math.random() * numSamples);
  centroids.push([...samples[firstIdx]]);
  usedIndices.add(firstIdx);
  
  // Remaining centroids: K-means++ initialization
  for (let i = 1; i < k; i++) {
    const distances: number[] = [];
    let totalDist = 0;
    
    for (let j = 0; j < numSamples; j++) {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = euclideanDistance(samples[j], centroid);
        minDist = Math.min(minDist, dist);
      }
      distances.push(minDist * minDist);
      totalDist += minDist * minDist;
    }
    
    // Select next centroid with probability proportional to distance²
    let r = Math.random() * totalDist;
    let idx = 0;
    for (let j = 0; j < numSamples; j++) {
      r -= distances[j];
      if (r <= 0) {
        idx = j;
        break;
      }
    }
    
    centroids.push([...samples[idx]]);
  }
  
  // K-means iterations
  let clusterAssignments: number[] = new Array(numSamples).fill(0);
  let converged = false;
  let iterations = 0;
  
  for (iterations = 0; iterations < maxIterations && !converged; iterations++) {
    // Assignment step
    const newAssignments: number[] = [];
    for (let i = 0; i < numSamples; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      
      for (let j = 0; j < k; j++) {
        const dist = euclideanDistance(samples[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = j;
        }
      }
      newAssignments.push(bestCluster);
    }
    
    // Check convergence
    converged = newAssignments.every((val, idx) => val === clusterAssignments[idx]);
    clusterAssignments = newAssignments;
    
    if (converged) break;
    
    // Update step
    const newCentroids: number[][] = [];
    for (let j = 0; j < k; j++) {
      const clusterPoints = samples.filter((_, idx) => clusterAssignments[idx] === j);
      
      if (clusterPoints.length === 0) {
        // Empty cluster: reinitialize
        newCentroids.push([...centroids[j]]);
        continue;
      }
      
      const newCentroid: number[] = [];
      for (let f = 0; f < numFeatures; f++) {
        const sum = clusterPoints.reduce((acc, point) => acc + point[f], 0);
        newCentroid.push(sum / clusterPoints.length);
      }
      newCentroids.push(newCentroid);
    }
    
    // Check centroid movement
    let maxMovement = 0;
    for (let j = 0; j < k; j++) {
      const movement = euclideanDistance(centroids[j], newCentroids[j]);
      maxMovement = Math.max(maxMovement, movement);
    }
    
    centroids.splice(0, centroids.length, ...newCentroids);
    
    if (maxMovement < tolerance) {
      converged = true;
    }
  }
  
  // Calculate inertia (within-cluster sum of squares)
  let inertia = 0;
  for (let i = 0; i < numSamples; i++) {
    const cluster = clusterAssignments[i];
    const dist = euclideanDistance(samples[i], centroids[cluster]);
    inertia += dist * dist;
  }
  
  return {
    clusterAssignments,
    centroids,
    iterations,
    inertia
  };
}

/**
 * Hierarchical Clustering Implementation (Agglomerative)
 */
/**
 * OPTIMIZED Hierarchical Clustering Implementation
 * Uses distance matrix caching and optimized merge operations
 */
export function performHierarchicalClustering(
  data: number[][],
  numClusters: number,
  linkage: 'single' | 'complete' | 'average' = 'average',
  maxSamples: number = 1000 // Add sampling limit for large datasets
): HierarchicalClusteringResult {
  if (!data || data.length === 0) {
    throw new Error("No data provided for Hierarchical Clustering");
  }
  
  const numFeatures = data.length;
  const numSamples = data[0].length;
  
  if (numClusters <= 0 || numClusters > numSamples) {
    throw new Error(`Number of clusters must be between 1 and ${numSamples}`);
  }
  
  // For large datasets, use sampling or recommend alternatives
  let actualSamples = numSamples;
  let sampleIndices: number[] = [];
  let useSampling = false;
  
  if (numSamples > maxSamples) {
    useSampling = true;
    actualSamples = maxSamples;
    
    // Random sampling
    const allIndices = Array.from({ length: numSamples }, (_, i) => i);
    for (let i = allIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }
    sampleIndices = allIndices.slice(0, maxSamples);
  } else {
    sampleIndices = Array.from({ length: numSamples }, (_, i) => i);
  }
  
  // Transpose data for sampled indices
  const samples: number[][] = [];
  for (const idx of sampleIndices) {
    const sample: number[] = [];
    for (let j = 0; j < numFeatures; j++) {
      const val = data[j][idx];
      sample.push(isNaN(val) || !isFinite(val) ? 0 : val);
    }
    samples.push(sample);
  }
  
  // Initialize: each sample is its own cluster
  const clusters: number[][] = samples.map((_, idx) => [idx]);
  const dendrogram: Array<{
    cluster1: number;
    cluster2: number;
    distance: number;
    size: number;
  }> = [];
  
  // Pre-compute distance matrix (optimized)
  const distanceMatrix: Map<string, number> = new Map();
  
  const getDistanceKey = (i: number, j: number): string => {
    return i < j ? `${i},${j}` : `${j},${i}`;
  };
  
  const computeClusterDistance = (cluster1: number[], cluster2: number[]): number => {
    const key = getDistanceKey(
      Math.min(...cluster1),
      Math.min(...cluster2)
    );
    
    if (distanceMatrix.has(key)) {
      return distanceMatrix.get(key)!;
    }
    
    const distances: number[] = [];
    
    // Sample distances for large clusters to improve speed
    const maxPairs = 100; // Limit distance calculations
    const step1 = Math.max(1, Math.floor(cluster1.length / 10));
    const step2 = Math.max(1, Math.floor(cluster2.length / 10));
    
    for (let i = 0; i < cluster1.length; i += step1) {
      for (let j = 0; j < cluster2.length; j += step2) {
        const idx1 = cluster1[i];
        const idx2 = cluster2[j];
        distances.push(euclideanDistance(samples[idx1], samples[idx2]));
        
        if (distances.length >= maxPairs) break;
      }
      if (distances.length >= maxPairs) break;
    }
    
    let result: number;
    if (linkage === 'single') {
      result = Math.min(...distances);
    } else if (linkage === 'complete') {
      result = Math.max(...distances);
    } else { // average
      result = distances.reduce((a, b) => a + b, 0) / distances.length;
    }
    
    distanceMatrix.set(key, result);
    return result;
  };
  
  // Agglomerative clustering with progress tracking
  let iteration = 0;
  const maxIterations = actualSamples - numClusters;
  
  while (clusters.length > numClusters) {
    iteration++;
    
    // Progress logging (can be removed in production)
    if (iteration % 50 === 0) {
      console.log(`Hierarchical clustering progress: ${iteration}/${maxIterations}`);
    }
    
    let minDist = Infinity;
    let mergeI = 0;
    let mergeJ = 1;
    
    // Find closest pair of clusters (optimized search)
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const dist = computeClusterDistance(clusters[i], clusters[j]);
        if (dist < minDist) {
          minDist = dist;
          mergeI = i;
          mergeJ = j;
        }
      }
    }
    
    // Merge clusters
    const mergedCluster = [...clusters[mergeI], ...clusters[mergeJ]];
    dendrogram.push({
      cluster1: mergeI,
      cluster2: mergeJ,
      distance: minDist,
      size: mergedCluster.length
    });
    
    // Remove old clusters and add merged one
    const newClusters = clusters.filter((_, idx) => idx !== mergeI && idx !== mergeJ);
    newClusters.push(mergedCluster);
    clusters.splice(0, clusters.length, ...newClusters);
  }
  
  // Create final cluster assignments
  const clusterAssignments: number[] = new Array(numSamples).fill(-1);
  
  if (useSampling) {
    // First assign sampled points
    clusters.forEach((cluster, clusterIdx) => {
      cluster.forEach(sampledIdx => {
        const originalIdx = sampleIndices[sampledIdx];
        clusterAssignments[originalIdx] = clusterIdx;
      });
    });
    
    // Assign remaining points to nearest cluster centroid
    const centroids: number[][] = [];
    clusters.forEach(cluster => {
      const centroid: number[] = new Array(numFeatures).fill(0);
      cluster.forEach(sampledIdx => {
        const originalIdx = sampleIndices[sampledIdx];
        for (let f = 0; f < numFeatures; f++) {
          centroid[f] += data[f][originalIdx];
        }
      });
      centroids.push(centroid.map(val => val / cluster.length));
    });
    
    // Assign unassigned points
    for (let i = 0; i < numSamples; i++) {
      if (clusterAssignments[i] === -1) {
        const point: number[] = [];
        for (let f = 0; f < numFeatures; f++) {
          point.push(data[f][i]);
        }
        
        let minDist = Infinity;
        let bestCluster = 0;
        
        centroids.forEach((centroid, idx) => {
          const dist = euclideanDistance(point, centroid);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = idx;
          }
        });
        
        clusterAssignments[i] = bestCluster;
      }
    }
  } else {
    // Direct assignment for non-sampled case
    clusters.forEach((cluster, clusterIdx) => {
      cluster.forEach(sampleIdx => {
        clusterAssignments[sampleIdx] = clusterIdx;
      });
    });
  }
  
  return {
    clusterAssignments,
    dendrogram,
    numClusters: clusters.length
  };
}


/**
 * PCA for Clustering/Visualization
 */
export function performPCAForClustering(
  data: number[][],
  numComponents: number = 2,
  performClustering: boolean = false,
  k: number = 3
): PCAClusteringResult {
  // Reuse the PCA implementation from earlier
  const pcaResult = performPCA(data, numComponents);
  
  let clusterAssignments: number[] | undefined;
  
  // Optionally perform K-means on PCA results
  if (performClustering) {
    const kmeansResult = performKMeans(pcaResult.transformed_data, k);
    clusterAssignments = kmeansResult.clusterAssignments;
  }
  
  return {
    transformedData: pcaResult.transformed_data,
    clusterAssignments,
    explained_variance: pcaResult.explained_variance,
    num_components: numComponents
  };
}


// ===================================================================
// NORMALIZATION FUNCTIONS - COMPLETE IMPLEMENTATIONS
// ===================================================================

/**
 * Z-Score Normalization (Standardization)
 * Transforms data to have mean=0 and std=1
 */
export function zScoreNormalization(data: number[][]): number[][] {
  if (!data || data.length === 0) {
    throw new Error("No data provided for Z-Score normalization");
  }
  
  const result: number[][] = [];
  
  data.forEach(column => {
    const validValues = column.filter(v => !isNaN(v) && isFinite(v));
    
    if (validValues.length === 0) {
      result.push(column.map(() => 0));
      return;
    }
    
    const columnMean = mean(validValues);
    const columnStd = stddev(validValues);
    
    if (columnStd === 0) {
      // All values are the same
      result.push(column.map(() => 0));
      return;
    }
    
    const normalized = column.map(val => {
      if (isNaN(val) || !isFinite(val)) return 0;
      return (val - columnMean) / columnStd;
    });
    
    result.push(normalized);
  });
  
  return result;
}

/**
 * Log Transform Normalization
 * Applies log transformation (log2 or log10)
 */
export function logTransformNormalization(
  data: number[][],
  base: 'log2' | 'log10' | 'ln' = 'log2',
  offset: number = 1
): number[][] {
  if (!data || data.length === 0) {
    throw new Error("No data provided for Log Transform");
  }
  
  const logFunc = (val: number): number => {
    if (base === 'log2') return Math.log2(val);
    if (base === 'log10') return Math.log10(val);
    return Math.log(val); // natural log
  };
  
  const result: number[][] = [];
  
  data.forEach(column => {
    const transformed = column.map(val => {
      if (isNaN(val) || !isFinite(val)) return 0;
      
      // Add offset to handle zero/negative values
      const adjustedVal = val + offset;
      
      if (adjustedVal <= 0) return 0;
      
      return logFunc(adjustedVal);
    });
    
    result.push(transformed);
  });
  
  return result;
}

/**
 * Quantile Normalization
 * Makes the distribution of each column identical
 */
export function quantileNormalization(data: number[][]): number[][] {
  if (!data || data.length === 0) {
    throw new Error("No data provided for Quantile normalization");
  }

  // Main diagonal entries must be mutually consistent: each column's value
  // count equals the number of rows.
  const numRows = data[0].length;

  // Build the reference distribution: sort each column's *observed* values
  // and average them across columns rank-by-rank. Missing values are excluded
  // entirely (never replaced by 0).
  const observedCounts: number[] = [];
  const sortedColumns: number[][] = data.map((column) => {
    const observed = getValidValues(column).sort((a, b) => a - b);
    observedCounts.push(observed.length);
    return observed;
  });

  const maxRank = Math.max(0, ...observedCounts);
  const meanSorted: number[] = [];
  for (let rank = 0; rank < maxRank; rank++) {
    let sum = 0;
    let count = 0;
    for (const sortedCol of sortedColumns) {
      if (rank < sortedCol.length) {
        sum += sortedCol[rank];
        count++;
      }
    }
    meanSorted.push(count > 0 ? sum / count : 0);
  }

  const numRanks = meanSorted.length;

  // Map each observed value in each column back to the reference distribution.
  const result: number[][] = data.map((column) => {
    // Rank the observed values (ascending); ties share the mean rank.
    const observed = column
      .map((val, idx) => ({ val, idx }))
      .filter((o) => isFinite(o.val))
      .sort((a, b) => a.val - b.val);

    const rankOf: number[] = new Array(observed.length);
    let i = 0;
    while (i < observed.length) {
      let j = i;
      while (j + 1 < observed.length && observed[j + 1].val === observed[i].val)
        j++;
      const sharedRank = (i + j) / 2;
      for (let t = i; t <= j; t++) rankOf[t] = sharedRank;
      i = j + 1;
    }

    const normalized = new Array(numRows).fill(NaN);
    observed.forEach((item, index) => {
      const rankIndex = Math.max(
        0,
        Math.min(numRanks - 1, Math.round(rankOf[index]))
      );
      normalized[item.idx] = meanSorted[rankIndex];
    });

    return normalized;
  });

  return result;
}

/**
 * Mean Centering Normalization
 * Subtracts the mean from each column (centers at 0)
 */
export function meanCenteringNormalization(data: number[][]): number[][] {
  if (!data || data.length === 0) {
    throw new Error("No data provided for Mean Centering");
  }
  
  const result: number[][] = [];
  
  data.forEach(column => {
    const validValues = column.filter(v => !isNaN(v) && isFinite(v));
    
    if (validValues.length === 0) {
      result.push(column.map(() => 0));
      return;
    }
    
    const columnMean = mean(validValues);
    
    const centered = column.map(val => {
      if (isNaN(val) || !isFinite(val)) return 0;
      return val - columnMean;
    });
    
    result.push(centered);
  });
  
  return result;
}


// ===================================================================
// F(X) / 1D / PI TOOLBAR OPERATIONS
// ===================================================================

/** Tokenizes a mathematical expression in the variable `x`. */
const tokenizeExpression = (input: string): ExprToken[] => {
  const tokens: ExprToken[] = [];
  const source = input.replace(/\s+/g, "");
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (/[\d.]/.test(ch)) {
      let j = i;
      let hasDot = false;
      while (j < source.length && /[\d.]/.test(source[j])) {
        if (source[j] === ".") {
          if (hasDot) break;
          hasDot = true;
        }
        j++;
      }
      const raw = source.slice(i, j);
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`Invalid number: '${raw}'`);
      tokens.push({ type: "num", value: raw });
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < source.length && /[A-Za-z0-9_]/.test(source[j])) j++;
      tokens.push({ type: "ident", value: source.slice(i, j) });
      i = j;
      continue;
    }

    switch (ch) {
      case "+":
      case "-":
      case "*":
      case "/":
      case "^":
        tokens.push({ type: "op", value: ch });
        break;
      case "(":
        tokens.push({ type: "lparen", value: "(" });
        break;
      case ")":
        tokens.push({ type: "rparen", value: ")" });
        break;
      case ",":
        tokens.push({ type: "comma", value: "," });
        break;
      default:
        throw new Error(`Unexpected character: '${ch}'`);
    }
    i++;
  }

  tokens.push({ type: "end", value: "" });
  return tokens;
};

/** Builds a function f(x) from an expression string using a Pratt parser. */
const compileExpression = (input: string) => {
  const tokens = tokenizeExpression(input);
  let pos = 0;

  const peek = (): ExprToken => tokens[pos];
  const advance = (): ExprToken => tokens[pos++];

  const parseExpression = (minPrec: number, x: number): number => {
    let left: number;

    const token = peek();

    if (token.type === "num") {
      advance();
      left = Number(token.value);
    } else if (token.type === "ident") {
      advance();
      if (token.value === "x") {
        left = x;
      } else if (token.value in EXPR_CONSTANTS) {
        left = EXPR_CONSTANTS[token.value];
      } else {
        if (!EXPR_FUNCTIONS[token.value] || peek().type !== "lparen") {
          throw new Error(`Unknown identifier: '${token.value}'`);
        }
        advance(); // consume '('
        const args: number[] = [];
        if (peek().type !== "rparen") {
          args.push(parseExpression(0, x));
          while (peek().type === "comma") {
            advance();
            args.push(parseExpression(0, x));
          }
        }
        if (advance().type !== "rparen") {
          throw new Error(`Expected ')' for '${token.value}'`);
        }
        left = EXPR_FUNCTIONS[token.value](args);
      }
    } else if (token.type === "op" && (token.value === "-" || token.value === "+")) {
      advance();
      const operand = parseExpression(7, x);
      left = token.value === "-" ? -operand : operand;
    } else if (token.type === "lparen") {
      advance();
      left = parseExpression(0, x);
      if (advance().type !== "rparen") throw new Error("Expected ')'");
    } else {
      throw new Error(`Unexpected token: '${token.value}'`);
    }

    while (peek().type === "op") {
      const next = peek();
      const [prec, rightAssoc] = EXPR_PRECEDENCE[next.value];
      if (prec < minPrec) break;
      advance();
      const rhs = parseExpression(rightAssoc ? prec : prec + 1, x);
      switch (next.value) {
        case "+": left += rhs; break;
        case "-": left -= rhs; break;
        case "*": left *= rhs; break;
        case "/": left /= rhs; break;
        case "^": left = Math.pow(left, rhs); break;
      }
    }

    return left;
  };

  return (x: number) => {
    if (!Number.isFinite(x)) return NaN;
    pos = 0;
    return parseExpression(0, x);
  };
};

/**
 * Applies a user-supplied expression f(x) to each value of a column,
 * returning a computed column of the same length.
 */
export function applyFunctionExpression(
  column: number[],
  expression: string
): number[] {
  if (!expression || !expression.trim()) {
    throw new Error("An expression is required");
  }
  if (!column || column.length === 0) {
    throw new Error("Column is empty");
  }
  const fn = compileExpression(expression);
  return column.map((value) => {
    const num = Number(value);
    return Number.isFinite(num) ? fn(num) : NaN;
  });
}

/** Maps each cell as y = a*x + b over a column. */
export function fxLinear(column: number[], a: number, b: number): number[] {
  if (!column || column.length === 0) {
    throw new Error("Column is empty");
  }
  return column.map((value) => {
    const num = Number(value);
    return Number.isFinite(num) ? a * num + b : NaN;
  });
}

/** Min-max normalization of a single column, independently (1D). */
export function normalize1D(column: number[]): number[] {
  if (!column || column.length === 0) throw new Error("Column is empty");
  const valid = column.filter((v) => Number.isFinite(Number(v)));
  if (valid.length === 0) return column.map(() => 0);
  const minv = Math.min(...valid);
  const maxv = Math.max(...valid);
  const range = maxv - minv;
  return column.map((value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return NaN;
    return range === 0 ? 0 : (num - minv) / range;
  });
}

/** Creates a 1D index/sequence column [1, 2, ..., n]. */
export function index1D(length: number): number[] {
  if (length < 0) throw new Error("Invalid length");
  return Array.from({ length }, (_, i) => i + 1);
}

/** Scales a column by a constant multiplier. */
export function multiplyByConstant(column: number[], constant: number): number[] {
  if (!column || column.length === 0) throw new Error("Column is empty");
  return column.map((value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num * constant : NaN;
  });
}

/** Computes constant / value per cell (e.g. pi / x). */
export function divideConstantBy(column: number[], constant: number): number[] {
  if (!column || column.length === 0) throw new Error("Column is empty");
  return column.map((value) => {
    const num = Number(value);
    return Number.isFinite(num) ? constant / num : NaN;
  });
}



// ===================================================================
// F-TEST (Two-Sample Variance Comparison)
// ===================================================================

export function fTest(group1: number[], group2: number[]): FTestResult {
  const values1 = finiteNumbers(group1);
  const values2 = finiteNumbers(group2);

  if (values1.length < 2 || values2.length < 2) {
    throw new Error("Both groups must have at least two finite values");
  }

  const mean1 = mean(values1);
  const mean2 = mean(values2);
  const variance1 = variance(values1);
  const variance2 = variance(values2);
  const n1 = values1.length;
  const n2 = values2.length;

  const smallerVariance = Math.min(variance1, variance2);
  const largerVariance = Math.max(variance1, variance2);
  const fStatistic =
    smallerVariance <= EPSILON
      ? largerVariance <= EPSILON
        ? 1
        : Number.POSITIVE_INFINITY
      : largerVariance / smallerVariance;
  const df1 = (Math.max(variance1, variance2) === variance1 ? n1 : n2) - 1;
  const df2 = (Math.max(variance1, variance2) === variance1 ? n2 : n1) - 1;
  const pValue = Number.isFinite(fStatistic)
    ? 2 *
      Math.min(
        jStat.centralF.cdf(fStatistic, df1, df2),
        1 - jStat.centralF.cdf(fStatistic, df1, df2)
      )
    : 0;

  return {
    fStatistic,
    pValue: clampProbability(pValue),
    degreesOfFreedom1: df1,
    degreesOfFreedom2: df2,
    variance1,
    variance2,
    mean1,
    mean2,
  };
}

// ===================================================================
// CHI-SQUARE TEST (Goodness of Fit)
// ===================================================================


export function chiSquareTest(
  observedFrequencies: number[],
  expectedFrequencies?: number[]
): ChiSquareTestResult {
  if (observedFrequencies.length === 0) {
    throw new Error("Must provide observed frequencies");
  }

  const observed = observedFrequencies.filter(v => isFinite(v) && v >= 0);
  
  if (observed.length < 2) {
    throw new Error("Chi-Square test requires at least 2 categories");
  }

  const totalObserved = observed.reduce((a, b) => a + b, 0);
  const expected =
    expectedFrequencies && expectedFrequencies.length === observed.length
      ? expectedFrequencies.filter(v => isFinite(v) && v > 0)
      : new Array(observed.length).fill(totalObserved / observed.length);

  if (expected.some(e => e <= 0)) {
    throw new Error("All expected frequencies must be greater than 0");
  }

  let chiSquareStatistic = 0;
  const contributionToChi2: number[] = [];

  for (let i = 0; i < observed.length; i++) {
    const o = observed[i];
    const e = expected[i];
    const contribution = Math.pow(o - e, 2) / e;
    chiSquareStatistic += contribution;
    contributionToChi2.push(contribution);
  }

  const degreesOfFreedom = observed.length - 1;
  const pValue = 1 - jStat.chisquare.cdf(chiSquareStatistic, degreesOfFreedom);

  return {
    chiSquareStatistic,
    pValue,
    degreesOfFreedom,
    observedFrequencies: observed,
    expectedFrequencies: expected,
    contributionToChi2,
  };
}


// ===================================================================
// Z-SCORE OUTLIER DETECTION
// ===================================================================
export function detectZScoreOutliers(
  values: number[],
  threshold: number = 3
): ZScoreOutlierResult[] {
  if (values.length === 0) {
    throw new Error("Cannot detect outliers in empty array");
  }

  const meanValue = mean(values);
  const stdDevValue = stddev(values);

  return values.map((value) => {
    const zScore = stdDevValue === 0 ? 0 : (value - meanValue) / stdDevValue;
    const isOutlier = Math.abs(zScore) > threshold;

    return {
      isOutlier,
      zScore,
      value,
      threshold,
    };
  });
}

// ===================================================================
// IQR OUTLIER DETECTION
// ===================================================================
export function detectIQROutliers(
  values: number[],
  multiplier: number = 1.5
): IQROutlierResult[] {
  if (values.length === 0) {
    throw new Error("Cannot detect outliers in empty array");
  }

  // Use Type-7 (R default) quantiles rather than a single-element pick, which
  // is what Excel/R/Numpy report for the boxplot fence.
  const q1 = ss.quantileSorted([...values].sort((a, b) => a - b), 0.25);
  const q3 = ss.quantileSorted([...values].sort((a, b) => a - b), 0.75);
  const iqr = q3 - q1;

  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  return values.map((value) => {
    const isOutlier = value < lowerBound || value > upperBound;

    return {
      isOutlier,
      value,
      q1,
      q3,
      iqr,
      lowerBound,
      upperBound,
    };
  });
}

// ===================================================================
// GRUBBS' TEST OUTLIER DETECTION
// ===================================================================
export function detectGrubbsOutliers(
  values: number[],
  alpha: number = 0.05
): GrubbsTestResult[] {
  if (values.length < 3) {
    throw new Error("Grubbs' test requires at least 3 data points");
  }

  if (alpha <= 0 || alpha >= 1) {
    throw new Error("Alpha must be between 0 and 1 (exclusive)");
  }

  const n = values.length;
  const meanValue = mean(values);
  const stdDevValue = stddev(values);

  // Exact two-sided Grubbs critical value, computed from the Student-t
  // distribution. Replaces the previous hard-coded 1.96 approximation so the
  // thresholds are correct for any sample size.
  const tCrit = jStat.studentt.inv(1 - alpha / (2 * n), n - 2);
  const criticalValue =
    ((n - 1) / Math.sqrt(n)) *
    Math.sqrt(Math.pow(tCrit, 2) / (n - 2 + Math.pow(tCrit, 2)));

  return values.map((value, index) => {
    const grubbsStatistic =
      stdDevValue === 0 ? 0 : Math.abs(value - meanValue) / stdDevValue;
    const isOutlier = grubbsStatistic > criticalValue;

    return {
      isOutlier,
      grubbsStatistic,
      criticalValue,
      value,
      index,
    };
  });
}
