import { tv } from "tailwind-variants";

export const selectionCardStyles = tv({
  slots: {
    root:
      "flex w-full flex-col gap-1 rounded-md border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-gray-950",
    icon: "h-5 w-5 shrink-0 [&>svg]:h-full [&>svg]:w-full",
    content: "flex min-w-0 flex-col gap-1",
    label: "text-sm font-medium text-gray-800 dark:text-gray-100",
    description: "text-xs text-gray-500 dark:text-gray-400",
  },
  variants: {
    selected: {
      true: {
        root:
          "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40",
        icon: "text-blue-600 dark:text-blue-300",
      },
      false: {
        root:
          "border-gray-300 hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-600",
        icon: "text-gray-500 dark:text-gray-400",
      },
    },
    align: {
      start: {
        root: "items-start text-left",
        content: "items-start text-left",
      },
      center: {
        root: "items-center text-center",
        content: "items-center text-center",
      },
    },
  },
  defaultVariants: {
    selected: false,
    align: "start",
  },
});
