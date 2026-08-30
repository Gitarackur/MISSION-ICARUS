import { tv } from "tailwind-variants";

const sidebarStyles = tv({
  slots: {
    // aside:
    //   "w-60 bg-gray-900 text-white flex flex-col border-r border-gray-800 h-screen",
    // list: "overflow-y-auto",
    // ul: "space-y-1 p-2",
    // listItem: "",

    aside:
      "sticky bottom-0 z-40 flex h-10 w-full items-end border-t border-blue-800 bg-blue-700 text-white shadow-[0_-1px_3px_rgba(15,23,42,0.18)] dark:border-blue-500 dark:bg-blue-950 dark:text-blue-50",
    list:
      "min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]",
    ul: "flex h-10 items-start gap-0.5 px-2",
    listItem:
      "group relative flex h-10 min-w-32 max-w-52 shrink-0 items-start",

    header:
      "flex h-10 shrink-0 items-center gap-2 border-r border-blue-800/80 px-3 dark:border-blue-700",
    headerTitle: "text-xs font-semibold uppercase tracking-wide text-blue-100 dark:text-blue-200",

    sessionButton: `
      flex h-10 w-full min-w-0 items-center border border-b-0 px-3 pr-8 text-left text-xs font-medium
      transition-colors duration-150
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
    `,
    sessionButtonActive:
      "border-blue-100 bg-white text-blue-900 shadow-sm dark:border-blue-300 dark:bg-blue-50 dark:text-blue-950",
    sessionButtonInactive:
      "border-blue-600 bg-blue-600 text-blue-50 hover:border-blue-200 hover:bg-blue-500 hover:text-white dark:border-blue-800 dark:bg-blue-900 dark:text-blue-100 dark:hover:border-blue-500 dark:hover:bg-blue-800 dark:hover:text-white",

    createSection: "flex h-10 min-w-4 flex-grow items-center",
    createCard:
      "bg-gray-800 border border-gray-700 rounded-lg p-4 w-full max-w-xs text-center",

    createButton: `
      flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600
      hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700
      focus:outline-none focus:ring-2 focus:ring-blue-500
      transition-colors
      dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300
    `,
    createSubtext: "mt-2 text-sm text-gray-400",
    emptyStateWrapper: "flex flex-col gap-1 text-center text-gray-400",

    deleteButtonWrap:
      "absolute right-1.5 top-1/2 -translate-y-1/2 opacity-100",
    deleteButton:
      "flex h-5 w-5 items-center justify-center rounded-sm text-blue-300 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 group-has-[:hover]:text-blue-500 dark:text-blue-300 dark:hover:bg-red-950/40 dark:hover:text-red-300",

    footer:
      "flex h-10 shrink-0 items-center border-l border-blue-800/80 px-3 text-xs text-blue-100 dark:border-blue-700 dark:text-blue-200",
  },
});

export default sidebarStyles;
