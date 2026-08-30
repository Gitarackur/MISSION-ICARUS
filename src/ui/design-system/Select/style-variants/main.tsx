import { tv } from "tailwind-variants";

// Create tailwind-variants for single select
export const singleSelect = tv({
  slots: {
    container: "relative w-full",
    label: "block text-sm font-medium mb-2 transition-colors text-gray-700 dark:text-gray-200",
    trigger:
      "min-h-9 w-full px-3 py-1.5 border rounded-sm shadow-sm bg-white text-sm leading-5 text-gray-900 cursor-pointer transition-all duration-200 flex items-center justify-between border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-gray-600",
    content: "min-w-0 flex-1 flex items-center gap-2 overflow-hidden",
    placeholder: "truncate text-sm leading-5 text-gray-500 select-none dark:text-gray-500",
    selectedText: "truncate text-sm leading-5 text-gray-900 select-none dark:text-gray-100",
    selectedDescription: "truncate text-xs text-gray-500 select-none dark:text-gray-400",
    dropdown:
      "bg-white border border-gray-200 rounded-sm shadow-lg overflow-hidden dark:border-gray-700 dark:bg-gray-900",
    searchContainer: "p-2 border-b border-gray-100 dark:border-gray-800",
    searchInput:
      "w-full min-h-8 px-3 py-1.5 text-sm border border-gray-200 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500",
    optionsList: "max-h-48 overflow-y-auto",
    option:
      "flex min-h-9 items-center px-3 py-2 cursor-pointer transition-colors select-none hover:bg-gray-50 dark:hover:bg-gray-800",
    optionContent: "min-w-0 flex-1",
    optionText: "truncate text-sm leading-5 dark:text-gray-100",
    optionDescription: "text-xs text-gray-500 mt-1 dark:text-gray-400",
    checkIcon: "w-4 h-4 ml-2 text-blue-600",
    footer:
      "px-3 py-2 border-t border-gray-100 text-xs bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400",
    clearButton: "text-gray-400 hover:text-gray-600 transition-colors p-0.5 dark:hover:text-gray-200",
    chevron: "text-gray-400 transition-transform duration-200 dark:text-gray-500",
    errorText: "text-red-600",
    helperText: "text-gray-500 dark:text-gray-400",
  },
  variants: {
    size: {
      sm: {
        trigger: "min-h-8 px-2.5 py-1 text-sm",
        selectedText: "text-sm",
        searchInput: "min-h-8 px-2.5 py-1 text-xs",
        option: "min-h-8 px-2.5 py-1.5",
        optionText: "text-xs",
        optionDescription: "text-xs",
      },
      md: {
        trigger: "min-h-9 px-3 py-1.5",
        selectedText: "text-sm",
        searchInput: "min-h-8 px-3 py-1.5 text-sm",
        option: "min-h-9 px-3 py-2",
        optionText: "text-sm",
        optionDescription: "text-xs",
      },
      lg: {
        trigger: "min-h-10 px-3.5 py-2",
        selectedText: "text-sm",
        searchInput: "min-h-9 px-3.5 py-2 text-sm",
        option: "min-h-10 px-3.5 py-2",
        optionText: "text-sm",
        optionDescription: "text-sm",
      },
    },
    variant: {
      default: {},
      secondary: {
        label: "text-gray-700 dark:text-gray-200",
        trigger:
          "border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-gray-500 focus-within:border-gray-500 dark:border-gray-700 dark:hover:border-gray-600",
        dropdown: "border-gray-200 dark:border-gray-700",
        searchInput:
          "border-gray-200 focus:ring-gray-500 focus:border-gray-500 dark:border-gray-700",
        option:
          "hover:bg-gray-50 data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-800 dark:hover:bg-gray-800 dark:data-[selected=true]:bg-gray-800 dark:data-[selected=true]:text-gray-100",
        checkIcon: "text-gray-600",
        footer: "bg-gray-50 text-gray-600 border-gray-100 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400",
      },
      success: {
        label: "text-gray-700 dark:text-gray-200",
        trigger:
          "border-green-300 hover:border-green-400 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 dark:border-green-800",
        dropdown: "border-green-200 dark:border-green-800",
        searchInput:
          "border-green-200 focus:ring-green-500 focus:border-green-500 dark:border-green-800",
        option:
          "hover:bg-green-50 data-[selected=true]:bg-green-50 data-[selected=true]:text-green-700 dark:hover:bg-green-950 dark:data-[selected=true]:bg-green-950 dark:data-[selected=true]:text-green-200",
        checkIcon: "text-green-600",
        footer: "bg-green-50 text-green-600 border-green-100 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
      },
      error: {
        label: "text-red-700 dark:text-red-300",
        trigger:
          "border-red-300 hover:border-red-400 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 dark:border-red-800",
        dropdown: "border-red-200 dark:border-red-800",
        searchInput: "border-red-200 focus:ring-red-500 focus:border-red-500 dark:border-red-800",
        option:
          "hover:bg-red-50 data-[selected=true]:bg-red-50 data-[selected=true]:text-red-700 dark:hover:bg-red-950 dark:data-[selected=true]:bg-red-950 dark:data-[selected=true]:text-red-200",
        checkIcon: "text-red-600",
        footer: "bg-red-50 text-red-600 border-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
      },
    },
    disabled: {
      true: {
        trigger: "bg-gray-50 cursor-not-allowed opacity-60 dark:bg-gray-800",
        label: "text-gray-400 dark:text-gray-500",
      },
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
    disabled: false,
  },
});















// Create tailwind-variants for multi-select
export const multiSelect = tv({
  slots: {
    container: "relative w-full",
    label: "block text-sm font-medium mb-2 transition-colors text-gray-700 dark:text-gray-200",
    trigger:
      "min-h-9 w-full px-3 py-1.5 border rounded-sm shadow-sm bg-white text-sm leading-5 text-gray-900 cursor-pointer transition-all duration-200 flex items-center justify-between border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-gray-600",
    content: "min-w-0 flex-1 flex flex-wrap gap-1 overflow-hidden",
    placeholder: "truncate py-0.5 text-sm leading-5 text-gray-500 select-none dark:text-gray-500",
    dropdown:
      "bg-white border border-gray-200 rounded-sm shadow-lg overflow-hidden dark:border-gray-700 dark:bg-gray-900",
    searchContainer: "p-2 border-b border-gray-100 dark:border-gray-800",
    searchInput:
      "w-full min-h-8 px-3 py-1.5 text-sm border border-gray-200 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500",
    optionsList: "max-h-48 overflow-y-auto",
    option:
      "flex min-h-9 items-center px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
    checkbox:
      "flex items-center justify-center w-4 h-4 mr-3 border border-gray-300 rounded transition-all duration-200 data-[selected=true]:bg-blue-500 data-[selected=true]:border-blue-500 data-[selected=true]:text-white dark:border-gray-600",
    optionText: "truncate text-sm leading-5 select-none text-gray-700 dark:text-gray-100",
    footer:
      "px-3 py-2 border-t border-gray-100 text-xs bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400",
    tag: "inline-flex max-w-full items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs leading-5 transition-all duration-200 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900",
    tagRemove: "hover:bg-opacity-20 rounded-full p-0.5 transition-colors",
    clearButton: "text-gray-400 hover:text-gray-600 transition-colors p-0.5 dark:hover:text-gray-200",
    chevron: "text-gray-400 transition-transform duration-200 dark:text-gray-500",
    errorText: "text-red-600",
    helperText: "text-gray-500 dark:text-gray-400",
  },
  variants: {
    size: {
      sm: {
        trigger: "min-h-8 px-2.5 py-1 text-sm",
        tag: "px-2 py-0.5 text-xs",
        searchInput: "min-h-8 px-2.5 py-1 text-xs",
        option: "min-h-8 px-2.5 py-1.5",
        optionText: "text-xs",
      },
      md: {
        trigger: "min-h-9 px-3 py-1.5",
        tag: "px-2 py-0.5 text-sm",
        searchInput: "min-h-8 px-3 py-1.5 text-sm",
        option: "min-h-9 px-3 py-2",
        optionText: "text-sm",
      },
      lg: {
        trigger: "min-h-10 px-3.5 py-2",
        tag: "px-2.5 py-1 text-sm",
        searchInput: "min-h-9 px-3.5 py-2 text-sm",
        option: "min-h-10 px-3.5 py-2",
        optionText: "text-sm",
      },
    },
    variant: {
      default: {},
      secondary: {
        label: "text-gray-700 dark:text-gray-200",
        trigger:
          "border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-gray-500 focus-within:border-gray-500 dark:border-gray-700 dark:hover:border-gray-600",
        dropdown: "border-gray-200 dark:border-gray-700",
        searchInput:
          "border-gray-200 focus:ring-gray-500 focus:border-gray-500 dark:border-gray-700",
        checkbox:
          "border-gray-300 data-[selected=true]:bg-gray-600 data-[selected=true]:border-gray-600 data-[selected=true]:text-white dark:border-gray-600",
        tag: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        footer: "bg-gray-50 text-gray-600 border-gray-100 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400",
      },
      success: {
        label: "text-gray-700 dark:text-gray-200",
        trigger:
          "border-green-300 hover:border-green-400 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 dark:border-green-800",
        dropdown: "border-green-200 dark:border-green-800",
        searchInput:
          "border-green-200 focus:ring-green-500 focus:border-green-500 dark:border-green-800",
        option: "hover:bg-green-50 dark:hover:bg-green-950",
        checkbox:
          "border-green-300 data-[selected=true]:bg-green-500 data-[selected=true]:border-green-500 data-[selected=true]:text-white dark:border-green-800",
        footer: "bg-green-50 text-green-600 border-green-100 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
        tag: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-200 dark:hover:bg-green-900",
      },
      error: {
        label: "text-red-700 dark:text-red-300",
        trigger:
          "border-red-300 hover:border-red-400 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 dark:border-red-800",
        dropdown: "border-red-200 dark:border-red-800",
        searchInput: "border-red-200 focus:ring-red-500 focus:border-red-500 dark:border-red-800",
        option: "hover:bg-red-50 dark:hover:bg-red-950",
        checkbox:
          "border-red-300 data-[selected=true]:bg-red-500 data-[selected=true]:border-red-500 data-[selected=true]:text-white dark:border-red-800",
        footer: "bg-red-50 text-red-600 border-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
        tag: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900",
      },
    },
    disabled: {
      true: {
        trigger: "bg-gray-50 cursor-not-allowed opacity-60 dark:bg-gray-800",
        label: "text-gray-400 dark:text-gray-500",
      },
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
    disabled: false,
  },
});
