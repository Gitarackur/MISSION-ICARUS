import { tv } from "tailwind-variants";

const deleteSessionModalStyles = tv({
  slots: {
    container: "space-y-5",

    warningBlock:
      "rounded-lg border border-red-300 bg-red-50 p-4 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
    warningContent: "flex items-start gap-3",
    warningIcon:
      "mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400",
    warningBody: "space-y-2",
    warningTitle: "font-semibold",
    warningText: "text-sm leading-6",

    label:
      "text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400",
    sessionName:
      "mt-1 block break-all rounded bg-gray-100 px-3 py-2 text-xs dark:bg-gray-800",

    statsGrid: "grid grid-cols-3 gap-2 text-center text-sm",
    statCard: "rounded-md border border-gray-200 p-3 dark:border-gray-700",
    statValue: "text-lg font-semibold",
    statLabel: "text-xs text-gray-500 dark:text-gray-400",

    recordCount: "text-sm text-gray-600 dark:text-gray-300",
    errorAlert:
      "rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200",

    actions:
      "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700",
    cancelButton:
      "rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800",
    deleteButton:
      "flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60",
    buttonIcon: "h-4 w-4",
  },
});

export default deleteSessionModalStyles;