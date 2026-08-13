import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: [
    fileURLToPath(
      new URL(
        "../src/app-layer/proteins/proteomics-summary/proteomics-summary.ts",
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

// Builds a ColumnarTable from row-major cells, mirroring how the parser and
// matrix-view worker produce tables (Float64Array for numeric columns).
const toTable = (rows, columns) => {
  const headers = [...columns];
  const columnValues = headers.map((_, columnIndex) =>
    rows.map((row) => row[columnIndex])
  );
  const numericFlags = headers.map((_, columnIndex) =>
    columnValues[columnIndex].every(
      (value) =>
        value === null ||
        value === undefined ||
        value === "" ||
        (typeof value === "number" && !Number.isNaN(value))
    )
  );
  const columnsOut = headers.map((_, columnIndex) => {
    if (numericFlags[columnIndex]) {
      const array = new Float64Array(rows.length);
      columnValues[columnIndex].forEach((value, index) => {
        array[index] =
          value === null || value === undefined || value === ""
            ? NaN
            : Number(value);
      });
      return array;
    }
    return columnValues[columnIndex].map((value) =>
      value === null || value === undefined ? "N/A" : String(value)
    );
  });
  const columnTypes = {};
  headers.forEach((header, index) => {
    columnTypes[header] = numericFlags[index] ? "number" : "string";
  });
  return {
    headers,
    columns: columnsOut,
    rowCount: rows.length,
    columnTypes,
    errors: [],
  };
};

const rows = [
  [100, 200, 50, 50, 0.01, "p1"],
  [0, 400, 200, 200, 0.5, "p2"],
];
const columns = [
  "intensity_Sample1",
  "intensity_Sample2",
  "intensity_Control1",
  "intensity_Control2",
  "pValue",
  "proteinId",
];

const result = await computeProteomicsSummary(toTable(rows, columns));
assert.equal(result.stats.totalProteins, 2);
assert.equal(result.stats.missingValues, 1);
assert.equal(result.stats.medianIntensity, 200);
assert.equal(result.intensityDist.length, 4);
assert.equal(result.intensityDist[0].count, 2);
assert.equal(result.volcanoData.length, 2);
assert.equal(result.volcanoData[0].protein, "p1");
assert.equal(result.volcanoData[0].significant, true);

const fallbackResult = await computeProteomicsSummary(
  toTable([[10]], ["Intensity_A"])
);
assert.equal(fallbackResult.stats.averageIntensity, 10);
assert.deepEqual(fallbackResult.intensityDist, []);

const invalidResult = await computeProteomicsSummary(
  toTable(
    [["not-a-number", 10, undefined, "invalid"]],
    ["intensity_Sample1", "intensity_Control1", "pValue", "proteinId"]
  )
);
assert.equal(invalidResult.stats.missingValues, 1);
assert.deepEqual(invalidResult.volcanoData, []);

const missingPValueResult = await computeProteomicsSummary(
  toTable([[100, 10, "", "missing-p"]], [
    "intensity_Sample1",
    "intensity_Control1",
    "pValue",
    "proteinId",
  ])
);
assert.deepEqual(missingPValueResult.volcanoData, []);

const zeroPValueResult = await computeProteomicsSummary(
  toTable([[100, 10, 0, "zero-p"]], [
    "intensity_Sample1",
    "intensity_Control1",
    "pValue",
    "proteinId",
  ])
);
assert.equal(zeroPValueResult.volcanoData[0].y, 300);
assert.equal(zeroPValueResult.volcanoData[0].significant, true);

assert.deepEqual(await computeProteomicsSummary(toTable([], [])), {
  stats: null,
  intensityDist: [],
  volcanoData: [],
});

console.log("Proteomics summary tests passed");
