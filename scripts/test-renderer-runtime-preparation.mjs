import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createFsharpPublishArgs,
  getRendererBuildOrder,
  getRuntimeTarget,
} from "./prepare-renderer-runtimes.mjs";
import {
  R_RUNTIME_DEPENDENCY_FIELDS,
  RRuntimeVendor,
} from "../assets/scripts/r/vendor-r-runtime.mjs";

const windowsTarget = getRuntimeTarget("win32", "x64");

assert.deepEqual(windowsTarget, {
  nodePlatform: "win32",
  arch: "x64",
  platform: "windows",
  runtimeKey: "windows-x64",
  runtimeIdentifier: "win-x64",
  nativeExecutableSuffix: ".exe",
  pythonExecutableName: "commander.exe",
});

const windowsPublishArgs = createFsharpPublishArgs({
  projectPath: "IcarusPlotRenderer.fsproj",
  outputDirectory: "assets/runtime/fsharp/windows-x64",
  runtimeIdentifier: windowsTarget.runtimeIdentifier,
});

assert.deepEqual(windowsPublishArgs, [
  "publish",
  "IcarusPlotRenderer.fsproj",
  "--configuration",
  "Release",
  "--runtime",
  "win-x64",
  "--self-contained",
  "true",
  "--property",
  "PublishSingleFile=true",
  "--output",
  "assets/runtime/fsharp/windows-x64",
]);
assert.equal(
  windowsPublishArgs.some((argument) => argument.startsWith("/p:")),
  false,
  "MSBuild properties must not use slash-prefixed syntax under Git Bash"
);

assert.deepEqual(getRendererBuildOrder("win32"), ["fsharp", "r", "python"]);
assert.deepEqual(getRendererBuildOrder("linux"), ["fsharp", "python", "r"]);

assert.deepEqual(getRuntimeTarget("darwin", "arm64"), {
  nodePlatform: "darwin",
  arch: "arm64",
  platform: "macos",
  runtimeKey: "macos-arm64",
  runtimeIdentifier: "osx-arm64",
  nativeExecutableSuffix: "",
  pythonExecutableName: "commander.bin",
});

assert.throws(
  () => getRuntimeTarget("freebsd", "x64"),
  /Unsupported renderer runtime platform/
);

assert.deepEqual(R_RUNTIME_DEPENDENCY_FIELDS, ["Depends", "Imports"]);

class CapturingRRuntimeVendor extends RRuntimeVendor {
  runR(_rscript, expression) {
    this.dependencyExpression = expression;
    return this.requiredPackages.join("\n");
  }
}

let capturedRScript;
const transportVendor = new RRuntimeVendor({
  runProcess: (_command, args) => {
    assert.equal(args.length, 1);
    assert.match(args[0], /expression\.R$/);
    capturedRScript = readFileSync(args[0], "utf8");
    return "transport-ok\n";
  },
});

assert.equal(transportVendor.runR("Rscript", "cat('transport-ok')"), "transport-ok");
assert.equal(capturedRScript, "cat('transport-ok')\n");

const rVendor = new CapturingRRuntimeVendor();
rVendor.getRequiredPackagesWithDependencies("Rscript");

assert.match(
  rVendor.dependencyExpression,
  /which = c\("Depends", "Imports"\)/,
  "R runtime vendoring must include runtime dependencies only"
);
assert.doesNotMatch(
  rVendor.dependencyExpression,
  /"LinkingTo"/,
  "compile-time LinkingTo packages must not be required in the bundled runtime"
);

const linuxRuntimeRoot = mkdtempSync(
  path.join(os.tmpdir(), "icarus-linux-r-wrapper-")
);

try {
  mkdirSync(path.join(linuxRuntimeRoot, "bin"));
  rVendor.writeRscriptWrapper(linuxRuntimeRoot, "linux");
  const linuxWrapper = readFileSync(
    path.join(linuxRuntimeRoot, "bin", "Rscript"),
    "utf8"
  );

  assert.match(linuxWrapper, /R_HOME_DIR=.*dirname/);
  assert.match(linuxWrapper, /export LD_LIBRARY_PATH=/);
  assert.doesNotMatch(linuxWrapper, /DYLD_LIBRARY_PATH/);
  assert.match(linuxWrapper, /exec "\$R_HOME_DIR\/bin\/exec\/R"/);
} finally {
  rmSync(linuxRuntimeRoot, { recursive: true, force: true });
}

console.log("Renderer runtime preparation tests passed");
