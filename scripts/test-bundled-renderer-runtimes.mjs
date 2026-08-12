import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const platform =
  process.platform === "darwin"
    ? "macos"
    : process.platform === "win32"
      ? "windows"
      : "linux";
const arch = process.arch;
const runtimeKey = `${platform}-${arch}`;
const pythonExecutableName =
  process.platform === "win32"
    ? "commander.exe"
    : process.platform === "darwin"
      ? "commander.bin"
      : "commander";
const nativeExecutableSuffix = process.platform === "win32" ? ".exe" : "";
const requestedRenderers = new Set(
  process.argv.flatMap((argument, index, arguments_) =>
    argument === "--renderer" && arguments_[index + 1]
      ? [arguments_[index + 1]]
      : []
  )
);
const shouldTestRenderer = (rendererKey) =>
  requestedRenderers.size === 0 || requestedRenderers.has(rendererKey);

const pythonExecutable = path.join(
  repositoryRoot,
  "assets",
  "scripts",
  "python",
  "bin",
  pythonExecutableName
);
const fsharpExecutable = path.join(
  repositoryRoot,
  "assets",
  "runtime",
  "fsharp",
  runtimeKey,
  `fsharp-plot${nativeExecutableSuffix}`
);
const rRuntimeRoot = path.join(
  repositoryRoot,
  "assets",
  "runtime",
  "r",
  runtimeKey
);
const rExecutable = path.join(
  rRuntimeRoot,
  "bin",
  `Rscript${nativeExecutableSuffix}`
);

const assertArtifact = (artifactPath, label) => {
  assert.equal(existsSync(artifactPath), true, `${label} is missing: ${artifactPath}`);
  assert.ok(statSync(artifactPath).size > 0, `${label} is empty: ${artifactPath}`);
};

const runProcess = ({ command, args, input, env, label, timeout = 180_000 }) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env,
    input,
    maxBuffer: 32 * 1024 * 1024,
    timeout,
  });

  assert.ifError(result.error);
  assert.equal(
    result.status,
    0,
    `${label} exited with ${result.status ?? result.signal ?? "unknown"}\n` +
      `STDERR:\n${result.stderr}\nSTDOUT:\n${result.stdout}`
  );
  return result.stdout.trim();
};

const parseWorkerMessages = (output, label) => {
  const messages = output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const ready = messages.find((message) => message.type === "ready");
  assert.ok(ready, `${label} did not emit a ready message`);
  return messages;
};

const parseWorkerResponse = (messages, label, requestId = 1) => {
  const response = messages.find(
    (message) => message.id === requestId && "ok" in message
  );
  assert.equal(
    response?.ok,
    true,
    `${label} failed: ${response?.error ?? "no response"}`
  );
  return response;
};

