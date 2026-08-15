import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const importBundledModule = async (relativePath) => {
  const bundle = await build({
    entryPoints: [fileURLToPath(new URL(relativePath, import.meta.url))],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
  });
  const encodedModule = Buffer.from(bundle.outputFiles[0].text).toString(
    "base64"
  );
  return import(`data:text/javascript;base64,${encodedModule}`);
};

const {
  getNativeChartKindForVisualization,
  getNativeVisualizationChartModel,
} = await importBundledModule(
  "../src/ui/components/visualization/utils/native-visualization.ts"
);
const {
  getNativeChartTickInterval,
  normalizeNativeChartImageSource,
  truncateNativeChartLabel,
} = await importBundledModule(
  "../src/ui/components/visualization/utils/native-chart.ts"
);
const {
  buildIntensityDistribution,
  getIntensityNativeChartKind,
} = await importBundledModule(
  "../src/ui/components/statistics/proteomics/utils/intensity-distribution.ts"
);

const categorySeriesPayload = {
  categories: ["sample-a", "sample-b"],
  series: [{ name: "Intensity", values: [10, 20] }],
};
const toVisualization = (visualizationType, payload = categorySeriesPayload) =>
  ({
    id: `test-${visualizationType}`,
    createdByActivityId: null,
    visualizationType,
    data: { payload },
  });

assert.equal(getNativeChartKindForVisualization("bar"), "bar");
assert.equal(getNativeChartKindForVisualization("histogram"), "bar");
assert.equal(getNativeChartKindForVisualization("missing-values"), "bar");
assert.equal(getNativeChartKindForVisualization("line"), "line");
assert.equal(getNativeChartKindForVisualization("density"), "area");
assert.equal(
  getNativeChartKindForVisualization("custom", { chartKind: "line" }),
  "line"
);
assert.equal(
  getNativeChartKindForVisualization("generic", { kind: "area" }),
  "area"
);

for (const specializedKind of [
  "box",
  "scatter",
  "violin",
  "heatmap",
  "volcano",
  "pca",
  "qc",
]) {
  assert.equal(getNativeChartKindForVisualization(specializedKind), null);
}

assert.equal(getNativeVisualizationChartModel(toVisualization("bar")).kind, "bar");
assert.equal(
  getNativeVisualizationChartModel(toVisualization("line")).kind,
  "line"
);
assert.equal(
  getNativeVisualizationChartModel(toVisualization("density")).kind,
  "area"
);
assert.deepEqual(
  getNativeVisualizationChartModel(toVisualization("line")).data,
  [
    { category: "sample-a", "series-0": 10 },
    { category: "sample-b", "series-0": 20 },
  ]
);
assert.equal(
  getNativeVisualizationChartModel(toVisualization("scatter")),
  null
);

assert.equal(truncateNativeChartLabel("abcdefgh", 5), "abcd…");
assert.equal(getNativeChartTickInterval(20, 8), 2);
assert.match(
  normalizeNativeChartImageSource(
    '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
  ),
  /^data:image\/svg\+xml;charset=utf-8,/
);
assert.equal(
  normalizeNativeChartImageSource("data:image/png;base64,abc"),
  "data:image/png;base64,abc"
);

assert.deepEqual(
  buildIntensityDistribution(
    {
      headers: ["Intensity_A", "Intensity_B"],
      columns: [
        [10, 100, null, 0],
        [100, 1_000, "invalid", -1],
      ],
      rowCount: 4,
    },
    ["Intensity_A", "Intensity_B"]
  ),
  [
    { sample: "A", meanIntensity: 1.5, count: 2 },
    { sample: "B", meanIntensity: 2.5, count: 2 },
  ]
);
assert.equal(getIntensityNativeChartKind("native-bar"), "bar");
assert.equal(getIntensityNativeChartKind("native-line"), "line");
assert.equal(getIntensityNativeChartKind("native-area"), "area");

console.log("Native visualization tests passed");
