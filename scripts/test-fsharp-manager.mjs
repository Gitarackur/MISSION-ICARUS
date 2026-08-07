import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      export { default as EmbeddedFSharpManager } from "./electron/src/fsharp/fsharp-manager.ts";
    `,
    resolveDir: repositoryRoot,
    sourcefile: "fsharp-manager-test-entry.ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  plugins: [
    {
      name: "electron-test-shim",
      setup(buildContext) {
        buildContext.onResolve({ filter: /^electron$/ }, () => ({
          path: "electron-test-shim",
          namespace: "fsharp-manager-tests",
        }));
        buildContext.onLoad(
          {
            filter: /.*/,
            namespace: "fsharp-manager-tests",
          },
          () => ({
            contents: `
              export const app = {
                isPackaged: false,
                getAppPath: () => process.cwd(),
              };
            `,
            loader: "js",
          })
        );
      },
    },
  ],
});
const encodedModule = Buffer.from(bundle.outputFiles[0].text).toString("base64");
const { EmbeddedFSharpManager } = await import(
  `data:text/javascript;base64,${encodedModule}`
);

const manager = new EmbeddedFSharpManager();

const payloads = [
  {
    plotType: "bar",
    payload: {
      title: "Test Bar",
      categories: ["A", "B", "C"],
      series: [{ name: "S1", values: [1, 2, 3] }],
    },
  },
  {
    plotType: "box",
    payload: {
      title: "Test Box",
      series: [
        { name: "G1", values: [1, 2, 3, 4, 5] },
        { name: "G2", values: [6, 7, 8, 9, 10] },
      ],
    },
  },
  {
    plotType: "scatter",
    payload: {
      title: "Test Scatter",
      series: [{ name: "S", x: [1, 2, 3], y: [4, 5, 6] }],
    },
  },
  {
    plotType: "heatmap",
    payload: {
      title: "Test Heatmap",
      row_labels: ["A", "B"],
      col_labels: ["A", "B"],
      matrix: [
        [1, -0.5],
        [-0.5, 1],
      ],
    },
  },
  {
    plotType: "volcano",
    payload: {
      title: "Test Volcano",
      x: [-2, -1, 1, 2],
      y: [0.01, 0.5, 0.02, 0.1],
      labels: ["g1", "g2", "g3", "g4"],
      xThreshold: 1,
      yThreshold: 0.05,
      yTransform: "negative-log10",
    },
  },
  {
    plotType: "pca",
    payload: {
      title: "Test PCA",
      labels: ["s1", "s2", "s3"],
      data: [
        [1, 0],
        [0, 1],
        [-1, -1],
      ],
    },
  },
];

if (!manager.isFSharpAvailable()) {
  console.log(
    "F# runtime not bundled for this platform/arch; skipping binary smoke tests."
  );
} else {
  assert.equal(manager.isUsingBundledRuntime(), true);
  const expectedTraces = {
    bar: ["bar"],
    box: ["box"],
    scatter: ["scatter"],
    heatmap: ["heatmap"],
    volcano: ["scatter"],
    pca: ["scatter"],
  };
  for (const { plotType, payload } of payloads) {
    const figureJson = await manager.render([
      JSON.stringify({ plotType, payload }),
    ]);
    assert.ok(
      figureJson.trim().startsWith("{"),
      `${plotType} produced a non-JSON result`
    );
    const figure = JSON.parse(figureJson);
    assert.ok(Array.isArray(figure.data), `${plotType} missing data array`);
    assert.ok(figure.layout, `${plotType} missing layout`);
    const kinds = new Set(figure.data.map((trace) => trace.type));
    assert.deepEqual(
      [...kinds],
      expectedTraces[plotType],
      `${plotType} produced unexpected trace types`
    );
    const { layout, data } = figure;
    const xLabel = layout.xaxis?.title?.text;
    const yLabel = layout.yaxis?.title?.text;
    if (plotType === "box") {
      assert.equal(xLabel, "Columns", "box x-axis label should be Columns");
      assert.equal(yLabel, "Values", "box y-axis label should be Values");
      const trace = data[0];
      assert.ok(Array.isArray(trace.y), "box should carry raw values");
      for (const key of ["q1", "median", "q3", "lowerfence", "upperfence"]) {
        assert.equal(
          trace[key],
          undefined,
          `box should not override ${key} (plotly computes it)`
        );
      }
      assert.match(
        String(trace.fillcolor),
        /rgba\([^)]*0\.25\)/,
        "box fill should be translucent like the references"
      );
    } else if (plotType === "heatmap") {
      assert.equal(xLabel, "Columns", "heatmap x-axis label should be Columns");
      assert.equal(yLabel, "Rows", "heatmap y-axis label should be Rows");
      const trace = data[0];
      assert.ok(trace.zmin <= 0 && trace.zmax >= 0, "heatmap should span zero");
      assert.equal(trace.zmin, -trace.zmax, "heatmap should be centered at 0");
      assert.ok(trace.text, "small heatmap should be annotated");
      assert.ok(
        Number.isFinite(layout.xaxis?.nticks) && Number.isFinite(layout.yaxis?.nticks),
        "heatmap ticks should be thinned"
      );
    } else if (plotType === "volcano") {
      assert.equal(xLabel, "X Axis", "volcano default x-axis label");
      assert.ok(
        data.every((trace) => trace.opacity === 0.7),
        "volcano points should be translucent"
      );
    }
  }
  await assert.rejects(manager.render([]), /requires a JSON payload/);
  await assert.rejects(
    manager.render(["{ not json"]),
    (error) => {
      // Malformed JSON payload: the child should exit non-zero and the
      // manager should surface a render failure instead of a valid figure.
      return error instanceof Error && !String(error.message).includes("{");
    }
  );
  console.log(
    `F# manager binary tests passed (${payloads.length} plot kinds, figure JSON)`
  );
}

manager.dispose();
