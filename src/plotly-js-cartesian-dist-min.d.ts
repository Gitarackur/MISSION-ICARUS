declare module "plotly.js-cartesian-dist-min" {
  export interface PlotlyFigure {
    data: unknown[];
    layout: Record<string, unknown>;
    config?: Record<string, unknown>;
  }

  const Plotly: {
    newPlot(
      id: string | HTMLElement,
      data: unknown[],
      layout?: Record<string, unknown>,
      config?: Record<string, unknown>
    ): Promise<void>;
    toImage(
      id: string | HTMLElement,
      opts?: {
        format?: "png" | "svg" | "jpeg" | "webp";
        width?: number;
        height?: number;
        scale?: number;
      }
    ): Promise<string>;
    purge(id: string | HTMLElement): void;
  };

  export default Plotly;
}