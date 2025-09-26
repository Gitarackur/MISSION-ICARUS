import { tv } from "tailwind-variants";

// Tailwind Variants: slots
export const proteomicsPagestyles = tv({
  slots: {
    container: 'min-h-screen bg-gray-50',
    stickyHeader: 'top-12 z-20 bg-gray-50 border-y border-gray-200 sticky',
    contentPadding: 'p-6',
    sectionSpacing: 'space-y-6',
    filterBox: 'bg-white rounded-lg shadow p-6',
    filterHeader: 'font-medium mb-2',
    filterText: 'text-sm text-gray-600',
  },
});
