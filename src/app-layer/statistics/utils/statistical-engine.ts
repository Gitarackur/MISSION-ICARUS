// Calculates the mean, median, and standard deviation of an array of numbers
export function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Calculates the median of an array of numbers
export function median(values: number[]) {
  if (!values.length) return 0;
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 === 0 ? (v[mid - 1] + v[mid]) / 2 : v[mid];
}

// Calculates the standard deviation of an array of numbers
export function stddev(values: number[]) {
  if (!values.length) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, x) => acc + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// Calculates the variance of an array of numbers
export function variance(values: number[]) {
  if (!values.length) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, x) => acc + (x - m) ** 2, 0) / values.length;
  return variance;
}

// Calculates the sum of an array of numbers
export function sum(values: number[]) {
  return values.reduce((acc, val) => acc + val, 0);
}

// calculate the normalization of the data
export function normalization(values: number[][]) {
  // max-min normalization: (x - min) / (max - min)
  return values.map((firstNestedValue) => {
    const max_value = Math.max.apply(Math, [...firstNestedValue]);
    const min_value = Math.min.apply(Math, [...firstNestedValue]);
    return firstNestedValue.map((value) => {
      return (value - min_value) / (max_value - min_value);
    });
  });
}

// calcuate the t-test of the data
export function tTest(data: number[][]) {
  if (data.length !== 2) {
    console.error(
      "T-Test requires exactly two groups of data, but received a different number."
    );
    return null;
  }

  const group1Data = data[0];
  const group2Data = data[1];

  if (group1Data.length < 2 || group2Data.length < 2) {
    console.error(
      "Each group must have at least two data points to perform the t-test."
    );
    return null;
  }

  // Calculate means
  const n1 = group1Data.length;
  const n2 = group2Data.length;

  const mean1 = mean(group1Data);
  const mean2 = mean(group2Data);

  // Calculate variances
  const variance1 = variance(group1Data);
  const variance2 = variance(group2Data);

  // Calculate pooled standard deviation
  const degreesOfFreedom = n1 + n2 - 2;
  const pooledVariance =
    ((n1 - 1) * variance1 + (n2 - 1) * variance2) / degreesOfFreedom;
  const pooledStdDev = Math.sqrt(pooledVariance);

  // Calculate t-statistic
  let tStatistic =
    (mean1 - mean2) / (pooledStdDev * Math.sqrt(1 / n1 + 1 / n2));

  // Handle case where pooledStdDev is zero
  if (!isFinite(tStatistic)) {
    tStatistic = 0;
  }

  return {
    tStatistic,
    degreesOfFreedom,
    mean1,
    mean2,
    stdDev1: Math.sqrt(variance1),
    stdDev2: Math.sqrt(variance2),
  };
}

//Imputation of Mean
export const imputeMeanColumn = (col: number[]): number[] => {
  // compute mean from observed (finite) values only
  const obs = col.filter((x) => Number.isFinite(x));
  if (obs.length === 0) return col.slice(); // nothing to impute (all NaN) → return as-is
  const m = obs.reduce((a, b) => a + b, 0) / obs.length;
  // replace missing (NaN / ±Infinity) with mean
  return col.map((x) => (Number.isFinite(x) ? x : m));
};


/* ============================
 * Imputation helpers (export)
 * ============================ */

/** Median of a numeric column, ignoring NaN. Returns NaN if no finite values. */
export function columnMedian(col: number[]): number {
  const vals = col.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (vals.length === 0) return NaN;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
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
    const x = a[i], y = b[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) return Number.POSITIVE_INFINITY;
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
  if (missingIdx.length === 0 || observedIdx.length === 0) return targetCol.slice();

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
    const pairs = Xobs
      .map((xo, idx) => ({ d: euclideanDist(xq, xo), y: yobs[idx] }))
      .filter((p) => Number.isFinite(p.d))
      .sort((a, b) => a.d - b.d);

    if (pairs.length === 0) {
      out[ri] = yMean; // fallback if no finite neighbors
      continue;
    }

    const kEff = Math.max(1, Math.min(k, pairs.length));
    const neighbors = pairs.slice(0, kEff);

    if (!weighted) {
      out[ri] =
        neighbors.reduce((s, p) => s + p.y, 0) / neighbors.length;
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