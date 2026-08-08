import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: [
    fileURLToPath(
      new URL(
        "../src/app-layer/database/health/storage-health.ts",
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
const { isQuotaExceededError } = await import(
  `data:text/javascript;base64,${encodedModule}`
);

assert.equal(isQuotaExceededError({ name: "QuotaExceededError" }), true);
assert.equal(
  isQuotaExceededError({
    name: "DexieError",
    inner: { name: "Dexie.QuotaExceededError" },
  }),
  true
);
assert.equal(isQuotaExceededError({ name: "UnknownError" }), false);

const circularError = { name: "DexieError" };
circularError.inner = circularError;
assert.equal(isQuotaExceededError(circularError), false);

console.log("Storage health tests passed");
