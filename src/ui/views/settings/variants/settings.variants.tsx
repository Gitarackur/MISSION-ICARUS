import { tv } from "tailwind-variants";

// Shared sheet body + section layout
export const settingsPanelStyles = tv({
  slots: {
    container: "flex flex-col gap-6 p-5",
    section: "flex flex-col gap-3",
    sectionTitle: "text-sm font-semibold text-gray-800 dark:text-gray-100",
    fieldGroup: "flex flex-col gap-4",
    optionsGroup: "flex flex-col gap-3 pt-1",
    actionRow: "mt-auto flex gap-2"
  }
});

// Export sheet styles
export const exportSheetStyles = tv({
  slots: {
    container: "flex flex-col gap-5 p-5",
    section: "flex flex-col gap-3",
    sectionTitle: "text-sm font-semibold text-gray-800 dark:text-gray-100",
    grid: "grid grid-cols-2 gap-2",
    formatOption:
      "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
    formatIcon: "h-5 w-5",
    formatLabel: "text-sm font-medium text-gray-800 dark:text-gray-100",
    formatDescription: "text-xs text-gray-500 dark:text-gray-400",
    actionRow: "mt-auto pt-2",
    exportButton: "flex w-full items-center justify-center gap-2",
    buttonIcon: "h-4 w-4"
  },
  variants: {
    active: {
      true: {
        formatOption:
          "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40",
        formatIcon: "text-blue-600 dark:text-blue-300"
      },
      false: {
        formatOption:
          "border-gray-300 hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-600",
        formatIcon: "text-gray-500 dark:text-gray-400"
      }
    }
  },
  defaultVariants: {
    active: false
  }
});

// Theme swatch styles for the settings panel
export const themeSwatchStyles = tv({
  slots: {
    grid: "grid grid-cols-3 gap-2",
    swatch: "flex flex-col items-center gap-1 rounded-md border py-3 transition-colors",
    icon: "h-5 w-5 text-gray-500 dark:text-gray-400",
    label: "text-sm font-medium text-gray-800 dark:text-gray-100"
  },
  variants: {
    active: {
      true: {
        swatch:
          "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40"
      },
      false: {
        swatch:
          "border-gray-300 hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-600"
      }
    }
  },
  defaultVariants: {
    active: false
  }
});