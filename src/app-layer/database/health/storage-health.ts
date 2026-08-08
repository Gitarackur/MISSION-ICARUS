import type { IcarusStorageEstimate } from "@/domain/storage/index.types";
import { STORAGE_CHANGE_EVENT } from "@/domain/storage/constants";

export class IcarusStorageCapacityError extends Error {
  readonly code = "STORAGE_CAPACITY";
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "IcarusStorageCapacityError";
    this.cause = cause;
  }
}

export const isQuotaExceededError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  return name === "QuotaExceededError" || name === "Dexie.QuotaExceededError";
};

export const asStorageWriteError = (error: unknown) => {
  if (error instanceof IcarusStorageCapacityError) return error;
  if (!isQuotaExceededError(error)) return error;

  return new IcarusStorageCapacityError(
    "There is not enough browser storage available to save this dataset. Export or delete unused sessions, then free disk space and try again.",
    error
  );
};

export const getStorageEstimate = async (): Promise<IcarusStorageEstimate | null> => {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return null;
  }

  const [{ usage = 0, quota = 0 }, persisted] = await Promise.all([
    navigator.storage.estimate(),
    navigator.storage.persisted?.().catch(() => null) ?? Promise.resolve(null),
  ]);

  return {
    usage,
    quota,
    remaining: Math.max(0, quota - usage),
    percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
    persisted,
    measuredAt: Date.now(),
  };
};

export const requestPersistentStorage = async () => {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return null;
  }

  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
};

export const announceStorageChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
  }
};

export const formatStorageBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const unitIndex = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex < 2 ? 0 : 1)} ${
    units[unitIndex]
  }`;
};
