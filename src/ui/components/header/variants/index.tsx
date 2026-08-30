import { tv } from "tailwind-variants";

// tab header variants
export const headerVariants = tv({
  slots: {
    wrapper: "bg-white ",
    container: "px-6 py-4",
    flexMain:
      "flex flex-col gap-5 lg:gap-0 lg:flex-row lg:items-center lg:justify-between",
    logoWrapper: "flex flex-col items-center space-x-3",
    iconBg: "px-2 bg-white rounded-lg text-center",
    icon: "w-auto h-50 text-white",
    titleWrapper: "text-center",
    title: "!text-3xl font-bold text-gray-900",
    subtitle: "text-sm text-gray-600",
    buttonGroup: "flex ",
    buttonExport:
      "flex items-center space-x-2 px-4 py-2 text-sm bg-green-600 text-white rounded-l-lg hover:bg-green-700",
    buttonSettings:
      "flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-r-lg hover:bg-blue-700",
    buttonIcon: "w-4 h-4",
  },
});



// tab navigation variants
export const tabNavigationVariants = tv({
  slots: {
    tabList:
      "sticky left-0 right-0 top-0 z-30 flex h-8 w-full items-stretch justify-between overflow-hidden border-b border-gray-200 bg-white pt-0 dark:border-gray-700 dark:bg-gray-950",
    tabScroller:
      "flex min-w-0 flex-1 items-end overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth [scrollbar-width:thin]",
    tabButton: [
      "flex",
      "min-h-7",
      "min-w-0",
      "flex-1",
      "items-center",
      "overflow-hidden",
      "whitespace-nowrap",
      "text-ellipsis",
      "px-2.5",
      "py-0.5",
      "text-left",
      "text-sm",
      "font-medium",
      "transition-colors",
      "duration-200",
      "ease-in-out",
      "cursor-pointer",
    ],
    visualizationList:
      "flex min-w-0 max-w-[240px] shrink-0 items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth border-l px-2 [scrollbar-width:thin]",
    visualizationButton:
      "flex h-6 w-7 flex-shrink-0 items-center justify-center rounded text-[11px] font-medium transition-colors",
    visualizationTabWrapper:
      "flex shrink-0 items-center rounded ring-1 ring-gray-200 dark:ring-gray-700",
    visualizationDeleteButton:
      "flex h-6 w-5 items-center justify-center rounded-r text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300",
    matrixDeleteButton:
      "flex min-h-7 w-7 flex-shrink-0 items-center justify-center border-l text-gray-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-300 dark:hover:bg-red-950/40 dark:hover:text-red-300 dark:focus-visible:ring-red-700",
  },
  variants: {
    active: {
      true: {
        tabButton:
          "bg-white text-blue-600 hover:bg-blue-50/70 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-blue-950/35",
        visualizationList: "border-blue-100 bg-blue-50/50 dark:border-blue-900/70 dark:bg-blue-950/40",
        visualizationButton:
          "bg-blue-100 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:ring-blue-700",
        matrixDeleteButton:
          "border-blue-100 bg-white hover:bg-red-50 dark:border-blue-900/70 dark:bg-gray-900 dark:hover:bg-red-950/40",
      },
      false: {
        tabButton:
          "bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-950 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
        visualizationList: "border-gray-200 dark:border-gray-700",
        visualizationButton:
          "bg-white text-gray-600 ring-1 ring-gray-200 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700 dark:hover:text-white",
        matrixDeleteButton:
          "border-gray-200 bg-gray-100 hover:bg-red-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-red-950/40",
      },
    },
  },
});


// matrix tab variants
export const matrixTabVariants = tv({
  slots: {
    wrapper:
      "ml-0.5 flex min-w-[180px] max-w-[360px] shrink-0 items-stretch overflow-hidden rounded-t-sm bg-gray-100 transition-shadow duration-200 hover:shadow-sm dark:bg-gray-900",
  },
  variants: {
    active: {
      true: {
        wrapper: "bg-white shadow-sm hover:shadow-md dark:bg-gray-900",
      },
      false: {
        wrapper: "",
      },
    },
  },
});
