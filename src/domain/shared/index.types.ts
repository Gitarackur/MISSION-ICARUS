export interface ParsedCSVResult<T> {
  data: T[];
  headers: string[];
  errors: string[];
}