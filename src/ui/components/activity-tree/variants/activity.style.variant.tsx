import { tv } from 'tailwind-variants'

// Converted to use slots structure
export const activityStyleVariants = tv({
  slots: {
    // Badge slots
    badgeContainer: "flex items-center gap-1",
    badgeLabel: "text-xs font-medium text-gray-600 dark:text-gray-400",
    badgeButton: "px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-mono hover:bg-blue-100 transition-colors flex items-center gap-1 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900",

    // Node slots
    nodeContainer: "py-0.5 group",
    nodeWithBorder: "border-l-2 border-gray-200 ml-3 pl-3 dark:border-gray-800",
    nodeContent: "flex items-center gap-2 p-2 rounded-lg transition-colors",
    nodeInteractive: "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900",
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
    textPrimary: "font-medium text-gray-900 text-sm dark:text-gray-100",
    textSecondary: "text-gray-500 text-xs ml-1 dark:text-gray-400",
    textTimestamp: "text-xs text-gray-500 dark:text-gray-400",
    textPlugin: "text-xs text-gray-700 font-mono dark:text-gray-300",
    textMatrixKey: "text-xs text-gray-700 font-mono ml-2 dark:text-gray-300",
    textLabel: "font-medium text-gray-600 dark:text-gray-400",
    textValue: "text-gray-700 font-mono dark:text-gray-300",

    // Details slots
    detailsContainer: "ml-6 mt-1 mb-2 bg-gray-50 p-3 rounded-lg border dark:border-gray-800 dark:bg-gray-900",
    detailsWrapper: "flex flex-wrap items-center gap-4 text-xs",
    detailsTimeContainer: "flex items-center gap-1",

    // Layout slots
    layoutRoot: "w-full bg-white dark:bg-gray-950",
    layoutHeader: "px-6 py-4 border-b bg-gray-50 flex items-center justify-between dark:border-gray-800 dark:bg-gray-900",
    layoutHeaderText: "text-lg font-semibold text-gray-900 dark:text-gray-100",
    layoutHeaderSub: "text-sm text-gray-600 dark:text-gray-400",
    layoutSelect: "text-sm border border-gray-300 rounded px-3 py-1 bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
    layoutContent: "p-4",
    layoutEmpty: "text-center py-8 text-gray-500"
  }
});


// === D3 Tree variants ===
export const buttonStyle = tv({
  base: "px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors",
  variants: {
    intent: {
      ghost: "",
      input:
        "bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900",
      output:
        "bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 dark:border-green-900 dark:bg-green-950 dark:text-green-200 dark:hover:bg-green-900",
      control:
        "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
    },
  },
});

export const activityTreeStyle = tv({
  slots: {
    base: "relative flex flex-col h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950",
    header:
      "fixed top-[calc(100vh_-_92.3%)] px-6 left-0 right-0 flex justify-end items-center z-10",
    title: "m-0 text-lg font-semibold text-gray-800 dark:text-gray-100",
    zoomInfo: "text-xs text-gray-500 uppercase dark:text-gray-400",
    controlsContainer: "flex items-center",
    contentArea: "flex-1 overflow-hidden relative",
    svg: "w-full h-full bg-gray-50 dark:bg-gray-950",
    tooltip:
      "fixed bottom-4 left-[calc(100%_-_86%)] bg-white/90 p-3 rounded-lg border border-gray-200 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200",
  },
});




// === NON-D3 Tree variants ===
export const treeVariants = tv({
  slots: {
    root: "w-full min-h-screen bg-gray-50 p-6 dark:bg-gray-950",
    header: "bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6 sticky top-0 z-10 dark:border-gray-800 dark:bg-gray-900",
    headerContent: "flex justify-between items-start",
    title: "text-2xl max-w-[95%] text-ellipsis font-semibold text-gray-900 mb-2 dark:text-gray-100",
    subtitle: "text-gray-600 mb-3 dark:text-gray-400",
    stats: "flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400",
    statBadge: "px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
    select: "px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800",
    content: "bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-800 dark:bg-gray-900",
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
      "relative bg-white border-2 rounded-lg p-4 min-w-[200px] text-center dark:border-gray-700 dark:bg-gray-900",
      "shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
    ],
    title: "font-medium text-gray-900 text-sm mb-2 leading-tight dark:text-gray-100",
    id: "text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded mb-3 dark:bg-gray-800 dark:text-gray-400",
    buttonGroup: "flex gap-2",
    button: [
      "px-3 py-1.5 text-xs font-medium rounded transition-all duration-150",
      "border hover:shadow-sm"
    ],
    inputButton: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900",
    outputButton: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 dark:border-green-900 dark:bg-green-950 dark:text-green-200 dark:hover:bg-green-900",
    
    // Connection lines
    verticalLineChildFromTop: "absolute bg-gray-300 w-px h-12 top-0 left-1/2 transform -translate-x-px -translate-y-12 dark:bg-gray-700",
    verticalLineChild: "absolute bg-gray-300 w-px h-6 top-0 transform -translate-x-px -translate-y-6 dark:bg-gray-700",
    verticalLineChildren: "absolute bg-gray-300 w-px h-6 top-full left-1/2 transform -translate-x-px dark:bg-gray-700",
    horizontalLine: "absolute bg-gray-300 h-px top-0 transform -translate-y-6 dark:bg-gray-700",
    connectionDot: "absolute w-2 h-2 bg-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 top-full left-1/2 mt-6 dark:bg-gray-600",
    
    // Children container
    childrenContainer: "flex justify-center gap-8 relative mt-12"
  },
  variants: {
    depth: {
      0: {
        card: "border-blue-200 hover:border-blue-300 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/30"
      },
      1: {
        card: "border-emerald-200 hover:border-emerald-300 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/30"
      },
      2: {
        card: "border-amber-200 hover:border-amber-300 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/30"
      },
      default: {
        card: "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
      }
    }
  },
  defaultVariants: {
    depth: "default"
  }
});
