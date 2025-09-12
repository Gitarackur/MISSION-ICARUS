import { tv } from 'tailwind-variants'

// Converted to use slots structure
export const activityStyleVariants = tv({
  slots: {
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


// === D3 Tree variants ===
export const buttonStyle = tv({
  base: "px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors",
  variants: {
    intent: {
      input:
        "bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300",
      output:
        "bg-green-100 text-green-800 hover:bg-green-200 border border-green-300",
      control:
        "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300",
    },
  },
});

export const activityTreeStyle = tv({
  slots: {
    base: "relative flex flex-col h-screen w-full overflow-hidden bg-gray-50",
    header:
      "fixed top-[calc(100vh_-_93.7%)] left-0 right-0 p-3 bg-white border-b border-gray-200 flex justify-between items-center z-10",
    title: "m-0 text-lg font-semibold text-gray-800",
    zoomInfo: "text-sm text-gray-500",
    controlsContainer: "flex gap-2 items-center",
    contentArea: "flex-1 overflow-hidden relative",
    svg: "w-full h-full bg-gray-50",
    tooltip:
      "fixed bottom-4 left-[calc(100%_-_86%)] bg-white/90 p-3 rounded-lg border border-gray-200 text-sm shadow-sm",
  },
});




// === NON-D3 Tree variants ===
export const treeVariants = tv({
  slots: {
    root: "w-full min-h-screen bg-gray-50 p-6",
    header: "bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6 sticky top-0 z-10",
    headerContent: "flex justify-between items-start",
    title: "text-2xl max-w-[95%] text-ellipsis font-semibold text-gray-900 mb-2",
    subtitle: "text-gray-600 mb-3",
    stats: "flex items-center gap-3 text-sm text-gray-500",
    statBadge: "px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100",
    select: "px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    content: "bg-white border border-gray-200 rounded-lg shadow-sm",
    container: "relative w-full overflow-auto p-8",
    treeWrapper: "flex justify-center items-start",
    empty: "text-center py-16",
    emptyIcon: "text-4xl text-gray-300 mb-3",
    emptyText: "text-lg text-gray-500 font-medium mb-1",
    emptySubtext: "text-gray-400 text-sm"
  }
});

export const nodeVariants = tv({
  slots: {
    wrapper: "flex flex-col items-center relative",
    nodeContainer: "relative flex flex-col items-center",
    card: [
      "relative bg-white border-2 rounded-lg p-4 min-w-[200px] text-center",
      "shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
    ],
    title: "font-medium text-gray-900 text-sm mb-2 leading-tight",
    id: "text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded mb-3",
    buttonGroup: "flex gap-2",
    button: [
      "px-3 py-1.5 text-xs font-medium rounded transition-all duration-150",
      "border hover:shadow-sm"
    ],
    inputButton: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
    outputButton: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300",
    
    // Connection lines
    verticalLineChildFromTop: "absolute bg-gray-300 w-px h-12 top-0 left-1/2 transform -translate-x-px -translate-y-12",
    verticalLineChild: "absolute bg-gray-300 w-px h-6 top-0 transform -translate-x-px -translate-y-6",
    verticalLineChildren: "absolute bg-gray-300 w-px h-6 top-full left-1/2 transform -translate-x-px",
    horizontalLine: "absolute bg-gray-300 h-px top-0 transform -translate-y-6",
    connectionDot: "absolute w-2 h-2 bg-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 top-full left-1/2 mt-6",
    
    // Children container
    childrenContainer: "flex justify-center gap-8 relative mt-12"
  },
  variants: {
    depth: {
      0: {
        card: "border-blue-200 hover:border-blue-300 bg-blue-50/30"
      },
      1: {
        card: "border-emerald-200 hover:border-emerald-300 bg-emerald-50/30"
      },
      2: {
        card: "border-amber-200 hover:border-amber-300 bg-amber-50/30"
      },
      default: {
        card: "border-gray-200 hover:border-gray-300"
      }
    }
  },
  defaultVariants: {
    depth: "default"
  }
});
