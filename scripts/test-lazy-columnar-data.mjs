import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: [
    fileURLToPath(
      new URL(
        "../src/app-layer/shared/lazy-columnar-data.ts",
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
const { LazyColumnarData } = await import(
  `data:text/javascript;base64,${encodedModule}`
);

const table = {
  headers: ["protein", "intensity"],
  columns: [
    ["p1", "p2", "p3"],
    new Float64Array([10, NaN, 30]),
  ],
  rowCount: 3,
  columnTypes: { protein: "string", intensity: "number" },
  errors: [],
};

const data = new LazyColumnarData(table, ["protein", "intensity"]);

assert.deepEqual(data.get("intensity"), [10, "N/A", 30]);
assert.deepEqual(data.get("protein"), ["p1", "p2", "p3"]);
assert.deepEqual([...data], [
  ["protein", ["p1", "p2", "p3"]],
  ["intensity", [10, "N/A", 30]],
]);
assert.deepEqual([...data.values()], [["p1", "p2", "p3"], [10, "N/A", 30]]);
assert.deepEqual(new Map(data).get("protein"), ["p1", "p2", "p3"]);

const visited = [];
data.forEach((values, column, source) => {
  assert.equal(source, data);
  visited.push([column, values]);
});
assert.deepEqual(visited, [...data.entries()]);

const tested = new LazyColumnarData(table, ["intensity"]);
assert.equal(tested.get("missing-column"), undefined);

console.log("Lazy columnar data tests passed");