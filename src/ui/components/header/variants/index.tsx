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
    tabList: "flex max-w-[190px] items-center gap-1 border-r px-2",
    tabButton: "flex max-w-[58px] flex-shrink-0 items-center justify-center rounded px-2 py-1 text-[11px] font-medium transition-colors",
    tabButtonWrapper: "min-w-[140px] max-w-none flex-1 border-r-0 text-left"
  },
  variants: {
    active: {
      true: {
        tabList: "border-blue-100 bg-blue-50/50",
        tabButton: "bg-blue-100 text-blue-700 ring-1 ring-blue-300",
      },
      false: {
        tabList: "border-gray-200",
        tabButton: "bg-white text-gray-600 ring-1 ring-gray-200 hover:text-gray-900",
      },
    },
  },
});


// matrix tab variants
export const matrixTabVariants = tv({
  slots: {
    wrapper: "flex min-w-[220px] max-w-[440px] items-stretch border-r border-gray-200 bg-gray-50",
  },
  variants: {
    active: {
      true: {
        wrapper: "bg-white shadow-sm ring-1 ring-inset ring-blue-200",
      },
      false: {
        wrapper: "",
      },
    },
  },
});
