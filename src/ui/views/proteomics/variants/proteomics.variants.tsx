import { tv } from "tailwind-variants";

// Tailwind Variants: slots
export const proteomicsPagestyles = tv({
  slots: {
    container: 'min-h-screen bg-gray-50 dark:bg-gray-950',
    stickyHeader: 'top-12 z-20 bg-gray-50 border-y border-gray-200 sticky dark:border-gray-800 dark:bg-gray-950',
    contentPadding: 'p-6',
    workerError:
      'mb-4 flex items-center justify-between gap-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
    workerErrorText: 'min-w-0 flex-1',
    workerRetryButton:
      'shrink-0 rounded-md bg-red-700 px-3 py-1.5 font-medium text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-500',
    workerStatus:
      'mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100',
    sectionSpacing: 'space-y-6',
    filterBox: 'bg-white rounded-lg shadow p-6 dark:bg-gray-900',
    filterHeader: 'font-medium mb-2 dark:text-gray-100',
    filterText: 'text-sm text-gray-600 dark:text-gray-400',
  },
});
