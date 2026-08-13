import React from "react";
import { matrixDataLoaderStyles } from "./variants/matrix-data-loader.variants";
import { MatrixDataLoaderProps } from "./types/index.types";

export const MatrixDataLoader: React.FC<MatrixDataLoaderProps> = ({
  label = "Loading matrix data…",
  detail,
}) => {
  const s = matrixDataLoaderStyles();

  return (
    <div role="status" aria-live="polite" className={s.container()}>
      <img
        src="assets/icarus-mark.svg"
        alt="Icarus"
        className={s.logo()}
        aria-hidden="true"
      />

      <div className="flex flex-col items-center gap-2">
        <p className={s.label()}>{label}</p>
        {detail && <p className={s.detail()}>{detail}</p>}
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
};

export default MatrixDataLoader;