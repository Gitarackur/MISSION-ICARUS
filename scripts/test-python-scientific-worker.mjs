import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const python = process.env.PYTHON || "python3";
const numpyCheck = spawnSync(python, ["-c", "import numpy"], { stdio: "ignore" });
if (numpyCheck.status !== 0) {
  console.log("NumPy unavailable; skipping Python scientific worker test.");
  process.exit(0);
}
const sklearnAvailable =
  spawnSync(python, ["-c", "import sklearn, scipy"], { stdio: "ignore" }).status === 0;

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "icarus-scientific-worker-test-")
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
const rows = 36;
const names = ["x", "y", "wave", "grouped"];
const input = new Float64Array(rows * names.length);
for (let row = 0; row < rows; row += 1) {
  const x = row + 1;
  input[row] = x;
  input[rows + row] = row % 11 === 0 ? Number.NaN : x * 2 + 1;
  input[rows * 2 + row] = Math.sin(x / 4);
  input[rows * 3 + row] = row < rows / 2 ? x / 3 : x / 3 + 20;
}
await writeFile(inputPath, Buffer.from(input.buffer));

const sourceColumns = names.map((_, columnIndex) =>
  Array.from(input.slice(columnIndex * rows, (columnIndex + 1) * rows))
);
const approximatelyEqual = (actual, expected, tolerance = 1e-10) =>
  (Number.isNaN(actual) && Number.isNaN(expected)) ||
  Math.abs(actual - expected) <= tolerance;
const pairwiseCorrelation = (left, right) => {
  const pairs = left
    .map((value, index) => [value, right[index]])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 2) return 0;
  const leftMean = pairs.reduce((sum, [x]) => sum + x, 0) / pairs.length;
  const rightMean = pairs.reduce((sum, [, y]) => sum + y, 0) / pairs.length;
  let covariance = 0;
  let leftSquares = 0;
  let rightSquares = 0;
  pairs.forEach(([x, y]) => {
    covariance += (x - leftMean) * (y - rightMean);
    leftSquares += (x - leftMean) ** 2;
    rightSquares += (y - rightMean) ** 2;
  });
  const denominator = Math.sqrt(leftSquares * rightSquares);
  return denominator > 0 ? covariance / denominator : 0;
};
const quantileReference = (columns) => {
  const sorted = columns.map((column) =>
    column.filter(Number.isFinite).sort((a, b) => a - b)
  );
  const maximumRank = Math.max(...sorted.map((column) => column.length));
  const reference = Array.from({ length: maximumRank }, (_, rank) => {
    const values = sorted
      .filter((column) => rank < column.length)
      .map((column) => column[rank]);
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  });
  return columns.map((column) => {
    const observed = column
      .map((value, index) => ({ value, index }))
      .filter(({ value }) => Number.isFinite(value))
      .sort((left, right) => left.value - right.value);
    const output = Array(column.length).fill(Number.NaN);
    let position = 0;
    while (position < observed.length) {
      let end = position;
      while (
        end + 1 < observed.length &&
        observed[end + 1].value === observed[position].value
      ) {
        end += 1;
      }
      const rank = Math.round((position + end) / 2);
      for (let index = position; index <= end; index += 1) {
        output[observed[index].index] = reference[rank];
      }
      position = end + 1;
    }
    return output;
  });
};

const worker = spawn(python, [commanderPath, "--statistics-worker"], {
  cwd: repositoryRoot,
  env: {
    ...process.env,
    PYTHONPYCACHEPREFIX: path.join(temporaryDirectory, "pycache"),
    OMP_NUM_THREADS: "1",
    OPENBLAS_NUM_THREADS: "1",
    MKL_NUM_THREADS: "1",
  },
  stdio: ["pipe", "pipe", "pipe"],
});
const lines = createInterface({ input: worker.stdout, crlfDelay: Infinity });
let stderr = "";
let ready = false;
let progressMessages = 0;
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
  if (message.type === "progress" || message.type === "heartbeat") {
    progressMessages += 1;
    return;
  }
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
  if (!ready) throw new Error(`Scientific worker did not become ready: ${stderr}`);
};

