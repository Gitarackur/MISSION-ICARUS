import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { VisualizationRenderer } from "@/domain/workflow/main.types";
import { visualizationStyles } from "../variants/visualization.variants";

type PlotEngine = "python" | "r" | "recharts";

export function PlotLibrary({
  isRendering,
  plots,
}: {
  isRendering: boolean;
  plots: Array<{
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    disabled: boolean;
    disabledReason?: string;
    isLoading: boolean;
    onRender: (renderer?: VisualizationRenderer) => void | Promise<void>;
      renderers: readonly PlotEngine[];
  }>;
}) {
  const s = visualizationStyles();

  return (
    <section className={s.gallerySection()}>
      <div>
        <p className={s.meta()}>Plot Library</p>
        <h3 className={s.heading()}>Supported Plot Types</h3>
        <p className={s.galleryMeta()}>
          Python is the default engine where available. Native rendering stays available as a fallback.
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

function PlotActionCard({
  description,
  disabled,
  disabledReason,
  eyebrow,
  isLoading,
  isRendering,
  onRender,
  renderers,
  title,
}: {
  description: string;
  disabled: boolean;
  disabledReason?: string;
  eyebrow: string;
  isLoading: boolean;
  isRendering: boolean;
  onRender: (renderer?: VisualizationRenderer) => void | Promise<void>;
  renderers: readonly PlotEngine[];
  title: string;
}) {
  const s = visualizationStyles();
  const [engine, setEngine] = useState<PlotEngine>(renderers[0]);

  return (
    <div className={s.card()}>
      <div className={s.cardHeader()}>
        <div>
          <p className={s.meta()}>{eyebrow}</p>
          <h3 className={s.heading()}>{title}</h3>
        </div>
        <button
          type="button"
          className={s.secondaryButton()}
          onClick={() => onRender(engine)}
          disabled={disabled}
          title={disabledReason ?? `Create ${title}`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {renderers.map((renderer) => (
          <button
            key={renderer}
            type="button"
            className={`${s.chip()} ${engine === renderer ? s.chipActive() : ""}`}
            onClick={() => setEngine(renderer)}
            disabled={disabled || isRendering}
          >
            {renderer === "recharts" ? "Native" : renderer.toUpperCase()}
          </button>
        ))}
      </div>

      <div className={s.plotContainer()}>
        <div className="space-y-2 text-center">
          <p className={s.subtleText()}>{description}</p>
          {disabledReason ? (
            <div className={s.emptyState()}>{disabledReason}</div>
          ) : (
            <button
              type="button"
              className={s.button()}
              onClick={() => onRender(engine)}
              disabled={disabled}
            >
              Create with {engine === "recharts" ? "Native" : engine.toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
