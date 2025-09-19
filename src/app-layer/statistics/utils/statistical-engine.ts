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