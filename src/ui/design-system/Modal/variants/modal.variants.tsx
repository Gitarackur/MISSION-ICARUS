import { tv } from 'tailwind-variants'

export const modalStyleVariants = tv({
  slots: {
    // Modal slots
    modalOverlay: [
      "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
      "transition-opacity duration-300 ease-in-out opacity-0",
      "data-[open=true]:opacity-100"
    ],
    modalContent: [
      "bg-white rounded-lg p-6 max-w-2xl",
      "transition-all duration-300 ease-in-out",
      "scale-95 opacity-0 translate-y-4",
      "data-[open=true]:scale-100 data-[open=true]:opacity-100 data-[open=true]:translate-y-0"
    ],
    modalHeader: "flex justify-between items-center mb-4",
    modalTitle: "text-lg font-semibold",
    modalCloseBtn: "p-1 hover:bg-gray-100 rounded transition-colors duration-150",
    modalDataContainer: "space-y-2",
    modalRow: "text-sm",
    modalRowLabel: "text-gray-500 font-medium",
    modalRowItems: "ml-4 flex flex-wrap gap-1 mt-1",
    modalItem: "bg-gray-100 px-2 py-1 rounded text-xs font-mono border transition-colors duration-150",

    // Icon slots
    iconClose: "w-4 h-4",
  }
});