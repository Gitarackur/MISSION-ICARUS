import { useState } from "react";
import { X } from "lucide-react";
import { visualizationStyles } from "../variants/visualization.variants";

const PlotInfo = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const s = visualizationStyles();
  const [showScrollNote, setShowScrollNote] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(true);

  return (
    <div>
      <div className={s.plotInfoOverlay()}>
        {showShortcuts && (
          <div className={s.plotInfoHelp()}>
            <span>
              Drag to pan • Scroll to zoom • Arrows to move • +/- to zoom • 0 to reset
            </span>
            <button
              type="button"
              className={s.plotInfoClose()}
              aria-label="Dismiss shortcuts hint"
              onClick={() => setShowShortcuts(false)}
            >
              <X className={s.icon()} />
            </button>
          </div>
        )}
        {showScrollNote && (
          <p className={s.plotInfoScrollNote()}>
            <span>
              Page scrolling is paused while your cursor is inside the plot. Move
              your cursor outside the plot to scroll the page normally.
            </span>
            <button
              type="button"
              className={s.plotInfoClose()}
              aria-label="Dismiss scrolling hint"
              onClick={() => setShowScrollNote(false)}
            >
              <X className={s.icon()} />
            </button>
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

export default PlotInfo;