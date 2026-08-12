import type { ProteinRow } from "@/domain/proteins/index.types";
import type { TableMatrix } from "@/domain/workflow/main.types";

export type StatisticalInput = ProteinRow[] | Map<string, TableMatrix>;
export type ScientificBackend = "python" | "r";
export type ProgressCallback = (progress?: number, detail?: string) => void;
