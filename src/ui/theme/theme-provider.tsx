import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { ResolvedThemeMode, ThemeMode } from "./types";
import { ThemeContext, ThemeContextValue } from "./theme-context";

const THEME_STORAGE_KEY = "icarus.theme-mode";
const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];
const THEME_FLIP_CLASS = "disable-theme-transitions";

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

  useLayoutEffect(() => {
    const root = document.documentElement;

    // Many components carry `transition-colors`/`transition-all`. A CSS
    // transition's first painted frame renders the OLD color before morphing,
    // which reads as a flash. Disabling transitions on the same recalc as the
    // palette flip forces the theme to change in a single paint, then we
    // re-enable transitions after that frame so hover/focus animations keep
    // working normally.
    root.classList.add(THEME_FLIP_CLASS);
    root.classList.toggle("dark", resolvedMode === "dark");
    root.dataset.theme = mode;
    root.dataset.resolvedTheme = resolvedMode;
    root.style.colorScheme = resolvedMode;

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        root.classList.remove(THEME_FLIP_CLASS);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
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
