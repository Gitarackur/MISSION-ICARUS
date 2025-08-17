import { tv } from 'tailwind-variants'

// Converted to use slots structure
export const activityStyleVariants = tv({
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

    // Badge slots
    badgeContainer: "flex items-center gap-1",
    badgeLabel: "text-xs font-medium text-gray-600",
    badgeButton: "px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-mono hover:bg-blue-100 transition-colors flex items-center gap-1",

    // Node slots
    nodeContainer: "py-0.5 group",
    nodeWithBorder: "border-l-2 border-gray-200 ml-3 pl-3",
    nodeContent: "flex items-center gap-2 p-2 rounded-lg transition-colors",
    nodeInteractive: "cursor-pointer hover:bg-gray-50",
    nodeChevron: "w-3 h-3 text-gray-400 transition-transform",
    nodeChevronRotated: "rotate-90",
    nodeChevronHidden: "invisible",

    // Icon slots
    iconActivity: "w-4 h-4 text-blue-500",
    iconGroup: "w-4 h-4 text-green-500",
    iconPlug: "w-3 h-3 text-purple-500",
    iconClock: "w-3 h-3 text-gray-400",
    iconArrowIn: "w-3 h-3 text-green-600 rotate-180",
    iconArrowOut: "w-3 h-3 text-orange-600",
    iconEye: "w-3 h-3",
    iconClose: "w-4 h-4",

    // Text slots
    textPrimary: "font-medium text-gray-900 text-sm",
    textSecondary: "text-gray-500 text-xs ml-1",
    textTimestamp: "text-xs text-gray-500",
    textPlugin: "text-xs text-gray-700 font-mono",
    textMatrixKey: "text-xs text-gray-700 font-mono ml-2",
    textLabel: "font-medium text-gray-600",
    textValue: "text-gray-700 font-mono",

    // Details slots
    detailsContainer: "ml-6 mt-1 mb-2 bg-gray-50 p-3 rounded-lg border",
    detailsWrapper: "flex flex-wrap items-center gap-4 text-xs",
    detailsTimeContainer: "flex items-center gap-1",

    // Layout slots
    layoutRoot: "w-full bg-white",
    layoutHeader: "px-6 py-4 border-b bg-gray-50 flex items-center justify-between",
    layoutHeaderText: "text-lg font-semibold text-gray-900",
    layoutHeaderSub: "text-sm text-gray-600",
    layoutSelect: "text-sm border border-gray-300 rounded px-3 py-1 bg-white",
    layoutContent: "p-4",
    layoutEmpty: "text-center py-8 text-gray-500"
  }
});
