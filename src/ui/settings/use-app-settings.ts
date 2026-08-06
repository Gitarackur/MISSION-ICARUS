import { useContext } from "react";
import {
  AppSettingsContext,
  AppSettingsContextValue,
} from "./export-settings-context";

export const useAppSettings = (): AppSettingsContextValue => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return context;
};