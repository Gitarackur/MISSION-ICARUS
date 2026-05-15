const MISSING_VALUE_TOKENS = new Set([
  "",
  "n/a",
  "na",
  "nan",
  "null",
  "#n/a",
  "-",
]);

const normalizeNumericToken = (value: string) =>
  value
    .trim()
    .replace(/\u00a0/g, " ")
    .replace(/[\s']/g, "");

const countOccurrences = (value: string, token: string) =>
  value.split(token).length - 1;

const isThousandsGrouping = (parts: string[]) =>
  parts.length > 1 &&
  parts.slice(1).every((part) => /^\d{3}$/.test(part)) &&
  /^\d{1,3}$/.test(parts[0].replace(/^[-+]/, ""));

const normalizeGroupedNumber = (
  value: string,
  decimalSeparator: "," | "."
) => {
  const thousandsSeparator = decimalSeparator === "," ? "." : ",";
  return value
    .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
    .replace(decimalSeparator, ".");
};

export const isMissingValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return !Number.isFinite(value);

  const normalized = normalizeNumericToken(String(value)).toLowerCase();
  return MISSING_VALUE_TOKENS.has(normalized);
};

export const looksNumericLike = (value: unknown): boolean => {
  if (typeof value === "number") return true;
  if (typeof value !== "string") return false;

  const normalized = normalizeNumericToken(value);
  return /^[+-]?[\d.,eE]+$/.test(normalized) && /\d/.test(normalized);
};

export const parseLocalizedNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeNumericToken(value);
  if (!normalized || isMissingValue(normalized)) {
    return null;
  }

  if (/^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(normalized)) {
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const commaCount = countOccurrences(normalized, ",");
  const dotCount = countOccurrences(normalized, ".");

  if (commaCount > 0 && dotCount > 0) {
    const decimalSeparator =
      normalized.lastIndexOf(",") > normalized.lastIndexOf(".") ? "," : ".";
    const parsed = Number(normalizeGroupedNumber(normalized, decimalSeparator));
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (commaCount > 0) {
    const parts = normalized.split(",");
    const parsed = Number(
      isThousandsGrouping(parts) ? parts.join("") : parts.join(".")
    );
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (dotCount > 0) {
    const parts = normalized.split(".");
    const parsed = Number(
      isThousandsGrouping(parts) ? parts.join("") : normalized
    );
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const toNumberIfPossible = (
  value: string | undefined
): number | string => {
  if (value == null) return "N/A";

  const trimmed = value.trim();
  if (isMissingValue(trimmed)) return "N/A";

  const parsed = parseLocalizedNumber(trimmed);
  return parsed ?? trimmed;
};

export const formatNumericDisplayValue = (value: unknown): string | number => {
  if (isMissingValue(value)) {
    return "N/A";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : "N/A";
  }

  return String(value);
};

export const getNumericCellState = (
  value: unknown
): "valid" | "missing" | "invalid" => {
  if (isMissingValue(value)) {
    return "missing";
  }

  return parseLocalizedNumber(value) !== null ? "valid" : "invalid";
};
