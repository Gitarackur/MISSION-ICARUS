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
    configHeader:
      "sticky top-0 z-20 space-y-1 border-b border-gray-200 bg-white px-4 py-3 pr-5 shadow-sm dark:border-gray-700 dark:bg-gray-900",
    configStrongLabel:
      "text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200",
    configHelpText: "text-xs text-gray-500 dark:text-gray-400",
    configField: "space-y-2",
    configAngleField: "space-y-2",
    configLabel: "text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400",
    configInput: "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
    configRange: "w-full accent-blue-600",
    configToggleField:
      "flex items-center gap-3 pt-6 text-sm text-gray-700 dark:text-gray-300",
    configToggleInput:
      "h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600",
    configColorGrid: "grid grid-cols-2 gap-2",
    configColorOption:
      "flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-gray-800/80",
    configColorSwatch:
      "relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-black/15 shadow-inner dark:border-white/20",
    configColorInput: "absolute inset-0 h-full w-full cursor-pointer opacity-0",
    configColorText: "min-w-0",
    configColorName: "block",
    configColorValue:
      "block truncate font-mono text-[10px] uppercase text-gray-500 dark:text-gray-400",
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
    errorText: "text-sm font-medium text-red-600 dark:text-red-400",
    icon: "h-4 w-4",
    loadingIcon: "h-4 w-4 animate-spin",
    rendererSelect: "min-w-44",
    visualizationSelect: "max-w-md",
    rendererStatus:
      "inline-flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-300",
    viewerTransition: "animate-[fade-slide-in_220ms_ease-out]",
    plotInfoOverlay:
      "pointer-events-none absolute inset-0 z-10 flex min-h-0 items-start justify-between gap-4 p-4",
    plotInfoHelp:
      "pointer-events-auto rounded-xl border border-gray-200/80 bg-white/90 px-3 py-2 text-xs font-medium text-gray-600 shadow-sm backdrop-blur dark:border-gray-700/80 dark:bg-gray-900/90 dark:text-gray-300",
    plotActionGrid: "grid gap-3 md:grid-cols-2",
    plotActionFullField: "md:col-span-2",
    plotActionFieldLabel:
      "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200",
    plotActionContent: "space-y-3 text-center",
    rendererErrorContent: "space-y-4 text-sm text-slate-700 dark:text-slate-200",
    rendererErrorBox:
      "rounded-md border border-slate-200 bg-slate-950/95 p-4 text-xs text-slate-100 shadow-sm dark:border-slate-700 dark:bg-black",
    rendererErrorTitle:
      "mb-2 font-semibold uppercase tracking-wide text-rose-300",
    rendererErrorMessage:
      "max-h-[48vh] overflow-auto whitespace-pre-wrap break-words font-mono leading-6 text-slate-100",

    zoomText: "min-w-14 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400",

    displayActiveImageContainer: "relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950",
    settingsPanelContainer:
      "pointer-events-auto isolate max-h-full min-h-0 w-full max-w-sm shrink-0 overflow-y-auto overscroll-contain rounded-2xl border border-gray-200/80 bg-white shadow-xl [scrollbar-gutter:stable] focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent dark:border-gray-700/80 dark:bg-gray-900 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600",
  },
  variants: {
    compact: {
      true: {
        configPanel:
          "relative block gap-0 rounded-none border-0 bg-transparent p-0 animate-none dark:bg-transparent",
        configGrid:
          "grid-cols-1 gap-3 p-4 pr-3 md:grid-cols-1 xl:grid-cols-1",
      },
      false: {},
    },
    xAngleDisabled: {
      true: {
        configAngleField: "opacity-55",
      },
      false: {},
    },
  },
  defaultVariants: {
    compact: false,
    xAngleDisabled: false,
  },
});
