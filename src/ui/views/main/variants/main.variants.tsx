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

