import { tv } from "tailwind-variants";

const sidebarStyles = tv({
  slots: {

    aside:
      "sticky bottom-0 z-40 flex h-10 w-full items-end border-t border-blue-800 bg-blue-700 text-white shadow-[0_-1px_3px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100",
    list:
      "min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]",
    ul: "flex h-10 items-stretch gap-0 px-0",
    listItem:
      "group relative flex h-10 min-w-32 max-w-52 shrink-0 items-stretch",

    header:
      "flex h-10 shrink-0 items-center bg-blue-900 gap-2 border-r border-blue-800/70 px-3 dark:border-slate-800",
    headerTitle: "text-xs font-semibold uppercase tracking-wide text-blue-100 dark:text-slate-300",

    sessionButton: `
      flex h-10 w-full min-w-0 items-center border-r px-3 pr-8 text-left text-xs font-medium
      transition-colors duration-150
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
    `,
    sessionButtonActive:
      "border-blue-800/40 bg-white text-blue-900 shadow-[inset_0_2px_0_#f0fff0] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-100 dark:shadow-[inset_0_2px_0_#38bdf8]",
    sessionButtonInactive:
      "border-blue-800/50 bg-blue-700 text-blue-50 hover:bg-blue-600 hover:text-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",

    createSection: "flex h-10 min-w-4 flex-grow items-center",
    createCard:
      "bg-gray-800 border border-gray-700 rounded-sm p-4 w-full max-w-xs text-center",

    createButton: `
      flex h-6 w-6 items-center justify-center rounded-sm border border-gray-300 bg-white text-gray-600
      hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700
      focus:outline-none focus:ring-2 focus:ring-blue-500
      transition-colors
      dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:bg-slate-800 dark:hover:text-sky-200
    `,
    createSubtext: "mt-2 text-sm text-gray-400",
    emptyStateWrapper: "flex flex-col gap-1 text-center text-gray-400",

    deleteButtonWrap:
      "absolute right-2 top-1/2 flex -translate-y-1/2 items-center opacity-100",
    deleteButton:
      "flex h-5 w-5 items-center justify-center text-blue-200 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 group-has-[:hover]:text-blue-600 dark:text-slate-400 dark:hover:bg-red-950/60 dark:hover:text-red-300",

    footer:
      "flex h-10 shrink-0 items-center border-l border-blue-800/70 px-3 text-xs text-blue-100 dark:border-slate-800 dark:text-slate-300",
  },
});

export default sidebarStyles;
