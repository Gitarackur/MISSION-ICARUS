export type VisualizationPanelProps = {
  volcanoData: {
    x: number;
    y: number;
    protein: string;
    significant: boolean;
  }[];
  intensityDist: { sample: string; meanIntensity: number; count: number }[];
};
