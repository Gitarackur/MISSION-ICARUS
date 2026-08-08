import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: [
    fileURLToPath(
      new URL("../src/app-layer/database/matrix-storage.ts", import.meta.url)
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const encodedModule = Buffer.from(bundle.outputFiles[0].text).toString("base64");
const {
  MATRIX_STORAGE_FORMAT,
  decodeMatrix,
  encodeMatrix,
  isChunkedMatrixRecord,
  isMatrixPayloadLoaded,
  toLoadedLegacyMatrix,
  toMatrixMetadataPlaceholder,
} = await import(`data:text/javascript;base64,${encodedModule}`);

const matrix = {
  id: "mixed-matrix",
  createdAt: 123,
  columns: ["numeric", "label", "mixed"],
  data: [
    [1, "alpha", 10],
    [Number.NaN, "beta", "not-numeric"],
    [Number.POSITIVE_INFINITY, "gamma", 12],
    [-0, "delta", 13],
  ],
  createdByFirstActivity: true,
};

const encoded = encodeMatrix(matrix, 6);
assert.equal(encoded.metadata.storageFormat, MATRIX_STORAGE_FORMAT);
assert.equal(encoded.metadata.rowCount, 4);
assert.equal(encoded.metadata.columnCount, 3);
assert.equal(encoded.metadata.chunkCount, 2);
assert.equal(isChunkedMatrixRecord(encoded.metadata), true);
assert.equal(encoded.chunks[0].columns[0].kind, "float64");
assert.equal(encoded.chunks[0].columns[1].kind, "values");
assert.equal(encoded.chunks[0].columns[2].kind, "values");

const decoded = decodeMatrix(encoded.metadata, [...encoded.chunks].reverse());
assert.equal(decoded.id, matrix.id);
assert.equal(decoded.payloadState, "loaded");
assert.deepEqual(decoded.columns, matrix.columns);
assert.equal(decoded.data[0][0], 1);
assert.equal(Number.isNaN(decoded.data[1][0]), true);
assert.equal(decoded.data[2][0], Number.POSITIVE_INFINITY);
assert.equal(Object.is(decoded.data[3][0], -0), true);
assert.deepEqual(
  decoded.data.map((row) => row.slice(1)),
  matrix.data.map((row) => row.slice(1))
);

const placeholder = toMatrixMetadataPlaceholder(encoded.metadata);
assert.deepEqual(placeholder.data, []);
assert.equal(placeholder.rowCount, 4);
assert.equal(placeholder.payloadState, "metadata");
assert.equal(isMatrixPayloadLoaded(placeholder), false);

const legacy = toLoadedLegacyMatrix(matrix);
assert.equal(legacy.storageFormat, "legacy-object");
assert.equal(legacy.rowCount, 4);
assert.equal(isMatrixPayloadLoaded(legacy), true);
assert.deepEqual(matrix.data[0], [1, "alpha", 10]);

const sparse = encodeMatrix({
  id: "sparse",
  createdAt: 1,
  columns: ["possibly-missing"],
  data: [[undefined]],
});
assert.equal(sparse.chunks[0].columns[0].kind, "values");
assert.equal(
  decodeMatrix(sparse.metadata, sparse.chunks).data[0][0],
  undefined
);

assert.throws(
  () =>
    decodeMatrix(
      { ...encoded.metadata, chunkCount: encoded.metadata.chunkCount + 1 },
      encoded.chunks
    ),
  /incomplete/
);

console.log("Matrix storage codec tests passed");
