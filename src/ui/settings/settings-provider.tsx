import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ExportFormat, CsvDelimiter } from "@/app-layer/shared/exporter";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  ExportScope,
} from "./settings.types";
import { AppSettingsContext } from "./export-settings-context";
import type { AppSettingsContextValue } from "./export-settings-context";

const STORAGE_KEY = "icarus.app-settings";

const readStored = (): AppSettings => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(readStored);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setDefaultExportFormat = useCallback((defaultExportFormat: ExportFormat) => {
    setSettings((previous) => ({ ...previous, defaultExportFormat }));
  }, []);

  const setDelimiter = useCallback((delimiter: CsvDelimiter) => {
    setSettings((previous) => ({ ...previous, delimiter }));
  }, []);

  const setIncludeHeaders = useCallback((includeHeaders: boolean) => {
    setSettings((previous) => ({ ...previous, includeHeaders }));
  }, []);

  const setIncludeMetadataColumns = useCallback(
    (includeMetadataColumns: boolean) => {
      setSettings((previous) => ({ ...previous, includeMetadataColumns }));
    },
    []
  );

  const setExportScope = useCallback((exportScope: ExportScope) => {
    setSettings((previous) => ({ ...previous, exportScope }));
  }, []);

  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      settings,
      setDefaultExportFormat,
      setDelimiter,
      setIncludeHeaders,
      setIncludeMetadataColumns,
      setExportScope,
      resetSettings,
    }),
    [
      settings,
      setDefaultExportFormat,
      setDelimiter,
      setIncludeHeaders,
      setIncludeMetadataColumns,
      setExportScope,
      resetSettings,
    ]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};