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
      "z-30 sticky left-0 right-0 top-0 flex w-full overflow-x-auto overflow-y-hidden border-b border-gray-200 bg-white pt-0 dark:border-gray-700 dark:bg-gray-950",
    tabButton: [
      "relative",
      "min-w-[160px]",
      "max-w-[220px]",
      "flex-1",
      "overflow-hidden",
      "whitespace-nowrap",
      "text-ellipsis",
      "border-r-0",
      "px-4",
      "py-2",
      "text-left",
      "text-sm",
      "font-medium",
      "transition-colors",
      "duration-200",
      "ease-in-out",
      "cursor-pointer",
    ],
    visualizationList:
      "flex max-w-[220px] flex-shrink-0 items-center gap-1 overflow-x-auto border-l px-2",
    visualizationButton:
      "flex h-6 w-7 flex-shrink-0 items-center justify-center rounded text-[11px] font-medium transition-colors",
  },
  variants: {
    active: {
      true: {
        tabButton:
          "bg-white text-blue-600 border border-l-0 border-gray-300 z-20 -mb-[1px] shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-blue-300",
        visualizationList: "border-blue-100 bg-blue-50/50 dark:border-blue-900/70 dark:bg-blue-950/40",
        visualizationButton:
          "bg-blue-100 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:ring-blue-700",
      },
      false: {
        tabButton:
          "bg-gray-100 text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-x border-t border-transparent rounded-t-lg border-b-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
        visualizationList: "border-gray-200 dark:border-gray-700",
        visualizationButton:
          "bg-white text-gray-600 ring-1 ring-gray-200 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700 dark:hover:text-white",
      },
    },
  },
});


// matrix tab variants
export const matrixTabVariants = tv({
  slots: {
    wrapper:
      "flex min-w-[260px] max-w-[420px] items-stretch border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900",
  },
  variants: {
    active: {
      true: {
        wrapper: "bg-white shadow-sm ring-1 ring-inset ring-blue-200 dark:bg-gray-900 dark:ring-blue-800",
      },
      false: {
        wrapper: "",
      },
    },
  },
});
