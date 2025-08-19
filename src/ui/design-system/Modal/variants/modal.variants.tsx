import { tv } from 'tailwind-variants'

export const modalStyleVariants = tv({
  slots: {
    // Modal slots
    modalOverlay: "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
    modalContent: "bg-white rounded-lg p-6 max-w-2xl max-h-96 overflow-auto",
    modalHeader: "flex justify-between items-center mb-4",
    modalTitle: "text-lg font-semibold",
    modalCloseBtn: "p-1 hover:bg-gray-100 rounded",
    modalDataContainer: "space-y-2",
    modalRow: "text-sm",
    modalRowLabel: "text-gray-500 font-medium",
    modalRowItems: "ml-4 flex flex-wrap gap-1 mt-1",
    modalItem: "bg-gray-100 px-2 py-1 rounded text-xs font-mono border",

    // Icon slots
    iconClose: "w-4 h-4",
  }
});
