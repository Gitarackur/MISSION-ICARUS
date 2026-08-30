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
      gap-x-0.5 gap-y-1
      max-w-full 
    `,
    base: `
      flex items-center space-x-2
      px-3 py-1
      border-b-2 font-medium text-xs
      flex-grow sm:flex-grow-0 min-w-0
      transition-colors duration-200 ease-in-out
      focus:outline-none  focus:ring-offset-2
    `,
    icon: "flex-shrink-0",
  },
  variants: {
    active: {
      true: {
        icon: "text-blue-600 dark:text-blue-300",
        base: "border-blue-600 text-blue-600 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-300",
      },
      false: {
        icon: "text-gray-600 dark:text-gray-400",
        base:
          "border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300 dark:text-gray-400 dark:hover:text-blue-300",
      },
    },
  },
});
