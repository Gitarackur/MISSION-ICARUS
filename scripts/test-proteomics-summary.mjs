import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: [
    fileURLToPath(
      new URL(
        "../src/app-layer/proteins/proteomics-summary.ts",
        import.meta.url
      )
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const encodedModule = Buffer.from(bundle.outputFiles[0].text).toString("base64");
const { computeProteomicsSummary } = await import(
  `data:text/javascript;base64,${encodedModule}`
);

const rows = [
  {
    proteinId: "p1",
    intensity_Sample1: 100,
    intensity_Sample2: 200,
    intensity_Control1: 50,
    intensity_Control2: 50,
    pValue: 0.01,
  },
  {
    proteinId: "p2",
    intensity_Sample1: 0,
    intensity_Sample2: 400,
    intensity_Control1: 200,
    intensity_Control2: 200,
    pValue: 0.5,
  },
];
const columns = [
  "proteinId",
  "intensity_Sample1",
  "intensity_Sample2",
  "intensity_Control1",
  "intensity_Control2",
  "pValue",
];

const result = computeProteomicsSummary(rows, columns);
assert.equal(result.stats.totalProteins, 2);
assert.equal(result.stats.missingValues, 1);
assert.equal(result.stats.medianIntensity, 200);
assert.equal(result.intensityDist.length, 4);
assert.equal(result.intensityDist[0].count, 2);
assert.equal(result.volcanoData.length, 2);
assert.equal(result.volcanoData[0].protein, "p1");
assert.equal(result.volcanoData[0].significant, true);

const fallbackResult = computeProteomicsSummary(
  [{ Intensity_A: 10 }],
  ["Intensity_A"]
);
assert.equal(fallbackResult.stats.averageIntensity, 10);
assert.deepEqual(fallbackResult.intensityDist, []);

assert.deepEqual(computeProteomicsSummary([], columns), {
  stats: null,
  intensityDist: [],
  volcanoData: [],
});

console.log("Proteomics summary tests passed");
