import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
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

const parseWorkerResponse = (output, label) => {
  const messages = output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const ready = messages.find((message) => message.type === "ready");
  const response = messages.find((message) => message.id === 1);

  assert.ok(ready, `${label} did not emit a ready message`);
  assert.equal(response?.ok, true, `${label} failed: ${response?.error ?? "no response"}`);

  const image = Buffer.from(response.result, "base64");
  assert.deepEqual(
    [...image.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    `${label} did not return a PNG image`
  );
};

assertArtifact(pythonExecutable, "Python renderer");
assertArtifact(fsharpExecutable, "F# renderer");
assertArtifact(rExecutable, "R runtime");

const pythonTempRoot = mkdtempSync(path.join(os.tmpdir(), "icarus-python-smoke-"));

try {
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
  parseWorkerResponse(pythonOutput, "Python renderer worker");
} finally {
  rmSync(pythonTempRoot, { recursive: true, force: true });
}

const fsharpTempDir = mkdtempSync(path.join(os.tmpdir(), "icarus-fsharp-smoke-"));
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
  assert.equal(figure.data?.[0]?.type, "heatmap", "F# renderer returned the wrong trace");
} finally {
  rmSync(fsharpTempDir, { recursive: true, force: true });
}

const rLibrary = path.join(rRuntimeRoot, "library");
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
  env: {
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
  },
  label: "R renderer worker",
});
parseWorkerResponse(rOutput, "R renderer worker");

console.log(`Bundled renderer runtime smoke tests passed (${runtimeKey})`);
