import { tv } from "tailwind-variants";

// tab header variants
export const headerVariants = tv({
  slots: {
    wrapper: 'bg-white shadow-sm',
    container: 'px-6 py-4',
    flexMain: 'flex flex-col gap-5 lg:gap-0 lg:flex-row lg:items-center lg:justify-between',
    logoWrapper: 'flex items-center space-x-3',
    iconBg: 'p-2 bg-blue-600 rounded-lg',
    icon: 'w-6 h-6 text-white',
    titleWrapper: '',
    title: 'text-xl font-bold text-gray-900',
    subtitle: 'text-sm text-gray-600',
    buttonGroup: 'flex space-x-2',
    buttonExport:
      'flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700',
    buttonSettings:
      'flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
    buttonIcon: 'w-4 h-4',
  },
});



// tab navigation variants
export const tabNavigationVariants = tv({
  slots: {
    tabList: "sticky left-0 right-0 -top-5 flex w-full overflow-x-auto border-b border-gray-200 bg-white pt-0 mb-4 z-40",
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
          "border-x",
          "border-t",
          "border-gray-300",
          "border-b-white",
          "z-20",
          "rounded-t-lg",
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

