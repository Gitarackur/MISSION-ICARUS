import { useCallback, useEffect, useState } from "react";
import {
  getStorageEstimate,
  requestPersistentStorage,
} from "./storage-health";
import type { IcarusStorageEstimate } from "@/domain/storage/index.types";
import {
  STORAGE_CHANGE_EVENT,
  STORAGE_REFRESH_INTERVAL_MS,
} from "@/domain/storage/constants";

export const useStorageHealth = () => {
  const [storageEstimate, setStorageEstimate] =
    useState<IcarusStorageEstimate | null>(null);

  const refreshStorageEstimate = useCallback(async () => {
    try {
      setStorageEstimate(await getStorageEstimate());
    } catch (error) {
      console.warn("Unable to estimate Icarus storage usage", error);
    }
  }, []);

  useEffect(() => {
    void requestPersistentStorage().finally(refreshStorageEstimate);
    const refresh = () => void refreshStorageEstimate();
    window.addEventListener(STORAGE_CHANGE_EVENT, refresh);
    const interval = window.setInterval(
      refresh,
      STORAGE_REFRESH_INTERVAL_MS
    );

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, refresh);
      window.clearInterval(interval);
    };
  }, [refreshStorageEstimate]);

  return { storageEstimate, refreshStorageEstimate };
};
