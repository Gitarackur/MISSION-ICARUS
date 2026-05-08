import { createContext } from "react";
import { ResolvedThemeMode, ThemeMode } from "./types";

export type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
