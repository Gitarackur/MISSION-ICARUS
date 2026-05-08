import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeMode } from "./use-theme-mode";

const THEME_LABELS = {
  light: "Light",
  dark: "Dark",
  system: "System",
} as const;

export function ThemeModeControl() {
  const { mode, resolvedMode, cycleMode } = useThemeMode();
  const Icon = mode === "system" ? Monitor : resolvedMode === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      className="flex items-center gap-2 text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
      onClick={cycleMode}
      title={`Theme: ${THEME_LABELS[mode]}`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden text-sm xl:inline">{THEME_LABELS[mode]}</span>
    </button>
  );
}
