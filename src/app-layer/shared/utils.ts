import { parseCSVFromFile } from '@/app-layer/shared/csv_tsc_parser';
import { ProteinRow } from '@/domain/proteins/index.types';




/* calculation specific utils */
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










/* other utils */

export const handleFileExport = (filteredData: unknown, exportName: string = "proteomics-data") => {
  const payload = JSON.stringify(filteredData, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${exportName}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export async function handleCSVFileUpload(
  file: File,
  {
    onData,
    onHeaders,
    onProcessingChange,
  }: {
    onData: (data: ProteinRow[]) => void;
    onHeaders: (headers: string[]) => void;
    onProcessingChange: (processing: boolean) => void;
  }
) {
  onProcessingChange(true);

  try {
    const result = await parseCSVFromFile<ProteinRow>(file);

    if (result.errors.length > 0) {
      console.warn('CSV parsing warnings:', result.errors);
    }

    onData(result.data);
    onHeaders(result.headers);
  } catch (err) {
    console.error('Error parsing file:', err);
  } finally {
    onProcessingChange(false);
  }
}
