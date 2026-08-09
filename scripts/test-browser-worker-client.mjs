import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: [
    fileURLToPath(
      new URL(
        "../src/app-layer/shared/workers/worker-client.ts",
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
const { runWorkerRequest } = await import(
  `data:text/javascript;base64,${encodedModule}`
);

const workerNotices = [];
globalThis.CustomEvent = class CustomEvent {
  constructor(type, options) {
    this.type = type;
    this.detail = options?.detail;
  }
};
globalThis.window = {
  dispatchEvent: (event) => {
    workerNotices.push(event.detail);
    return true;
  },
};

class FakeWorker {
  constructor(mode, result) {
    this.mode = mode;
    this.result = result;
    this.terminated = false;
  }

  postMessage() {
    if (this.mode === "reply") {
      setTimeout(() => this.onmessage({ data: { ok: true, result: this.result } }), 0);
    } else if (this.mode === "messageerror") {
      setTimeout(() => this.onmessageerror(), 0);
    }
  }

  terminate() {
    this.terminated = true;
  }
}

globalThis.Worker = FakeWorker;

const firstWorker = new FakeWorker("reply", "first");
const secondWorker = new FakeWorker("reply", "second");
const firstRequest = runWorkerRequest({
  createWorker: () => firstWorker,
  request: {},
  failureMessage: "request failed",
  operationName: "First test operation",
});
const secondRequest = runWorkerRequest({
  createWorker: () => secondWorker,
  request: {},
  failureMessage: "request failed",
  operationName: "Second test operation",
});
assert.deepEqual(await Promise.all([firstRequest, secondRequest]), ["first", "second"]);
assert.equal(firstWorker.terminated, true);
assert.equal(secondWorker.terminated, true);

const malformedWorker = new FakeWorker("messageerror");
await assert.rejects(
  runWorkerRequest({
    createWorker: () => malformedWorker,
    request: {},
    failureMessage: "request failed",
    operationName: "Malformed response test",
  }),
  /invalid response/
);
assert.equal(malformedWorker.terminated, true);

const hangingWorker = new FakeWorker("hang");
await assert.rejects(
  runWorkerRequest({
    createWorker: () => hangingWorker,
    request: {},
    failureMessage: "request failed",
    operationName: "Timeout test",
    timeoutMs: 10,
  }),
  /processing limit/
);
assert.equal(hangingWorker.terminated, true);
assert.equal(workerNotices.at(-1).code, "WORKER_TIMEOUT");
assert.match(workerNotices.at(-1).message, /interface responsive/);

delete globalThis.Worker;
await assert.rejects(
  runWorkerRequest({
    createWorker: () => {
      throw new Error("must not create a worker");
    },
    request: {},
    failureMessage: "request failed",
    operationName: "Unavailable worker test",
  }),
  (error) => error.code === "WORKER_UNAVAILABLE"
);
assert.equal(workerNotices.at(-1).code, "WORKER_UNAVAILABLE");

const matrixCodecBundle = await build({
  entryPoints: [
    fileURLToPath(
      new URL(
        "../src/app-layer/database/matrix/matrix-codec.ts",
        import.meta.url
      )
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const encodedMatrixCodecModule = Buffer.from(
  matrixCodecBundle.outputFiles[0].text
).toString("base64");
const { matrixCodec } = await import(
  `data:text/javascript;base64,${encodedMatrixCodecModule}`
);
await assert.rejects(
  matrixCodec.encode({
    id: "no-renderer-fallback",
    createdAt: 1,
    columns: ["value"],
    data: [[1]],
  }),
  (error) => error.code === "WORKER_UNAVAILABLE"
);

console.log("Browser worker client tests passed");
