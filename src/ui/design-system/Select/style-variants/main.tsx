import { tv } from "tailwind-variants";

// Create tailwind-variants for single select
export const singleSelect = tv({
  slots: {
    container: "relative w-full",
    label: "block text-sm font-medium mb-2 transition-colors text-gray-700",
    trigger:
      "min-h-[42px] w-full px-3 py-2 border rounded-lg shadow-sm bg-white cursor-pointer transition-all duration-200 flex items-center justify-between border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
    content: "flex-1 flex items-center gap-2",
    placeholder: "text-gray-500 select-none",
    selectedText: "text-gray-900 select-none",
    selectedDescription: "text-sm text-gray-500 select-none",
    dropdown:
      "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden",
    searchContainer: "p-3 border-b border-gray-100",
    searchInput:
      "w-full px-3 py-2 text-sm border border-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    optionsList: "max-h-48 overflow-y-auto",
    option:
      "flex items-center px-3 py-2.5 cursor-pointer transition-colors select-none hover:bg-gray-50",
    optionContent: "flex-1",
    optionText: "text-sm",
    optionDescription: "text-xs text-gray-500 mt-1",
    checkIcon: "w-4 h-4 ml-2 text-blue-600",
    footer:
      "px-3 py-2 border-t border-gray-100 text-xs bg-gray-50 text-gray-600",
    clearButton: "text-gray-400 hover:text-gray-600 transition-colors p-0.5",
    chevron: "text-gray-400 transition-transform duration-200",
    errorText: "text-red-600",
    helperText: "text-gray-500",
  },
  variants: {
    size: {
      sm: {
        trigger: "min-h-[36px] px-2.5 py-1.5 text-sm",
        selectedText: "text-sm",
        searchInput: "px-2.5 py-1.5 text-xs",
        option: "px-2.5 py-2",
        optionText: "text-xs",
        optionDescription: "text-xs",
      },
      md: {
        trigger: "min-h-[42px] px-3 py-2",
        selectedText: "text-sm",
        searchInput: "px-3 py-2 text-sm",
        option: "px-3 py-2.5",
        optionText: "text-sm",
        optionDescription: "text-xs",
      },
      lg: {
        trigger: "min-h-[48px] px-4 py-3",
        selectedText: "text-base",
        searchInput: "px-4 py-2.5 text-base",
        option: "px-4 py-3",
        optionText: "text-base",
        optionDescription: "text-sm",
      },
    },
    variant: {
      default: {},
      secondary: {
        label: "text-gray-700",
        trigger:
          "border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-gray-500 focus-within:border-gray-500",
        dropdown: "border-gray-200",
        searchInput:
          "border-gray-200 focus:ring-gray-500 focus:border-gray-500",
        option:
          "hover:bg-gray-50 data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-800",
        checkIcon: "text-gray-600",
        footer: "bg-gray-50 text-gray-600 border-gray-100",
      },
      success: {
        label: "text-gray-700",
        trigger:
          "border-green-300 hover:border-green-400 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500",
        dropdown: "border-green-200",
        searchInput:
          "border-green-200 focus:ring-green-500 focus:border-green-500",
        option:
          "hover:bg-green-50 data-[selected=true]:bg-green-50 data-[selected=true]:text-green-700",
        checkIcon: "text-green-600",
        footer: "bg-green-50 text-green-600 border-green-100",
      },
      error: {
        label: "text-red-700",
        trigger:
          "border-red-300 hover:border-red-400 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500",
        dropdown: "border-red-200",
        searchInput: "border-red-200 focus:ring-red-500 focus:border-red-500",
        option:
          "hover:bg-red-50 data-[selected=true]:bg-red-50 data-[selected=true]:text-red-700",
        checkIcon: "text-red-600",
        footer: "bg-red-50 text-red-600 border-red-100",
      },
    },
    disabled: {
      true: {
        trigger: "bg-gray-50 cursor-not-allowed opacity-60",
        label: "text-gray-400",
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
    label: "block text-sm font-medium mb-2 transition-colors text-gray-700",
    trigger:
      "min-h-[42px] w-full px-3 py-2 border rounded-lg shadow-sm bg-white cursor-pointer transition-all duration-200 flex items-center justify-between border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
    content: "flex-1 flex flex-wrap gap-1",
    placeholder: "text-gray-500 py-1 select-none",
    dropdown:
      "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden",
    searchContainer: "p-3 border-b border-gray-100",
    searchInput:
      "w-full px-3 py-2 text-sm border border-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    optionsList: "max-h-48 overflow-y-auto",
    option:
      "flex items-center px-3 py-2.5 cursor-pointer transition-colors hover:bg-gray-50",
    checkbox:
      "flex items-center justify-center w-4 h-4 mr-3 border border-gray-300 rounded transition-all duration-200 data-[selected=true]:bg-blue-500 data-[selected=true]:border-blue-500 data-[selected=true]:text-white",
    optionText: "text-sm select-none text-gray-700",
    footer:
      "px-3 py-2 border-t border-gray-100 text-xs bg-gray-50 text-gray-600",
    tag: "inline-flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-md transition-all duration-200 bg-blue-100 text-blue-800 hover:bg-blue-200",
    tagRemove: "hover:bg-opacity-20 rounded-full p-0.5 transition-colors",
    clearButton: "text-gray-400 hover:text-gray-600 transition-colors p-0.5",
    chevron: "text-gray-400 transition-transform duration-200",
    errorText: "text-red-600",
    helperText: "text-gray-500",
  },
  variants: {
    size: {
      sm: {
        trigger: "min-h-[36px] px-2.5 py-1.5 text-sm",
        tag: "px-2 py-0.5 text-xs",
        searchInput: "px-2.5 py-1.5 text-xs",
        option: "px-2.5 py-2",
        optionText: "text-xs",
      },
      md: {
        trigger: "min-h-[42px] px-3 py-2",
        tag: "px-2.5 py-1 text-sm",
        searchInput: "px-3 py-2 text-sm",
        option: "px-3 py-2.5",
        optionText: "text-sm",
      },
      lg: {
        trigger: "min-h-[48px] px-4 py-3",
        tag: "px-3 py-1.5 text-base",
        searchInput: "px-4 py-2.5 text-base",
        option: "px-4 py-3",
        optionText: "text-base",
      },
    },
    variant: {
      default: {},
      secondary: {
        label: "text-gray-700",
        trigger:
          "border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-gray-500 focus-within:border-gray-500",
        dropdown: "border-gray-200",
        searchInput:
          "border-gray-200 focus:ring-gray-500 focus:border-gray-500",
        checkbox:
          "border-gray-300 data-[selected=true]:bg-gray-600 data-[selected=true]:border-gray-600 data-[selected=true]:text-white",
        tag: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        footer: "bg-gray-50 text-gray-600 border-gray-100",
      },
      success: {
        label: "text-gray-700",
        trigger:
          "border-green-300 hover:border-green-400 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500",
        dropdown: "border-green-200",
        searchInput:
          "border-green-200 focus:ring-green-500 focus:border-green-500",
        option: "hover:bg-green-50",
        checkbox:
          "border-green-300 data-[selected=true]:bg-green-500 data-[selected=true]:border-green-500 data-[selected=true]:text-white",
        footer: "bg-green-50 text-green-600 border-green-100",
        tag: "bg-green-100 text-green-800 hover:bg-green-200",
      },
      error: {
        label: "text-red-700",
        trigger:
          "border-red-300 hover:border-red-400 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500",
        dropdown: "border-red-200",
        searchInput: "border-red-200 focus:ring-red-500 focus:border-red-500",
        option: "hover:bg-red-50",
        checkbox:
          "border-red-300 data-[selected=true]:bg-red-500 data-[selected=true]:border-red-500 data-[selected=true]:text-white",
        footer: "bg-red-50 text-red-600 border-red-100",
        tag: "bg-red-100 text-red-800 hover:bg-red-200",
      },
    },
    disabled: {
      true: {
        trigger: "bg-gray-50 cursor-not-allowed opacity-60",
        label: "text-gray-400",
      },
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
    disabled: false,
  },
});