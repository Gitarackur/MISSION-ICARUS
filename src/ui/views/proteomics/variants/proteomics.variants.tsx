import { tv } from "tailwind-variants";

// Tailwind Variants: slots
export const proteomicsPagestyles = tv({
  slots: {
    container: 'min-h-full bg-gray-50 dark:bg-gray-950',
    stickyHeader: 'top-0 z-20 sticky bg-white dark:bg-gray-950',
    contentPadding: 'p-6',
    sectionSpacing: 'space-y-6',
    filterBox: 'bg-white rounded-lg shadow p-6 dark:bg-gray-900',
    filterHeader: 'font-medium mb-2 dark:text-gray-100',
    filterText: 'text-sm text-gray-600 dark:text-gray-400',
  },
});
