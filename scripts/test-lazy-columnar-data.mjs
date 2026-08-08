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

const data = new LazyColumnarData(
  [
    { protein: "p1", intensity: 10 },
    { protein: "p2", intensity: 20 },
  ],
  ["protein", "intensity"]
);

assert.deepEqual(data.get("intensity"), [10, 20]);
assert.deepEqual([...data], [
  ["protein", ["p1", "p2"]],
  ["intensity", [10, 20]],
]);
assert.deepEqual([...data.values()], [["p1", "p2"], [10, 20]]);
assert.deepEqual(new Map(data).get("protein"), ["p1", "p2"]);

const visited = [];
data.forEach((values, column, source) => {
  assert.equal(source, data);
  visited.push([column, values]);
});
assert.deepEqual(visited, [...data.entries()]);

console.log("Lazy columnar data tests passed");
