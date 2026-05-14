import { visualizationStyles } from "../variants/visualization.variants";
import { PlotLibraryCard } from "../types/index.types";
import PlotActionCard from "./plot-action-card";

export function PlotLibrary({
  isRendering,
  plots,
}: {
  isRendering: boolean;
  plots: PlotLibraryCard[];
}) {
  const s = visualizationStyles();

  return (
    <section className={s.gallerySection()}>
      <div>
        <p className={s.meta()}>Plot Library</p>
        <h3 className={s.heading()}>Available Plot Types</h3>
        <p className={s.galleryMeta()}>
          Choose the plot once, then decide the renderer and axes from the same card.
        </p>
      </div>

      <div className={s.plotLibrary()}>
        {plots.map((plot) => (
          <PlotActionCard key={plot.id} isRendering={isRendering} {...plot} />
        ))}
      </div>
    </section>
  );
}

