import { tv } from "tailwind-variants";

// Define the floating button style using tailwind-variants
export const activityFloatingButton = tv({
  // base: `fixed z-50 p-2 rounded-lg shadow-xl cursor-pointer transition-colors duration-200 flex items-center space-x-2 top-1/2 -translate-y-1/2
  // text-blue-800 font-semibold text-sm right-10`,

  base: "text-sm bg-blue-500 text-white rounded px-4 py-1 flex items-center cursor-pointer",
  
  variants: {
    intent: {
      // primary: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
      primary: 'bg-blue-500',
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
    storageAlert:
      "flex items-center justify-between gap-4 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
    storageAlertDismiss:
      "rounded px-2 py-1 font-medium hover:bg-amber-100 dark:hover:bg-amber-900",
    matrixLoadState:
      "flex h-full min-h-80 items-center justify-center text-sm text-gray-500 dark:text-gray-400",
  },
});
