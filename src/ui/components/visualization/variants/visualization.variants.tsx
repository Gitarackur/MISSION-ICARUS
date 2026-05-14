import { tv } from "tailwind-variants";

export const visualizationStyles = tv({
  slots: {
    container: "space-y-6",
    hero: "rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 dark:border-gray-800 dark:bg-gray-900",
    toolbar: "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
    titleBlock: "space-y-1",
    actionRow: "flex flex-wrap items-center gap-2",
    chipRow: "flex gap-2 overflow-x-auto pb-2",
    chip: "inline-flex min-w-fit items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800",
    chipActive: "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-950 dark:text-blue-200",
    viewerFrame: "overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-inner transition-all duration-200 dark:border-gray-800 dark:bg-gray-950",
    viewerImage: "h-[32rem] w-full bg-white object-contain p-4 transition-all duration-200 dark:bg-gray-950 xl:h-[38rem]",
    viewerEmpty: "flex h-[32rem] items-center justify-center px-6 text-center text-sm text-gray-500 dark:text-gray-400 xl:h-[38rem]",
    configPanel: "grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950 animate-[fade-slide-in_180ms_ease-out]",
    configGrid: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
    configField: "space-y-2",
    configLabel: "text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400",
    configInput: "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
    configRange: "w-full accent-blue-600",
    gallerySection: "space-y-3",
    galleryMeta: "text-sm text-gray-600 dark:text-gray-400",
    plotLibrary: "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3",
    card: "rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900",
    cardHeader: "mb-4 flex items-start justify-between gap-3",
    heading: "text-base font-semibold text-gray-900 dark:text-gray-100",
    meta: "text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400",
    plotContainer:
      "flex min-h-36 w-full items-center justify-center rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-950/60",
    buttonRow: "flex flex-wrap items-center gap-2",
    button:
      "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 bg-blue-600 hover:bg-blue-400  dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300",
    secondaryButton:
      "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",
    tertiaryButton:
      "inline-flex items-center justify-center rounded-md border border-transparent bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900",
    savedPreview:
      "overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900",
    savedImage: "h-96 w-full bg-gray-50 object-contain dark:bg-gray-950",
    emptyState:
      "rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400",
    placeholderBox:
      "bg-gray-100 h-40 rounded-md flex items-center justify-center dark:bg-gray-950",
    placeholderText: "text-gray-500 dark:text-gray-400",
    subtleText: "text-sm text-gray-600 dark:text-gray-400",

    zoomText: "min-w-14 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400",

    displayActiveImageContainer: "relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950",
    settingsPanelContainer: "pointer-events-auto max-h-[calc(100%-1rem)] w-full max-w-sm overflow-auto rounded-2xl border border-gray-200/80 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-gray-700/80 dark:bg-gray-900/95"
  },
});
