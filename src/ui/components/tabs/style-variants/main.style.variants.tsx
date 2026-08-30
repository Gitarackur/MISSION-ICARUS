import { tv } from "tailwind-variants";

// Define button variants with tailwind-variants
export const tabButtonStyles = tv({
  slots: {
    navContainer:
      "overflow-x-hidden border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950",
    subNavContainer:
      "flex min-h-8 max-w-full items-center justify-between px-2 sm:px-4",
    navBase: `
      inline-flex flex-wrap justify-center sm:justify-start
      gap-x-0 gap-y-1
      max-w-full 
    `,
    base: `
      flex items-center space-x-2
      px-3 pb-1.5 pt-2
      border-b-2 border-x border-x-transparent font-medium text-xs
      flex-grow sm:flex-grow-0 min-w-0
      transition-colors duration-200 ease-in-out
      focus:outline-none  focus:ring-offset-2
    `,
    icon: "flex-shrink-0",
  },
  variants: {
    active: {
      true: {
        icon: "text-emerald-700 dark:text-emerald-300",
        base: "border-b-emerald-600 border-x-gray-200 bg-emerald-50 text-emerald-800 dark:border-b-emerald-400 dark:border-x-gray-800 dark:bg-emerald-950/35 dark:text-emerald-200",
      },
      false: {
        icon: "text-gray-600 dark:text-gray-400",
        base:
          "border-b-transparent text-gray-600 hover:border-b-emerald-300 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:border-b-emerald-700 dark:hover:bg-gray-900 dark:hover:text-white",
      },
    },
  },
});