const assertPngResponse = (response, label) => {
  const image = Buffer.from(response.result, "base64");
  assert.deepEqual(
    [...image.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    `${label} did not return a PNG image`
  );
};

const writeFloat64Matrix = (filePath, columns) => {
  const rowCount = columns[0]?.length ?? 0;
  assert.ok(rowCount > 0, "Scientific smoke-test matrix must contain rows");
  assert.ok(
    columns.every((column) => column.length === rowCount),
    "Scientific smoke-test matrix columns must have equal lengths"
  );
  const bytes = Buffer.alloc(
    columns.length * rowCount * Float64Array.BYTES_PER_ELEMENT
  );
  let offset = 0;
  columns.forEach((column) => {
    column.forEach((value) => {
      bytes.writeDoubleLE(value, offset);
      offset += Float64Array.BYTES_PER_ELEMENT;
    });
  });
  writeFileSync(filePath, bytes);
};

const assertFiniteFloat64Output = (filePath, valueCount, label) => {
  const bytes = readFileSync(filePath);
  assert.equal(
    bytes.byteLength,
    valueCount * Float64Array.BYTES_PER_ELEMENT,
    `${label} returned the wrong binary output size`
  );
  for (let offset = 0; offset < bytes.byteLength; offset += 8) {
    assert.ok(
      Number.isFinite(bytes.readDoubleLE(offset)),
      `${label} returned NaN`
    );
  }
};

if (shouldTestRenderer("python")) {
  assertArtifact(pythonExecutable, "Python renderer");
}
if (shouldTestRenderer("fsharp")) {
  assertArtifact(fsharpExecutable, "F# renderer");
}
if (shouldTestRenderer("r")) {
  assertArtifact(rExecutable, "R runtime");
}

if (shouldTestRenderer("python")) {
  const pythonTempRoot = mkdtempSync(
    path.join(os.tmpdir(), "icarus-python-smoke-")
  );

  try {
    const statisticsInputPath = path.join(
      pythonTempRoot,
      "statistics-input.f64"
    );
    const statisticsOutputPath = path.join(
      pythonTempRoot,
      "statistics-output.f64"
    );
    const statisticsColumns = [
      [1, 3, 2, 4],
      [8, 6, 7, 5],
    ];
    writeFloat64Matrix(statisticsInputPath, statisticsColumns);
    const pythonOutput = runProcess({
      command: pythonExecutable,
      args: ["--worker"],
      input: `${JSON.stringify({
        id: 1,
        command: "heatmap",
        payload: {
          matrix: [
            [1, 0],
            [0, 1],
          ],
          row_labels: ["A", "B"],
          col_labels: ["A", "B"],
          title: "Runtime smoke test",
          displaySettings: { plotWidth: 640, plotHeight: 400 },
        },
      })}\n`,
      env: {
        ...process.env,
        TMPDIR: pythonTempRoot,
        TEMP: pythonTempRoot,
        TMP: pythonTempRoot,
        MPLCONFIGDIR: path.join(pythonTempRoot, "matplotlib"),
        XDG_CACHE_HOME: path.join(pythonTempRoot, "cache"),
        FONTCONFIG_PATH: path.join(pythonTempRoot, "fontconfig"),
        MPLBACKEND: "Agg",
      },
      label: "Python renderer worker",
    });
    const pythonMessages = parseWorkerMessages(
      pythonOutput,
      "Python renderer worker"
    );
    assertPngResponse(
      parseWorkerResponse(pythonMessages, "Python renderer worker"),
      "Python renderer worker"
    );

    const scientificOutput = runProcess({
      command: pythonExecutable,
      args: ["--statistics-worker"],
      input: `${JSON.stringify({
        id: 1,
        command: "statistics:run",
        payload: {
          action: "quantile-normalization",
          inputPath: statisticsInputPath,
          outputPath: statisticsOutputPath,
          columnNames: ["sample_a", "sample_b"],
          rowCount: statisticsColumns[0].length,
        },
      })}\n`,
      env: {
        ...process.env,
        TMPDIR: pythonTempRoot,
        TEMP: pythonTempRoot,
        TMP: pythonTempRoot,
      },
      label: "Python scientific worker",
    });
    const scientificMessages = parseWorkerMessages(
      scientificOutput,
      "Python scientific worker"
    );
    const scientificResponse = parseWorkerResponse(
      scientificMessages,
      "Python scientific worker"
    );
    assert.equal(scientificResponse.result.outputColumnCount, 2);
    assert.equal(scientificResponse.result.outputRowCount, 4);
    assertFiniteFloat64Output(
      statisticsOutputPath,
      8,
      "Python scientific worker"
    );
  } finally {
    rmSync(pythonTempRoot, { recursive: true, force: true });
  }
}

if (shouldTestRenderer("fsharp")) {
  const fsharpTempDir = mkdtempSync(
    path.join(os.tmpdir(), "icarus-fsharp-smoke-")
  );
  const fsharpPayloadPath = path.join(fsharpTempDir, "payload.json");

  try {
    writeFileSync(
      fsharpPayloadPath,
      JSON.stringify({
        plotType: "heatmap",
        payload: {
          matrix: [
            [1, 0],
            [0, 1],
          ],
          row_labels: ["A", "B"],
          col_labels: ["A", "B"],
          title: "Runtime smoke test",
        },
      })
    );
    const fsharpOutput = runProcess({
      command: fsharpExecutable,
      args: [fsharpPayloadPath],
      label: "F# renderer",
    });
    const figure = JSON.parse(fsharpOutput);
    assert.equal(
      figure.data?.[0]?.type,
      "heatmap",
      "F# renderer returned the wrong trace"
    );
  } finally {
    rmSync(fsharpTempDir, { recursive: true, force: true });
  }
}

if (shouldTestRenderer("r")) {
  const rLibrary = path.join(rRuntimeRoot, "library");
  const rEnvironment = {
    ...process.env,
    PATH: [path.join(rRuntimeRoot, "bin"), process.env.PATH]
      .filter(Boolean)
      .join(path.delimiter),
    R_HOME: rRuntimeRoot,
    R_DOC_DIR: path.join(rRuntimeRoot, "doc"),
    R_INCLUDE_DIR: path.join(rRuntimeRoot, "include"),
    R_SHARE_DIR: path.join(rRuntimeRoot, "share"),
    R_LIBS: rLibrary,
    R_LIBS_USER: rLibrary,
    R_LIBS_SITE: rLibrary,
  };
  const rOutput = runProcess({
    command: rExecutable,
    args: [
      path.join(repositoryRoot, "assets", "scripts", "r", "plot_r_worker.r"),
      path.join(repositoryRoot, "assets", "scripts", "r", "plot_r.r"),
    ],
    input: `${JSON.stringify({
      id: 1,
      payload: JSON.stringify({
        plotType: "bar",
        payload: {
          categories: ["A", "B"],
          series: [{ name: "Values", values: [1, 2] }],
          title: "Runtime smoke test",
          displaySettings: { plotWidth: 640, plotHeight: 400 },
        },
      }),
    })}\n`,
    env: rEnvironment,
    label: "R renderer worker",
  });
  const rMessages = parseWorkerMessages(rOutput, "R renderer worker");
  assertPngResponse(
    parseWorkerResponse(rMessages, "R renderer worker"),
    "R renderer worker"
  );

  const rStatisticsTempRoot = mkdtempSync(
    path.join(os.tmpdir(), "icarus-r-statistics-smoke-")
  );
  try {
    const inputPath = path.join(rStatisticsTempRoot, "input.f64");
    const outputPath = path.join(rStatisticsTempRoot, "output.f64");
    const columns = [
      [10, 12, 14, 16, 18, 20],
      [11, 13, 15, 17, 19, 21],
      [4, 5, 6, 7, 8, 9],
      [5, 6, 7, 8, 9, 10],
    ];
    writeFloat64Matrix(inputPath, columns);
    const statisticsOutput = runProcess({
      command: rExecutable,
      args: [
        path.join(
          repositoryRoot,
          "assets",
          "scripts",
          "r",
          "statistics_worker.r"
        ),
      ],
      input: `${JSON.stringify({
        id: 1,
        payload: {
          action: "limma",
          inputPath,
          outputPath,
          columnNames: [
            "treatment_1",
            "treatment_2",
            "control_1",
            "control_2",
          ],
          rowCount: columns[0].length,
          treatmentColumns: ["treatment_1", "treatment_2"],
          controlColumns: ["control_1", "control_2"],
          adjustmentMethod: "BH",
        },
      })}\n`,
      env: rEnvironment,
      label: "R LIMMA statistics worker",
    });
    const statisticsMessages = parseWorkerMessages(
      statisticsOutput,
      "R LIMMA statistics worker"
    );
    const statisticsResponse = parseWorkerResponse(
      statisticsMessages,
      "R LIMMA statistics worker"
    );
    assert.equal(statisticsResponse.result.outputColumnCount, 3);
    assert.equal(statisticsResponse.result.outputRowCount, columns[0].length);
    assertFiniteFloat64Output(
      outputPath,
      columns[0].length * 3,
      "R LIMMA statistics worker"
    );
  } finally {
    rmSync(rStatisticsTempRoot, { recursive: true, force: true });
  }
}

const testedRendererLabel =
  requestedRenderers.size === 0
    ? "all renderers"
    : [...requestedRenderers].join(", ");
console.log(
  `Bundled renderer runtime smoke tests passed (${runtimeKey}: ${testedRendererLabel})`
);
