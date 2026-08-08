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
  fallback: () => "fallback",
  failureMessage: "request failed",
});
const secondRequest = runWorkerRequest({
  createWorker: () => secondWorker,
  request: {},
  fallback: () => "fallback",
  failureMessage: "request failed",
});
assert.deepEqual(await Promise.all([firstRequest, secondRequest]), ["first", "second"]);
assert.equal(firstWorker.terminated, true);
assert.equal(secondWorker.terminated, true);

const malformedWorker = new FakeWorker("messageerror");
await assert.rejects(
  runWorkerRequest({
    createWorker: () => malformedWorker,
    request: {},
    fallback: () => "fallback",
    failureMessage: "request failed",
  }),
  /invalid worker response/
);
assert.equal(malformedWorker.terminated, true);

const hangingWorker = new FakeWorker("hang");
await assert.rejects(
  runWorkerRequest({
    createWorker: () => hangingWorker,
    request: {},
    fallback: () => "fallback",
    failureMessage: "request failed",
    timeoutMs: 10,
  }),
  /did not respond/
);
assert.equal(hangingWorker.terminated, true);

console.log("Browser worker client tests passed");
