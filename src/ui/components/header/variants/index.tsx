import { tv } from "tailwind-variants";

// variants.ts
export const tabNavigationVariants = tv({
  slots: {
    tabList: "sticky left-0 right-0 -top-5 flex w-full overflow-x-auto border-b border-gray-200 bg-white pt-0 mb-4",
    tabButton: "px-4 py-4 text-sm font-medium rounded-t-lg transition-colors duration-200 ease-in-out",
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
    isScrolled: {
      true: {
        tabList: "fixed top-0 z-50", // Use 'fixed' for this effect
      },
    },
  },
});