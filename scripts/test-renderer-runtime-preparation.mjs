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
  getPythonTransientBuildStatePaths,
  getRendererBuildOrder,
  getRuntimeTarget,
  RRendererBuilder,
} from "./prepare-renderer-runtimes.mjs";
import {
  R_RUNTIME_DEPENDENCY_FIELDS,
  R_RUNTIME_REQUIRED_PACKAGES,
  RRuntimeVendor,
} from "../assets/scripts/r/vendor-r-runtime.mjs";

const windowsTarget = getRuntimeTarget("win32", "x64");

assert.deepEqual(windowsTarget.toJSON(), {
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
assert.deepEqual(getRendererBuildOrder("linux"), ["fsharp", "r", "python"]);

let rRuntimeProbe;
const rRendererBuilder = new RRendererBuilder({
  target: windowsTarget,
  hasher: { isNonEmptyFile: () => true },
  commandRunner: {
    isAvailable: (command, args) => {
      rRuntimeProbe = { command, args };
      return true;
    },
  },
});
assert.equal(rRendererBuilder.isArtifactReady(), true);
assert.match(rRuntimeProbe.command, /runtime[\\/]r[\\/]windows-x64[\\/]bin[\\/]Rscript\.exe$/);
assert.equal(rRuntimeProbe.args[0], "-e");
for (const packageName of R_RUNTIME_REQUIRED_PACKAGES) {
  assert.match(rRuntimeProbe.args[1], new RegExp(`"${packageName}"`));
}

const pythonRoot = path.join("assets", "scripts", "python");
const pythonBinDirectory = path.join(pythonRoot, "bin");
const transientPythonBuildStatePaths =
  getPythonTransientBuildStatePaths(pythonBinDirectory);

assert.deepEqual(transientPythonBuildStatePaths, [
  path.join(pythonBinDirectory, "commander.build"),
  path.join(pythonBinDirectory, "commander.dist"),
  path.join(pythonBinDirectory, "commander.onefile-build"),
]);
assert.equal(
  transientPythonBuildStatePaths.includes(path.join(pythonRoot, ".nuitka-cache")),
  false,
  "force rebuilds must preserve Nuitka's content-addressed compiler cache"
);

const nuitkaBuildScript = readFileSync(
  path.join(pythonRoot, "build_nuitka.py"),
  "utf8"
);
assert.doesNotMatch(
  nuitkaBuildScript,
  /--disable-ccache/,
  "the renderer build must keep Nuitka's compiler cache enabled"
);

const pythonRuntimeSource = readFileSync(
  path.join("electron", "src", "python", "python-runtime.ts"),
  "utf8"
);
assert.match(
  pythonRuntimeSource,
  /PYTHONUTF8:\s*["']1["']/,
  "Python workers must decode JSON requests as UTF-8 even under an ASCII host locale"
);
assert.match(
  pythonRuntimeSource,
  /PYTHONIOENCODING:\s*["']utf-8["']/,
  "Python worker standard streams must use UTF-8"
);

const rendererEnvironmentAction = readFileSync(
  path.join(
    ".github",
    "actions",
    "setup-renderer-environment",
    "action.yml"
  ),
  "utf8"
);
assert.match(
  rendererEnvironmentAction,
  /dependencies:\s*['"]?"hard"['"]?/,
  "R package setup must exclude optional dependencies that create solver cycles"
);

assert.deepEqual(getRuntimeTarget("darwin", "arm64").toJSON(), {
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
assert.deepEqual(R_RUNTIME_REQUIRED_PACKAGES, [
  "jsonlite",
  "ggplot2",
  "ragg",
  "limma",
  "WGCNA",
]);

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
assert.match(
  transportVendor.rExecutionEnvironment().R_LIBS_USER,
  /\.cache[\\/]r-packages[\\/]/
);

const bootstrapRoot = mkdtempSync(
  path.join(os.tmpdir(), "icarus-r-bootstrap-test-")
);
let bootstrapExpression;
let bootstrapOptions;
try {
  const bootstrapVendor = new RRuntimeVendor({
    rootDir: bootstrapRoot,
    runProcess: (_command, args, options) => {
      bootstrapExpression = readFileSync(args[0], "utf8");
      bootstrapOptions = options;
    },
  });
  bootstrapVendor.installRequiredPackages("Rscript", ["limma", "WGCNA"]);
  assert.match(bootstrapExpression, /install\.packages\(/);
  assert.match(bootstrapExpression, /BiocManager::install\(/);
  assert.match(bootstrapExpression, /"limma","WGCNA"/);
  assert.match(
    bootstrapExpression,
    /dependencies = c\("Depends", "Imports", "LinkingTo"\)/
  );
  assert.equal(bootstrapOptions.stdio, "inherit");
  assert.match(bootstrapOptions.env.R_LIBS_USER, /\.cache[\\/]r-packages[\\/]/);
} finally {
  rmSync(bootstrapRoot, { recursive: true, force: true });
}

const rVendor = new CapturingRRuntimeVendor();
assert.deepEqual(rVendor.requiredPackages, R_RUNTIME_REQUIRED_PACKAGES);
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
