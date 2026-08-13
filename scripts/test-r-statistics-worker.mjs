import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const rscript = process.env.RSCRIPT_PATH || "Rscript";
const runtimeCheck = spawnSync(
  rscript,
  ["-e", "stopifnot(requireNamespace('jsonlite', quietly=TRUE))"],
  { stdio: "ignore" }
);
if (runtimeCheck.status !== 0) {
  console.log("R/jsonlite unavailable; skipping R statistics worker test.");
  process.exit(0);
}
const packageAvailable = (name) =>
  spawnSync(
    rscript,
    ["-e", `quit(status=if(requireNamespace('${name}', quietly=TRUE)) 0 else 1)`],
    { stdio: "ignore" }
  ).status === 0;

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "icarus-r-statistics-test-")
);
const inputPath = path.join(temporaryDirectory, "input.f64");
const outputPath = path.join(temporaryDirectory, "output.f64");
const workerPath = path.join(
  repositoryRoot,
  "assets",
  "scripts",
  "r",
  "statistics_worker.r"
);
const rows = 40;
const names = ["treatment_1", "treatment_2", "control_1", "control_2"];
const input = new Float64Array(rows * names.length);
for (let row = 0; row < rows; row += 1) {
  input[row] = row + 8;
  input[rows + row] = row + 10;
  input[rows * 2 + row] = row + 2;
  input[rows * 3 + row] = row + 3;
}
await writeFile(inputPath, Buffer.from(input.buffer));

const worker = spawn(rscript, [workerPath], {
  cwd: repositoryRoot,
  stdio: ["pipe", "pipe", "pipe"],
});
const lines = createInterface({ input: worker.stdout, crlfDelay: Infinity });
let ready = false;
let stderr = "";
let nextId = 1;
const pending = new Map();
worker.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});
lines.on("line", (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }
  if (message.type === "ready") {
    ready = true;
    return;
  }
  if (message.type === "progress") return;
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  clearTimeout(request.timeout);
  if (message.ok) request.resolve(message.result);
  else request.reject(new Error(message.error));
});

const waitUntilReady = async () => {
  const started = Date.now();
  while (!ready && Date.now() - started < 10_000) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(ready, true, `R statistics worker did not start: ${stderr}`);
};
const requestWorker = async (payload) => {
  const id = nextId++;
  const resultPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`${payload.action} timed out: ${stderr}`)),
      120_000
    );
    timeout.unref();
    pending.set(id, { resolve, reject, timeout });
  });
  worker.stdin.write(
    `${JSON.stringify({
      id,
      payload,
    })}\n`
  );
  return resultPromise;
};
const runAction = async (action, options) => {
  const manifest = await requestWorker({
    action,
    inputPath,
    outputPath,
    columnNames: names,
    rowCount: rows,
    ...options,
  });
  const output = await readFile(outputPath);
  return { manifest, output };
};

try {
  await waitUntilReady();
  const capabilities = await requestWorker({ action: "capabilities" });
  const expectedActions = [
    ...(packageAvailable("limma") ? ["limma"] : []),
    ...(packageAvailable("WGCNA") ? ["wgcna-analysis"] : []),
  ];
  assert.deepEqual([...capabilities.actions].sort(), expectedActions.sort());
  await assert.rejects(
    runAction("unsupported-action", {}),
    /Unsupported R scientific action/
  );
  if (packageAvailable("limma")) {
    const result = await runAction("limma", {
      treatmentColumns: names.slice(0, 2),
      controlColumns: names.slice(2),
      adjustmentMethod: "BH",
    });
    assert.equal(result.manifest.outputColumnCount, 3);
    assert.equal(result.manifest.outputRowCount, rows);
    assert.equal(result.output.byteLength, rows * 3 * Float64Array.BYTES_PER_ELEMENT);
  } else {
    console.log("R limma package unavailable; LIMMA execution test skipped.");
  }

  if (packageAvailable("WGCNA")) {
    const result = await runAction("wgcna-analysis", { softThreshold: 6, workers: 1 });
    assert.equal(result.manifest.outputColumnCount, 2);
    assert.equal(result.manifest.outputRowCount, rows);
  } else {
    console.log("R WGCNA package unavailable; WGCNA execution test skipped.");
  }
  console.log("R statistics worker lifecycle tests passed");
} finally {
  lines.close();
  worker.kill();
  await rm(temporaryDirectory, { recursive: true, force: true });
}
