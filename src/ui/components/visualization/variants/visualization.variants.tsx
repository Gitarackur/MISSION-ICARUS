import { tv } from "tailwind-variants";

export const visualizationStyles = tv({
  slots: {
    container: "space-y-5",
    grid: "grid grid-cols-1 gap-5 xl:grid-cols-2",
    card: "bg-white rounded-lg border border-gray-200 shadow-sm p-5",
    cardHeader: "mb-4 flex items-start justify-between gap-3",
    heading: "text-base font-semibold text-gray-900",
    meta: "text-xs font-medium uppercase tracking-wide text-gray-500",
    plotContainer:
      "flex h-80 min-h-80 w-full items-center justify-center rounded-md border border-gray-100 bg-gray-50/60",
    buttonRow: "flex flex-wrap items-center gap-2",
    button:
      "inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400",
    secondaryButton:
      "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400",
    savedPreview:
      "overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm",
    savedImage: "h-96 w-full bg-gray-50 object-contain",
    emptyState:
      "rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500",
    placeholderBox:
      "bg-gray-100 h-64 rounded-md flex items-center justify-center",
    placeholderText: "text-gray-500",
  },
});
