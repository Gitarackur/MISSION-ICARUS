import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      export { default as EmbeddedRManager } from "./electron/src/r/r-manager.ts";
      export {
        PersistentJsonWorker,
        PersistentWorkerUnavailableError,
      } from "./electron/src/core/PersistentJsonWorker.ts";
    `,
    resolveDir: repositoryRoot,
    sourcefile: "renderer-worker-test-entry.ts",
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
          namespace: "renderer-worker-tests",
        }));
        buildContext.onLoad(
          {
            filter: /.*/,
            namespace: "renderer-worker-tests",
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
const {
  EmbeddedRManager,
  PersistentJsonWorker,
  PersistentWorkerUnavailableError,
} = await import(`data:text/javascript;base64,${encodedModule}`);

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const workerSource = `
  const { createInterface } = require("node:readline");
  process.stdout.write(JSON.stringify({ type: "ready" }) + "\\n");
  const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
  input.on("line", (line) => {
    const request = JSON.parse(line);
    if (request.action === "hang") return;
    process.stdout.write(JSON.stringify({
      id: request.id,
      ok: true,
      result: String(request.id),
    }) + "\\n");
  });
`;

{
  const worker = new PersistentJsonWorker(
    process.execPath,
    ["\0"],
    {},
    "Synchronous failure test",
    1_000,
    1_000
  );
  await assert.rejects(worker.start(), /could not start/);
  await assert.rejects(worker.start(), /could not start/);
}

{
  const worker = new PersistentJsonWorker(
    process.execPath,
    ["-e", workerSource],
    {},
    "Request lifecycle test",
    1_000,
    300
  );
  assert.equal(await worker.request({ action: "reply", id: 999 }), "1");
  await assert.rejects(worker.request({ action: "hang" }), /did not respond/);
  assert.equal(await worker.request({ action: "reply" }), "3");
  worker.dispose();
}

if (process.platform !== "win32") {
  const stubbornWorkerSource = `
    process.on("SIGTERM", () => {});
    process.stdout.write(JSON.stringify({ type: "ready" }) + "\\n");
    setInterval(() => {}, 1_000);
  `;
  const worker = new PersistentJsonWorker(
    process.execPath,
    ["-e", stubbornWorkerSource],
    {},
    "Forced shutdown test",
    1_000,
    1_000
  );
  await worker.start();
  const workerPid = worker.process.pid;
  worker.dispose();
  await delay(2_500);
  assert.throws(() => process.kill(workerPid, 0), { code: "ESRCH" });
}

class FakeWorker {
  constructor(startMode, requestMode) {
    this.startMode = startMode;
    this.requestMode = requestMode;
    this.disposed = false;
    this.rejectStart = null;
    this.rejectRequest = null;
  }

  start() {
    if (this.startMode === "resolve") return Promise.resolve();
    return new Promise((_resolve, reject) => {
      this.rejectStart = reject;
    });
  }

  request() {
    if (this.requestMode === "resolve") return Promise.resolve("worker result");
    return new Promise((_resolve, reject) => {
      this.rejectRequest = reject;
    });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const error = new PersistentWorkerUnavailableError("Fake worker stopped.");
    this.rejectStart?.(error);
    this.rejectRequest?.(error);
  }
}

{
  const workers = new Map();
  const manager = new EmbeddedRManager((_command, args) => {
    const scriptPath = args[1];
    const worker = new FakeWorker(
      scriptPath === "second.r" ? "resolve" : "pending",
      "resolve"
    );
    workers.set(scriptPath, worker);
    return worker;
  });
  manager.rScriptExe = process.execPath;

  const firstWarmUp = manager.warmUp("first.r");
  const secondWarmUp = manager.warmUp("second.r");
  assert.equal(await firstWarmUp, false);
  assert.equal(await secondWarmUp, true);
  assert.equal(workers.get("second.r").disposed, false);
  assert.equal(manager.workerDisabled, false);
  manager.dispose();
}

{
  const workers = new Map();
  const fallbackScripts = [];
  const manager = new EmbeddedRManager((_command, args) => {
    const scriptPath = args[1];
    const worker = new FakeWorker(
      "resolve",
      scriptPath === "second.r" ? "resolve" : "pending"
    );
    workers.set(scriptPath, worker);
    return worker;
  });
  manager.rScriptExe = process.execPath;
  manager.runRScript = async (scriptPath) => {
    fallbackScripts.push(scriptPath);
    return `fallback:${scriptPath}`;
  };

  const firstRequest = manager.runRendererScript("first.r", ["payload"]);
  const secondRequest = manager.runRendererScript("second.r", ["payload"]);
  assert.equal(await firstRequest, "fallback:first.r");
  assert.equal(await secondRequest, "worker result");
  assert.deepEqual(fallbackScripts, ["first.r"]);
  assert.equal(workers.get("second.r").disposed, false);
  assert.equal(manager.workerDisabled, false);
  manager.dispose();
}

{
  let fallbackCount = 0;
  const manager = new EmbeddedRManager(
    () => new FakeWorker("resolve", "pending")
  );
  manager.rScriptExe = process.execPath;
  manager.runRScript = async () => {
    fallbackCount += 1;
    return "unexpected fallback";
  };

  const request = manager.runRendererScript("active.r", ["payload"]);
  manager.dispose();
  await assert.rejects(request, /stopped/);
  await assert.rejects(
    manager.runRendererScript("after-dispose.r", ["payload"]),
    /disposed/
  );
  assert.equal(fallbackCount, 0);
}

console.log("Renderer worker lifecycle tests passed");
