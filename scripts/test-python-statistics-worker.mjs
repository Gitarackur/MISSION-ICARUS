import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const python = process.env.PYTHON || "python3";
const dependencyCheck = spawnSync(
  python,
  ["-c", "import numpy"],
  { stdio: "ignore" }
);

if (dependencyCheck.status !== 0) {
  console.log("Python scientific dependencies unavailable; skipping statistics worker test.");
  process.exit(0);
}

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "icarus-python-statistics-test-")
);
const inputPath = path.join(temporaryDirectory, "input.f64");
const outputPath = path.join(temporaryDirectory, "output.f64");
const commanderPath = path.join(
  repositoryRoot,
  "assets",
  "scripts",
  "python",
  "commander.py"
);

const rows = 200;
const columns = 4;
const input = new Float64Array(rows * columns);
for (let row = 0; row < rows; row += 1) {
  const x = row + 1;
  input[row] = x;
  input[rows + row] = row % 17 === 0 ? Number.NaN : 2 * x + 3;
  input[2 * rows + row] = row % 23 === 0 ? Number.NaN : Math.sin(x / 10);
  input[3 * rows + row] = row % 29 === 0 ? Number.NaN : x / 3 - 5;
}
const expectedMissing = Array.from(input).filter(
  (value) => !Number.isFinite(value)
).length;
await writeFile(
  inputPath,
  Buffer.from(input.buffer, input.byteOffset, input.byteLength)
);

const processHandle = spawn(python, [commanderPath, "--statistics-worker"], {
  cwd: repositoryRoot,
  env: {
    ...process.env,
    PYTHONPYCACHEPREFIX: path.join(temporaryDirectory, "pycache"),
    MPLCONFIGDIR: path.join(temporaryDirectory, "matplotlib"),
    OMP_NUM_THREADS: "1",
    OPENBLAS_NUM_THREADS: "1",
    MKL_NUM_THREADS: "1",
  },
  stdio: ["pipe", "pipe", "pipe"],
});
const output = createInterface({ input: processHandle.stdout, crlfDelay: Infinity });
let stderr = "";
let progressMessages = 0;
processHandle.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

const startedAt = performance.now();
const workerPayload = {
  action: "impute-multiple",
  inputPath,
  outputPath,
  columnNames: ["x", "y", "oscillation", "trend"],
  rowCount: rows,
  method: "pmm",
  imputations: 3,
  maxIterations: 4,
  seed: 42,
  maxPredictors: 3,
  workers: 2,
};
try {
  const result = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Python statistics worker timed out: ${stderr}`)),
      30_000
    );
    timeout.unref();

    output.on("line", (line) => {
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        return;
      }
      if (message.type === "ready") {
        processHandle.stdin.write(
          JSON.stringify({
            id: 1,
            command: "statistics:run",
            payload: workerPayload,
          }) + "\n"
        );
        return;
      }
      if (message.type === "progress" || message.type === "heartbeat") {
        progressMessages += 1;
        return;
      }
      if (message.id !== 1) return;
      clearTimeout(timeout);
      if (message.ok) resolve(message.result);
      else reject(new Error(message.error));
    });
    processHandle.once("error", reject);
    processHandle.once("close", (code) => {
      if (code !== 0) reject(new Error(`Worker exited ${code}: ${stderr}`));
    });
  });

  const bytes = await readFile(outputPath);
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  const imputed = new Float64Array(copied.buffer);

  const secondResult = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Second Python worker request timed out: ${stderr}`)),
      30_000
    );
    timeout.unref();
    const listener = (line) => {
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        return;
      }
      if (message.id !== 2 || message.type === "progress" || message.type === "heartbeat") {
        return;
      }
      clearTimeout(timeout);
      output.off("line", listener);
      if (message.ok) resolve(message.result);
      else reject(new Error(message.error));
    };
    output.on("line", listener);
    processHandle.stdin.write(
      JSON.stringify({
        id: 2,
        command: "statistics:run",
        payload: workerPayload,
      }) + "\n"
    );
  });
  const repeatedBytes = await readFile(outputPath);
  assert.equal(imputed.length, input.length, "output preserves the matrix shape");
  assert.equal(
    result.metadata.missingCount,
    expectedMissing,
    "worker reports missing cells"
  );
  assert.equal(
    result.metadata.imputedCount,
    result.metadata.missingCount,
    "all missing cells imputed"
  );
  assert.equal(
    result.metadata.columnSummaries.length,
    columns,
    "one Rubin summary per column"
  );
  assert.equal(
    secondResult.metadata.missingCount,
    result.metadata.missingCount
  );
  assert.deepEqual(
    repeatedBytes,
    bytes,
    "fixed-seed parallel chains are bit-for-bit reproducible on the warm worker"
  );
  assert.ok(progressMessages > 0, "worker emitted progress or heartbeat messages");

  for (let index = 0; index < input.length; index += 1) {
    if (Number.isFinite(input[index])) {
      assert.equal(imputed[index], input[index], `observed cell ${index} is unchanged`);
    } else {
      assert.ok(Number.isFinite(imputed[index]), `missing cell ${index} is imputed`);
    }
  }

  console.log(
    `Python statistics worker test passed in ${Math.round(performance.now() - startedAt)}ms ` +
      `(${rows} rows, ${columns} columns, ${result.metadata.workers} chain workers)`
  );
} finally {
  output.close();
  processHandle.kill();
  await rm(temporaryDirectory, { recursive: true, force: true });
}
