import { tv } from "tailwind-variants";

// tab header variants
export const headerVariants = tv({
  slots: {
    wrapper: "bg-white ",
    container: "px-6 py-4",
    flexMain:
      "flex flex-col gap-5 lg:gap-0 lg:flex-row lg:items-center lg:justify-between",
    logoWrapper: "flex flex-col items-center space-x-3",
    iconBg: "px-2 bg-white rounded-sm text-center",
    icon: "w-auto h-50 text-white",
    titleWrapper: "text-center",
    title: "!text-3xl font-bold text-gray-900",
    subtitle: "text-sm text-gray-600",
    buttonGroup: "flex ",
    buttonExport:
      "flex items-center space-x-2 px-4 py-2 text-sm bg-green-600 text-white rounded-l-sm hover:bg-green-700",
    buttonSettings:
      "flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-r-sm hover:bg-blue-700",
    buttonIcon: "w-4 h-4",
  },
});



// tab navigation variants
export const tabNavigationVariants = tv({
  slots: {
    tabList:
      "sticky left-0 right-0 top-0 z-30 flex h-9 w-full items-center justify-between overflow-hidden border-b border-gray-200 bg-gray-50/95 px-1 pt-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur dark:border-gray-800 dark:bg-gray-950/95",
    tabScroller:
      "flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth px-1 [scrollbar-width:thin]",
    tabButton: [
      "flex",
      "h-9",
      "min-w-0",
      "flex-1",
      "items-center",
      "overflow-hidden",
      "whitespace-nowrap",
      "text-ellipsis",
      "px-3",
      "text-left",
      "text-xs",
      "font-medium",
      "transition-colors",
      "duration-200",
      "ease-in-out",
      "cursor-pointer",
    ],
    visualizationList:
      "flex min-w-0 max-w-[240px] shrink-0 items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth border-l px-2 [scrollbar-width:thin]",
    visualizationButton:
      "flex h-6 w-7 flex-shrink-0 items-center justify-center rounded-sm text-[11px] font-medium transition-colors",
    visualizationTabWrapper:
      "flex shrink-0 items-center rounded-sm ring-1 ring-gray-200 dark:ring-gray-700",
    visualizationDeleteButton:
      "flex h-6 w-5 items-center justify-center rounded-r-sm text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300",
    matrixDeleteButton:
      "flex h-9 w-7 flex-shrink-0 items-center justify-center text-gray-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-300 dark:hover:bg-red-950/40 dark:hover:text-red-300 dark:focus-visible:ring-red-700",
  },
  variants: {
    active: {
      true: {
        tabButton:
          "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500",
        visualizationList: "border-blue-100 bg-blue-50/50 dark:border-blue-900/70 dark:bg-blue-950/40",
        visualizationButton:
          "bg-blue-100 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:ring-blue-700",
        matrixDeleteButton:
          "bg-blue-600 text-blue-100 hover:bg-red-600 hover:text-white dark:bg-blue-600 dark:text-blue-100 dark:hover:bg-red-600 dark:hover:text-white",
      },
      false: {
        tabButton:
          "bg-transparent text-gray-600 hover:bg-white/80 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white",
        visualizationList: "border-gray-200 dark:border-gray-700",
        visualizationButton:
          "bg-white text-gray-600 ring-1 ring-gray-200 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700 dark:hover:text-white",
        matrixDeleteButton:
          "bg-transparent hover:bg-red-50 dark:hover:bg-red-950/40",
      },
    },
  },
});


// matrix tab variants
export const matrixTabVariants = tv({
  slots: {
    wrapper:
      "group flex h-9 min-w-[176px] max-w-[340px] shrink-0 items-center overflow-hidden transition-all duration-200 hover:bg-white/70 hover:shadow-sm dark:hover:bg-gray-900",
  },
  variants: {
    active: {
      true: {
        wrapper: "bg-blue-600 shadow-sm hover:shadow-md dark:bg-blue-600",
      },
      false: {
        wrapper: "",
      },
    },
  },
});
