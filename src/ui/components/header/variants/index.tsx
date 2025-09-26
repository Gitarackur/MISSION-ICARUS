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
    tabList: "sticky left-0 right-0 border-b border-gray-200 top-0 flex w-full overflow-x-auto overflow-y-clip bg-white pt-0 z-60",
    tabButton: [
      "relative",
      "px-6",
      "py-2",
      "text-sm",
      "font-medium",
      "transition-colors",
      "duration-200",
      "ease-in-out",
      "cursor-pointer",
      "max-w-[200px]",
      "overflow-hidden",
      "whitespace-nowrap",
      "text-ellipsis",
    ],
  },
  variants: {
    active: {
      true: {
        tabButton: [
          "bg-white",
          "text-blue-600",
          "border",
          "border-l-0",
          "border-gray-300",
          "z-20",
          "-mb-[1px]",
          "shadow-md",
        ],
      },
      false: {
        tabButton: [
          "bg-gray-100",
          "text-gray-600",
          "hover:bg-gray-50",
          "hover:text-gray-900",
          "border-x",
          "border-t",
          "border-transparent",
          "rounded-t-lg",
          "border-b-gray-200",
        ],
      },
    },
  },
});

