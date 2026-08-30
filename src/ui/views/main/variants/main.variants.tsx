import { tv } from "tailwind-variants";

// Define the floating button style using tailwind-variants
export const activityFloatingButton = tv({
  // base: `fixed z-50 p-2 rounded-lg shadow-xl cursor-pointer transition-colors duration-200 flex items-center space-x-2 top-1/2 -translate-y-1/2
  // text-blue-800 font-semibold text-sm right-10`,

  base: "flex items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 cursor-pointer transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300",
  
  variants: {
    intent: {
      // primary: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
      primary: '',
    },
    label: {
      visible: 'block',
      hidden: 'sr-only',
    },
  },

  defaultVariants: {
    intent: 'primary',
  },
});

export const mainViewStyles = tv({
  slots: {
    workerFailureAlert:
      "fixed right-4 top-4 z-[200] flex max-w-md items-start gap-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950 shadow-xl dark:border-red-900 dark:bg-red-950 dark:text-red-100",
    workerFailureContent: "flex min-w-0 flex-1 flex-col gap-1",
    workerFailureTitle: "font-semibold",
    workerFailureActions: "flex shrink-0 items-center gap-2",
    workerFailureRetry:
      "rounded bg-red-700 px-3 py-1 font-medium text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:bg-red-600 dark:hover:bg-red-500",
    workerFailureDismiss:
      "shrink-0 rounded px-2 py-1 font-medium hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:hover:bg-red-900",
    storageAlert:
      "flex items-center justify-between gap-4 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
    storageAlertDismiss:
      "rounded px-2 py-1 font-medium hover:bg-amber-100 dark:hover:bg-amber-900",
    matrixLoadState:
      "flex h-full min-h-80 items-center justify-center text-sm text-gray-500 animate-[workspace-enter_0.3s_ease-out_both] dark:text-gray-400",
    matrixViewShell:
      "relative min-h-0 flex-1 overflow-y-auto animate-[content-fade_0.3s_ease-out]",
  },
});
