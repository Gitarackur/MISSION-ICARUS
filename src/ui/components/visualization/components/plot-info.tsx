import { visualizationStyles } from "../variants/visualization.variants";

const PlotInfo = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const s = visualizationStyles();

  return (
    <div>
      <div className={s.plotInfoOverlay()}>
        <div className={s.plotInfoHelp()}>
          Drag to pan • Scroll to zoom • Arrows to move • +/- to zoom • 0 to reset
        </div>
        {children}
      </div>
    </div>
  );
};

export default PlotInfo;
