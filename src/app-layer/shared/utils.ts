export function isNumericString(s: string | undefined) {
  if (s == null) return false;
  return /^[-+]?\d*(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(s.trim());
}

export function toNumberIfPossible(s: string | undefined): number | string {
  if (s == null) return '';
  const trimmed = s.trim();
  if (trimmed === '') return '';
  if (isNumericString(trimmed)) return Number(trimmed);
  return trimmed;
}

export function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]) {
  if (!values.length) return 0;
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 === 0 ? (v[mid - 1] + v[mid]) / 2 : v[mid];
}

export function stddev(values: number[]) {
  if (!values.length) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, x) => acc + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function safeLog2Ratio(numerator: number, denominator: number) {
  if (!isFinite(numerator) || !isFinite(denominator) || numerator <= 0 || denominator <= 0) return NaN;
  return Math.log2(numerator / denominator);
}