const runAction = async (action, options = {}) => {
  const id = nextId++;
  const resultPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`${action} timed out: ${stderr}`)),
      60_000
    );
    timeout.unref();
    pending.set(id, { resolve, reject, timeout });
  });
  worker.stdin.write(
    `${JSON.stringify({
      id,
      command: "statistics:run",
      payload: {
        action,
        inputPath,
        outputPath,
        columnNames: names,
        rowCount: rows,
        ...options,
      },
    })}\n`
  );
  const manifest = await resultPromise;
  const bytes = await readFile(outputPath);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return { manifest, output: new Float64Array(copy.buffer) };
};

try {
  await waitUntilReady();

  const heatmap = await runAction("heatmap");
  assert.equal(heatmap.manifest.outputColumnCount, names.length);
  assert.equal(heatmap.manifest.outputRowCount, names.length);
  assert.equal(heatmap.output.length, names.length * names.length);
  assert.ok(heatmap.output.every(Number.isFinite));
  sourceColumns.forEach((left, leftIndex) => {
    sourceColumns.forEach((right, rightIndex) => {
      assert.ok(
        approximatelyEqual(
          heatmap.output[leftIndex * names.length + rightIndex],
          pairwiseCorrelation(left, right)
        ),
        `heatmap correlation ${leftIndex},${rightIndex} matches the JS contract`
      );
    });
  });

  const quantile = await runAction("quantile-normalization");
  assert.equal(quantile.manifest.outputColumnCount, names.length);
  assert.equal(quantile.manifest.outputRowCount, rows);
  assert.equal(quantile.output.length, input.length);
  const expectedQuantile = quantileReference(sourceColumns).flat();
  quantile.output.forEach((value, index) => {
    assert.ok(
      approximatelyEqual(value, expectedQuantile[index]),
      `quantile-normalized value ${index} matches the JS contract`
    );
  });

  const mice = await runAction("impute-multiple", {
    method: "pmm",
    imputations: 2,
    maxIterations: 2,
    seed: 42,
    reportedSeed: 42,
    maxPredictors: 3,
    workers: 2,
  });
  assert.equal(mice.manifest.outputColumnCount, names.length);
  assert.equal(mice.manifest.outputRowCount, rows);
  assert.equal(mice.manifest.metadata.missingCount, 4);
  assert.equal(mice.manifest.metadata.imputedCount, 4);

  if (sklearnAvailable) {
    const knn = await runAction("impute-knn", { neighbors: 3, weighted: true });
    assert.equal(knn.output.length, input.length);
    assert.ok(knn.output.every(Number.isFinite));

    const pca = await runAction("pca-learning", { numComponents: 2, seed: 42 });
    assert.equal(pca.manifest.outputColumnCount, 2);
    assert.equal(pca.manifest.outputRowCount, rows);

    const pcaClusters = await runAction("pca-analysis", {
      numComponents: 2,
      performClustering: true,
      clusters: 2,
      seed: 42,
    });
    assert.equal(pcaClusters.manifest.outputColumnCount, 3);
    assert.equal(pcaClusters.manifest.outputColumnNames[2], "Cluster_Assignment");

    const plsda = await runAction("plsda-learning", {
      numComponents: 2,
      labels: Array.from({ length: rows }, (_, index) =>
        index < rows / 2 ? "control" : "treatment"
      ),
    });
    assert.equal(plsda.manifest.outputColumnCount, 2);

    const kmeans = await runAction("k-means-clustering", {
      clusters: 2,
      maxIterations: 50,
      seed: 42,
    });
    assert.equal(kmeans.manifest.outputColumnCount, 1);
    const repeatedKmeans = await runAction("k-means-clustering", {
      clusters: 2,
      maxIterations: 50,
      seed: 42,
    });
    assert.deepEqual(repeatedKmeans.output, kmeans.output);

    const hierarchical = await runAction("hierarchical-clustering", {
      clusters: 2,
      linkage: "average",
    });
    assert.equal(hierarchical.manifest.outputColumnCount, 1);

    const tsne = await runAction("tsne-learning", {
      numDimensions: 2,
      perplexity: 8,
      iterations: 250,
      seed: 42,
    });
    assert.equal(tsne.manifest.outputColumnCount, 2);
    assert.equal(tsne.manifest.outputRowCount, rows);
  } else {
    console.log("scikit-learn unavailable; NumPy scientific actions were tested.");
  }

  assert.ok(progressMessages > 0, "scientific worker emitted progress messages");
  console.log("Python scientific worker tests passed");
} finally {
  lines.close();
  worker.kill();
  await rm(temporaryDirectory, { recursive: true, force: true });
}
