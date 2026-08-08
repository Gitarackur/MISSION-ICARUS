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
    actionRow: "mt-auto pt-2",
    exportButton: "flex w-full items-center justify-center gap-2",
    buttonIcon: "h-4 w-4"
  }
});
