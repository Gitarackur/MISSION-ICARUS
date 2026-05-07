import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Loader2, RefreshCw } from "lucide-react";
import ScatterTooltip from "@/ui/components/scatter/tooltip";
import { useVisualizationPanel } from "@/app-layer/visualization/hooks/useVisualizationPanel";
import {
  formatAxisLabel,
  getVisualizationPayloadPointCount,
} from "@/domain/visualization/utils/main";
import { VisualizationPanelProps } from "./types/index.types";
import { visualizationStyles } from "./variants/visualization.variants";

const VisualizationPanel: React.FC<VisualizationPanelProps> = (props) => {
  const s = visualizationStyles();
  const {
    activeSavedImage,
    activeSavedVisualization,
    boxImage,
    boxPayload,
    boxReason,
    error,
    heatmapPayload,
    heatmapReason,
    pcaImage,
    pcaPayload,
    pcaReason,
    pythonImage,
    rImage,
    renderBoxPlot,
    renderHeatmap,
    renderPcaPlot,
    renderPythonPlot,
    renderRPlot,
    renderScatterPlot,
    renderVolcanoPlot,
    renderingJob,
    savedVisualizations,
    scatterImage,
    scatterPayload,
    scatterReason,
    volcanoPayload,
    volcanoReason,
    volcanoTickInterval,
  } = useVisualizationPanel(props);

  const isRendering = renderingJob !== null;

  return (
    <div className={s.container()}>
        {savedVisualizations.length > 0 && (
          <div className={s.savedPreview()}>
            {activeSavedImage ? (
              <img
                src={activeSavedImage}
                alt={activeSavedVisualization?.title ?? "Saved visualization"}
                className={s.savedImage()}
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className={s.emptyState()}>
                This saved visualization does not include a displayable image.
              </div>
            )}
          </div>
        )}

        <div className={s.grid()}>
          <div className={s.card()}>
            <div className={s.cardHeader()}>
              <div>
                <p className={s.meta()}>Interactive</p>
                <h3 className={s.heading()}>Volcano Plot</h3>
              </div>
              <IconButton
                isLoading={renderingJob === "volcano"}
                disabled={isRendering || !volcanoPayload}
                label="Create saved volcano plot"
                onClick={renderVolcanoPlot}
              />
            </div>
            <div className={s.plotContainer()}>
              {props.volcanoData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" debounce={80}>
                  <ScatterChart
                    margin={{ top: 12, right: 18, bottom: 12, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="x"
                      name="Log2 Fold Change"
                      tickLine={false}
                      tickFormatter={(value) => formatAxisLabel(value, 8)}
                      interval={volcanoTickInterval}
                      minTickGap={18}
                    />
                    <YAxis
                      dataKey="y"
                      name="-Log10 p-value"
                      tickLine={false}
                      tickFormatter={(value) => formatAxisLabel(value, 8)}
                      minTickGap={12}
                      width={46}
                    />
                    <RechartsTooltip content={<ScatterTooltip />} />
                    <Scatter
                      data={props.volcanoData}
                      fill="#2563EB"
                      isAnimationActive={false}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className={s.emptyState()}>
                  {volcanoReason ?? "Create a saved volcano plot from the active matrix."}
                </div>
              )}
            </div>
          </div>

          <ImagePlotCard
            eyebrow="Python"
            title="Matrix Plot"
            image={pythonImage}
            alt="Python intensity visualization"
            buttonLabel="Render Python Plot"
            isLoading={renderingJob === "python-bar"}
            isRendering={isRendering}
            onRender={renderPythonPlot}
          />

          <ImagePlotCard
            eyebrow="R"
            title="Matrix Plot"
            image={rImage}
            alt="R intensity visualization"
            buttonLabel="Render R Plot"
            isLoading={renderingJob === "r-bar"}
            isRendering={isRendering}
            onRender={renderRPlot}
          />

          <ImagePlotCard
            eyebrow="Python"
            title="Box Plot"
            image={boxImage}
            alt="Python box plot"
            buttonLabel={boxPayload ? "Create Box Plot" : boxReason ?? "Box plot unavailable"}
            isLoading={renderingJob === "box"}
            isRendering={isRendering || !boxPayload}
            onRender={renderBoxPlot}
          />

          <ImagePlotCard
            eyebrow="Python"
            title="Scatter Plot"
            image={scatterImage}
            alt="Python scatter plot"
            buttonLabel={
              scatterPayload ? "Create Scatter Plot" : scatterReason ?? "Scatter plot unavailable"
            }
            isLoading={renderingJob === "scatter"}
            isRendering={isRendering || !scatterPayload}
            onRender={renderScatterPlot}
          />

          <ImagePlotCard
            eyebrow="Python"
            title="PCA Plot"
            image={pcaImage}
            alt="Python PCA plot"
            buttonLabel={pcaPayload ? "Create PCA Plot" : pcaReason ?? "PCA plot unavailable"}
            isLoading={renderingJob === "pca"}
            isRendering={isRendering || !pcaPayload}
            onRender={renderPcaPlot}
          />

          <div className={s.card()}>
            <div className={s.cardHeader()}>
              <div>
                <p className={s.meta()}>Preview</p>
                <h3 className={s.heading()}>Saved Visualization Details</h3>
              </div>
            </div>
            {activeSavedVisualization ? (
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  Renderer:{" "}
                  <span className="font-medium text-gray-900">
                    {activeSavedVisualization.renderer ?? "Unknown"}
                  </span>
                </p>
                <p>
                  Type:{" "}
                  <span className="font-medium text-gray-900">
                    {activeSavedVisualization.visualizationType ?? "Unknown"}
                  </span>
                </p>
                <p>
                  Points:{" "}
                  <span className="font-medium text-gray-900">
                    {getVisualizationPayloadPointCount(activeSavedVisualization)}
                  </span>
                </p>
              </div>
            ) : (
              <div className={s.emptyState()}>
                Render a plot to save it in the workflow.
              </div>
            )}
          </div>

          <div className={s.card()}>
            <div className={s.cardHeader()}>
              <div>
                <p className={s.meta()}>Matrix</p>
                <h3 className={s.heading()}>Sample Correlation Heatmap</h3>
              </div>
              <IconButton
                isLoading={renderingJob === "heatmap"}
                disabled={isRendering || !heatmapPayload}
                label="Create saved heatmap"
                onClick={renderHeatmap}
              />
            </div>
            <div className={s.placeholderBox()}>
              {heatmapPayload ? (
                <button
                  type="button"
                  className={s.button()}
                  onClick={renderHeatmap}
                  disabled={isRendering}
                >
                  Create Heatmap
                </button>
              ) : (
                <div className={s.emptyState()}>
                  {heatmapReason ?? "Heatmap is not available for this matrix."}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
};

function IconButton({
  disabled,
  isLoading,
  label,
  onClick,
}: {
  disabled: boolean;
  isLoading: boolean;
  label: string;
  onClick: () => void;
}) {
  const s = visualizationStyles();

  return (
    <button
      type="button"
      className={s.secondaryButton()}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
    </button>
  );
}

function ImagePlotCard({
  alt,
  buttonLabel,
  eyebrow,
  image,
  isLoading,
  isRendering,
  onRender,
  title,
}: {
  alt: string;
  buttonLabel: string;
  eyebrow: string;
  image: string | null;
  isLoading: boolean;
  isRendering: boolean;
  onRender: () => void;
  title: string;
}) {
  const s = visualizationStyles();

  return (
    <div className={s.card()}>
      <div className={s.cardHeader()}>
        <div>
          <p className={s.meta()}>{eyebrow}</p>
          <h3 className={s.heading()}>{title}</h3>
        </div>
        <IconButton
          isLoading={isLoading}
          disabled={isRendering}
          label={`Refresh ${eyebrow} plot`}
          onClick={onRender}
        />
      </div>
      <div className={s.plotContainer()}>
        {image ? (
          <img
            src={image}
            alt={alt}
            className="h-full w-full object-contain"
            loading="eager"
            decoding="async"
          />
        ) : (
          <button
            type="button"
            className={s.button()}
            onClick={onRender}
            disabled={isRendering}
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default VisualizationPanel;
