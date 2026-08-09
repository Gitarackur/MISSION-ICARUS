import assert from "node:assert/strict";
import {
  createFsharpPublishArgs,
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

console.log("Renderer runtime preparation tests passed");
