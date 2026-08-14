import { tv } from "tailwind-variants";

export const proteomicsStyles = tv({
  slots: {
    // Summary statistics section
    card: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900",
    cardTitle: "mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100",
    controlsRow: "flex flex-wrap items-end gap-4",
    controlFlex: "min-w-64 flex-1",
    controlFixed: "w-52",
    helperText: "mt-4 text-sm text-gray-500 dark:text-gray-400",
    errorText: "mt-4 text-sm font-medium text-red-600 dark:text-red-400",
    statGrid: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4",
    statCard: "flex items-center rounded-lg bg-white p-4 shadow-sm",
    iconWrapper: "flex items-center justify-center rounded-full p-3",
    icon: "h-6 w-6",
    statLabel: "text-sm font-medium text-gray-600 dark:text-gray-400",
    statValue: "text-2xl font-bold text-gray-900 dark:text-gray-100",
    primaryButton:
      "inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500",
    secondaryButton:
      "inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",

    // Plot controls + zoom pane
    plotControls: "flex flex-wrap items-end gap-4",
    zoomControls: "flex items-center gap-2",
    zoomButton:
      "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",
    zoomText:
      "min-w-14 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400",
    zoomFrame:
      "relative h-[32rem] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 xl:h-[38rem]",
    zoomContent: "h-full w-full",
    plotStatus:
      "flex h-full items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400",
    roadmapBadge:
      "mt-4 inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
    roadmapIcon: "h-4 w-4",
  },
  variants: {
    color: {
      blue: {
        iconWrapper: "bg-blue-100",
        icon: "text-blue-600",
      },
      green: {
        iconWrapper: "bg-green-100",
        icon: "text-green-600",
      },
      yellow: {
        iconWrapper: "bg-yellow-100",
        icon: "text-yellow-600",
      },
      red: {
        iconWrapper: "bg-red-100",
        icon: "text-red-600",
      },
    },
  },
});
