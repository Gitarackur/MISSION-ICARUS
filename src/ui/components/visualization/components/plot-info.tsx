const PlotInfo = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  return (
    <div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
        <div className="pointer-events-auto rounded-xl border border-gray-200/80 bg-white/90 px-3 py-2 text-xs font-medium text-gray-600 shadow-sm backdrop-blur dark:border-gray-700/80 dark:bg-gray-900/90 dark:text-gray-300">
          Drag to pan • Scroll to zoom • Arrows to move • +/- to zoom • 0 to reset
        </div>
        { children }
      </div>
    </div>
  )
}

export default PlotInfo