import { tv } from "tailwind-variants";

export const statisticsStyles = tv({
  slots: {
    container: 'space-y-6',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6',
    card: 'bg-white rounded-lg shadow p-6 transition hover:shadow-md',
    iconWrapper: 'p-3 rounded-full flex items-center justify-center',
    iconColor: 'w-6 h-6',
    title: 'text-sm font-medium text-gray-600',
    value: 'text-2xl font-bold text-gray-900 truncate',
    intensityTitle: 'text-lg font-semibold mb-4 text-gray-800',
    intensityChartWrapper: 'h-64',
    emptyState: 'flex flex-col items-center justify-center py-16 text-center text-gray-500 space-y-4',
  },
  variants: {
    color: {
      blue: {
        iconWrapper: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      green: {
        iconWrapper: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      yellow: {
        iconWrapper: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
      },
      red: {
        iconWrapper: 'bg-red-100',
        iconColor: 'text-red-600',
      },
    },
  },
});





// statistics menu styles
export const statisticsMenuStyles = tv({
  slots: {
    mainContainer: "w-full bg-white rounded-lg shadow-xl p-6 flex flex-col font-sans text-gray-800", 
    mainContent: "flex flex-row", 

    rightToolbarArea: "flex-1 flex flex-col gap-2", 
    toolbarRow: "flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-md p-2 shadow-sm", 
  
    toolbarButton: "flex items-center px-3 py-1 bg-gray-100 border border-gray-300 rounded-md text-sm cursor-pointer hover:bg-gray-200 transition-colors space-x-1", 
    toolbarButtonIcon: "text-lg", 
    toolbarButtonText: "", 
    dropdownArrow: "ml-auto text-xs", 

    // Labels below the toolbars (Processing, Analysis).
    sectionLabelContainer: "flex-1 flex items-center justify-center pt-2 text-xs text-gray-500",
    sectionLabel: "border-b border-gray-300 pb-1 px-4",
  },
});