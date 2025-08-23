import { tv } from "tailwind-variants";

// Define the floating button style using tailwind-variants
export const activityFloatingButton = tv({
  base: `fixed z-50 p-2 rounded-lg shadow-xl cursor-pointer transition-colors duration-200 flex items-center space-x-2 top-1/2 -translate-y-1/2
  text-blue-800 font-semibold text-sm right-10`,
  
  variants: {
    intent: {
      primary: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
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



// Define the Tailwind Variants for the tab navigation
export const tabNavigationVariants = tv({
  slots: {
    tabList: "fixed top-0 z-10 flex w-full overflow-x-auto border-b border-gray-200 bg-white p-2 mb-4",
    tabButton: "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ease-in-out",
  },
  variants: {
    active: {
      true: {
        tabButton: "bg-gray-100 text-blue-600 border-b-2 border-blue-600",
      },
      false: {
        tabButton: "text-gray-600 hover:bg-gray-50",
      },
    },
  },
});

