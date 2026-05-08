import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ResolvedThemeMode, ThemeMode } from "./types";
import { ThemeContext, ThemeContextValue } from "./theme-context";

const THEME_STORAGE_KEY = "icarus.theme-mode";
const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];

const getSystemTheme = (): ResolvedThemeMode =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const getStoredThemeMode = (): ThemeMode => {
  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
  return THEME_MODES.includes(storedMode as ThemeMode)
    ? (storedMode as ThemeMode)
    : "system";
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredThemeMode);
  const [systemMode, setSystemMode] = useState<ResolvedThemeMode>(getSystemTheme);
  const resolvedMode = mode === "system" ? systemMode : mode;

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return;

    const handleSystemThemeChange = () => setSystemMode(getSystemTheme());
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedMode === "dark");
    root.dataset.theme = mode;
    root.dataset.resolvedTheme = resolvedMode;
    root.style.colorScheme = resolvedMode;
  }, [mode, resolvedMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      setMode: setModeState,
      cycleMode: () => {
        const currentIndex = THEME_MODES.indexOf(mode);
        setModeState(THEME_MODES[(currentIndex + 1) % THEME_MODES.length]);
      },
    }),
    [mode, resolvedMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
