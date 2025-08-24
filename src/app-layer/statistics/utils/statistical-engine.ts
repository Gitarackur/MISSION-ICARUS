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
      return (value - min_value) / (max_value - min_value)
    })
  })
}