import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const scriptPath = fileURLToPath(import.meta.url);
const manifestVersion = 2;

const PLATFORM_NAMES = Object.freeze({
  darwin: "macos",
  linux: "linux",
  win32: "windows",
});

const RUNTIME_PREFIXES = Object.freeze({
  darwin: "osx",
  linux: "linux",
  win32: "win",
});

const RENDERER_BUILD_ORDER = Object.freeze({
  win32: ["fsharp", "r", "python"],
  default: ["fsharp", "python", "r"],
});

const PYTHON_ROOT = path.join(repositoryRoot, "assets", "scripts", "python");
const PYTHON_BIN_DIRECTORY = path.join(PYTHON_ROOT, "bin");
const FSHARP_PROJECT_DIRECTORY = path.join(
  repositoryRoot,
  "assets",
  "scripts",
  "fsharp",
  "IcarusPlotRenderer"
);
const FSHARP_PROJECT_PATH = path.join(
  FSHARP_PROJECT_DIRECTORY,
  "IcarusPlotRenderer.fsproj"
);
const R_VENDOR_SCRIPT = path.join(
  repositoryRoot,
  "assets",
  "scripts",
  "r",
  "vendor-r-runtime.mjs"
);
const SMOKE_TEST_SCRIPT = path.join(
  repositoryRoot,
  "scripts",
  "test-bundled-renderer-runtimes.mjs"
);

export const getRendererBuildOrder = (nodePlatform = process.platform) =>
  RENDERER_BUILD_ORDER[nodePlatform] ?? RENDERER_BUILD_ORDER.default;

export const createFsharpPublishArgs = ({
  projectPath,
  outputDirectory,
  runtimeIdentifier,
}) => [
  "publish",
  projectPath,
  "--configuration",
  "Release",
  "--runtime",
  runtimeIdentifier,
  "--self-contained",
  "true",
  "--property",
  "PublishSingleFile=true",
  "--output",
  outputDirectory,
];

export const getPythonTransientBuildStatePaths = (pythonBinDirectory) => [
  path.join(pythonBinDirectory, "commander.build"),
  path.join(pythonBinDirectory, "commander.dist"),
  path.join(pythonBinDirectory, "commander.onefile-build"),
];

const removePath = (targetPath) => {
  rmSync(targetPath, { recursive: true, force: true });
};

const walkFiles = (
  directory,
  predicate = () => true,
  excludedDirectoryNames = new Set()
) => {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory() && !excludedDirectoryNames.has(entry.name)) {
      files.push(...walkFiles(entryPath, predicate, excludedDirectoryNames));
    } else if (entry.isFile() && predicate(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
};

export class RuntimeTarget {
  constructor(nodePlatform = process.platform, nodeArch = process.arch) {
    const platform = PLATFORM_NAMES[nodePlatform];
    const runtimePrefix = RUNTIME_PREFIXES[nodePlatform];

    if (!platform || !runtimePrefix) {
      throw new Error(`Unsupported renderer runtime platform: ${nodePlatform}`);
    }

    this.nodePlatform = nodePlatform;
    this.arch = nodeArch;
    this.platform = platform;
    this.runtimeKey = `${platform}-${nodeArch}`;
    this.runtimeIdentifier = `${runtimePrefix}-${nodeArch}`;
    this.nativeExecutableSuffix = nodePlatform === "win32" ? ".exe" : "";
    this.pythonExecutableName =
      nodePlatform === "win32"
        ? "commander.exe"
        : nodePlatform === "darwin"
          ? "commander.bin"
          : "commander";
  }

  isWindows() {
    return this.nodePlatform === "win32";
  }

  toJSON() {
    return { ...this };
  }
}

export const getRuntimeTarget = (nodePlatform, nodeArch) =>
  new RuntimeTarget(nodePlatform, nodeArch);

class CommandRunner {
  static quoteArgument(argument) {
    return /\s/.test(argument) ? JSON.stringify(argument) : argument;
  }

  run(command, args, { cwd = repositoryRoot, env, label } = {}) {
    console.log(`\n> ${[command, ...args].map(CommandRunner.quoteArgument).join(" ")}`);

    const result = spawnSync(command, args, {
      cwd,
      env,
      stdio: "inherit",
    });

    if (result.error) {
      throw new Error(`${label} could not start: ${result.error.message}`, {
        cause: result.error,
      });
    }

    if (result.status !== 0) {
      throw new Error(`${label} exited with status ${result.status ?? "unknown"}`);
    }
  }

  isAvailable(command, args = ["--version"]) {
    const result = spawnSync(command, args, { stdio: "ignore" });
    return !result.error && result.status === 0;
  }
}

class Hasher {
  constructor(root = repositoryRoot) {
    this.root = root;
  }

  files(filePaths) {
    const digest = createHash("sha256");

    for (const filePath of [...new Set(filePaths)].sort()) {
      digest.update(
        path.relative(this.root, filePath).split(path.sep).join("/")
      );
      digest.update("\0");
      digest.update(readFileSync(filePath));
      digest.update("\0");
    }

    return digest.digest("hex");
  }

  artifact(filePath) {
    return this.isNonEmptyFile(filePath) ? this.files([filePath]) : null;
  }

  isNonEmptyFile(filePath) {
    try {
      const stats = statSync(filePath);
      return stats.isFile() && stats.size > 0;
    } catch {
      return false;
    }
  }
}

class ManifestStore {
  constructor(target) {
    this.manifestPath = path.join(
      repositoryRoot,
      ".cache",
      "renderer-runtimes",
      `${target.runtimeKey}.json`
    );
  }

  read() {
    try {
      return JSON.parse(readFileSync(this.manifestPath, "utf8"));
    } catch {
      return null;
    }
  }

  write(target, rendererStates) {
    mkdirSync(path.dirname(this.manifestPath), { recursive: true });

    const manifest = {
      version: manifestVersion,
      runtimeKey: target.runtimeKey,
      renderers: Object.fromEntries(
        rendererStates.map(({ key, sourceHash, artifactHash, artifactPath }) => [
          key,
          {
            sourceHash,
            artifactHash,
            artifact: path
              .relative(repositoryRoot, artifactPath)
              .split(path.sep)
              .join("/"),
          },
        ])
      ),
    };

    const temporaryPath = `${this.manifestPath}.${process.pid}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`);
    renameSync(temporaryPath, this.manifestPath);
  }

  remove() {
    removePath(this.manifestPath);
  }
}

class RendererBuilder {
  constructor({ target, commandRunner, hasher }) {
    this.target = target;
    this.commandRunner = commandRunner;
    this.hasher = hasher;
  }

  get key() {
    throw new Error("RendererBuilder subclasses must define a key");
  }

  get label() {
    return this.key;
  }

  get sourceFiles() {
    throw new Error("RendererBuilder subclasses must define sourceFiles");
  }

  get artifactPath() {
    throw new Error("RendererBuilder subclasses must define artifactPath");
  }

  build() {
    throw new Error("RendererBuilder subclasses must define build");
  }
}

class FSharpRendererBuilder extends RendererBuilder {
  get key() {
    return "fsharp";
  }

  get label() {
    return "F# renderer";
  }

  get outputDirectory() {
    return path.join(
      repositoryRoot,
      "assets",
      "runtime",
      "fsharp",
      this.target.runtimeKey
    );
  }

  get sourceFiles() {
    return [
      ...walkFiles(
        FSHARP_PROJECT_DIRECTORY,
        (filePath) => [".fs", ".fsproj"].includes(path.extname(filePath)),
        new Set(["bin", "obj"])
      ),
      scriptPath,
    ];
  }

  get artifactPath() {
    return path.join(
      this.outputDirectory,
      `fsharp-plot${this.target.nativeExecutableSuffix}`
    );
  }

  build() {
    if (!this.commandRunner.isAvailable("dotnet")) {
      throw new Error(".NET SDK 10 is required to rebuild the F# renderer.");
    }

    removePath(this.outputDirectory);
    mkdirSync(this.outputDirectory, { recursive: true });
    this.commandRunner.run(
      "dotnet",
      createFsharpPublishArgs({
        projectPath: FSHARP_PROJECT_PATH,
        outputDirectory: this.outputDirectory,
        runtimeIdentifier: this.target.runtimeIdentifier,
      }),
      { label: "F# renderer build" }
    );
  }
}

class PythonRendererBuilder extends RendererBuilder {
  constructor(options) {
    super(options);
    this.force = options.force;
  }

  get key() {
    return "python";
  }

  get label() {
    return "Python renderer";
  }

  get sourceFiles() {
    return [
      path.join(PYTHON_ROOT, "Pipfile"),
      path.join(PYTHON_ROOT, "Pipfile.lock"),
      path.join(PYTHON_ROOT, "build_nuitka.py"),
      path.join(PYTHON_ROOT, "commander.py"),
      ...walkFiles(path.join(PYTHON_ROOT, "commands"), (filePath) =>
        filePath.endsWith(".py")
      ),
      ...walkFiles(path.join(PYTHON_ROOT, "core"), (filePath) =>
        filePath.endsWith(".py")
      ),
      scriptPath,
    ];
  }

  get artifactPath() {
    return path.join(PYTHON_BIN_DIRECTORY, this.target.pythonExecutableName);
  }

  resolvePython() {
    const candidates = [
      process.env.PYTHON,
      this.target.isWindows() ? "python" : "python3",
      "python",
    ].filter(Boolean);

    for (const candidate of [...new Set(candidates)]) {
      if (this.commandRunner.isAvailable(candidate)) return candidate;
    }

    throw new Error(
      "Python was not found. Install Python 3.13 or set PYTHON to its executable path."
    );
  }

  resolvePipenv(python) {
    if (this.commandRunner.isAvailable(python, ["-m", "pipenv", "--version"])) {
      return { command: python, argumentPrefix: ["-m", "pipenv"] };
    }

    if (this.commandRunner.isAvailable("pipenv")) {
      return { command: "pipenv", argumentPrefix: [] };
    }

    throw new Error(
      `Pipenv is required to rebuild the Python renderer. Run ${python} -m pip install pipenv==2025.0.4.`
    );
  }

  build() {
    const python = this.resolvePython();
    const pipenv = this.resolvePipenv(python);

    const executableCandidates = this.force
      ? ["commander", "commander.bin", "commander.exe"]
      : [this.target.pythonExecutableName];
    const nuitkaCachePath = path.join(PYTHON_ROOT, ".nuitka-cache");
    const transientBuildStatePaths =
      getPythonTransientBuildStatePaths(PYTHON_BIN_DIRECTORY);

    for (const executableName of executableCandidates) {
      removePath(path.join(PYTHON_BIN_DIRECTORY, executableName));
    }
    for (const buildStatePath of transientBuildStatePaths) {
      removePath(buildStatePath);
    }
    if (process.env.ICARUS_CLEAN_NUITKA_CACHE === "1") {
      removePath(nuitkaCachePath);
    }

    const pythonEnvironment = {
      ...process.env,
      PIP_DISABLE_PIP_VERSION_CHECK: "1",
      PIPENV_VENV_IN_PROJECT: "1",
    };

    try {
      this.commandRunner.run(
        pipenv.command,
        [...pipenv.argumentPrefix, "sync", "--dev"],
        {
          cwd: PYTHON_ROOT,
          env: pythonEnvironment,
          label: "Python renderer dependency sync",
        }
      );
      this.commandRunner.run(
        pipenv.command,
        [...pipenv.argumentPrefix, "run", "prepare"],
        {
          cwd: PYTHON_ROOT,
          env: pythonEnvironment,
          label: "Python renderer build",
        }
      );
    } finally {
      removePath(path.join(PYTHON_ROOT, ".venv"));
      for (const buildStatePath of transientBuildStatePaths) {
        removePath(buildStatePath);
      }
    }
  }
}

class RRendererBuilder extends RendererBuilder {
  get key() {
    return "r";
  }

  get label() {
    return "R renderer runtime";
  }

  get outputDirectory() {
    return path.join(
      repositoryRoot,
      "assets",
      "runtime",
      "r",
      this.target.runtimeKey
    );
  }

  get sourceFiles() {
    return [R_VENDOR_SCRIPT, scriptPath];
  }

  get artifactPath() {
    return path.join(
      this.outputDirectory,
      "bin",
      `Rscript${this.target.nativeExecutableSuffix}`
    );
  }

  build() {
    this.commandRunner.run(
      process.execPath,
      [R_VENDOR_SCRIPT, "--clean"],
      { label: "R renderer runtime build" }
    );
  }
}

class RendererBuilderFactory {
  static create(target, { force = false } = {}) {
    const commandRunner = new CommandRunner();
    const hasher = new Hasher();
    const builders = {
      fsharp: new FSharpRendererBuilder({ target, commandRunner, hasher }),
      python: new PythonRendererBuilder({
        target,
        commandRunner,
        hasher,
        force,
      }),
      r: new RRendererBuilder({ target, commandRunner, hasher }),
    };

    return getRendererBuildOrder(target.nodePlatform).map(
      (rendererKey) => builders[rendererKey]
    );
  }
}

export class RendererRuntimePreparer {
  constructor({ force = false, target = new RuntimeTarget() } = {}) {
    this.target = target;
    this.force = force;
    this.commandRunner = new CommandRunner();
    this.hasher = new Hasher();
    this.manifestStore = new ManifestStore(target);
  }

  smokeTest(rendererKeys = []) {
    const rendererArguments = rendererKeys.flatMap((rendererKey) => [
      "--renderer",
      rendererKey,
    ]);

    this.commandRunner.run(
      process.execPath,
      [SMOKE_TEST_SCRIPT, ...rendererArguments],
      { label: "Bundled renderer runtime smoke tests" }
    );
  }

  prepare() {
    const previousManifest = this.manifestStore.read();
    const builders = RendererBuilderFactory.create(this.target, {
      force: this.force,
    });
    const initialHashes = Object.fromEntries(
      builders.map((builder) => [
        builder.key,
        this.hasher.files(builder.sourceFiles),
      ])
    );

    const buildStates = builders.map((builder) => {
      const rendererManifest = previousManifest?.renderers?.[builder.key];
      const artifactHash = this.hasher.artifact(builder.artifactPath);
      const current =
        !this.force &&
        previousManifest?.version === manifestVersion &&
        previousManifest?.runtimeKey === this.target.runtimeKey &&
        rendererManifest?.sourceHash === initialHashes[builder.key] &&
        rendererManifest?.artifactHash === artifactHash;

      return { builder, current };
    });

    console.log(`Preparing renderer runtimes for ${this.target.runtimeKey}:`);
    for (const { builder, current } of buildStates) {
      console.log(
        `- ${builder.label}: ${current ? "current" : "rebuild required"}`
      );
    }

    if (buildStates.every(({ current }) => current)) {
      console.log("All bundled renderer runtimes are current.");
      return;
    }

    this.manifestStore.remove();

    const smokeTestedRenderers = new Set();

    for (const { builder, current } of buildStates) {
      if (current) continue;

      // On Windows, the memory-heavy Nuitka compile leaves host R unstable on
      // GitHub runners. Vendor and exercise R before starting that compile.
      if (this.target.isWindows() && builder.key === "python") {
        this.smokeTest(["r"]);
        smokeTestedRenderers.add("r");
      }

      console.log(`\nRebuilding ${builder.label}...`);
      builder.build();

      if (!this.hasher.isNonEmptyFile(builder.artifactPath)) {
        throw new Error(
          `${builder.label} did not produce the expected artifact: ${builder.artifactPath}`
        );
      }
    }

    const finalHashes = Object.fromEntries(
      builders.map((builder) => [
        builder.key,
        this.hasher.files(builder.sourceFiles),
      ])
    );

    for (const builder of builders) {
      if (initialHashes[builder.key] !== finalHashes[builder.key]) {
        throw new Error(
          `${builder.label} sources changed during the build; run the preparation again.`
        );
      }
    }

    try {
      this.smokeTest(
        builders
          .map((builder) => builder.key)
          .filter((rendererKey) => !smokeTestedRenderers.has(rendererKey))
      );
    } catch (error) {
      this.manifestStore.remove();
      throw error;
    }

    this.manifestStore.write(
      this.target,
      builders.map((builder) => ({
        key: builder.key,
        sourceHash: finalHashes[builder.key],
        artifactHash: this.hasher.artifact(builder.artifactPath),
        artifactPath: builder.artifactPath,
      }))
    );

    console.log(`Renderer runtime manifest updated: ${this.manifestStore.manifestPath}`);
  }
}

export const prepareRendererRuntimes = (options = {}) =>
  new RendererRuntimePreparer(options).prepare();

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath);

if (isMainModule) {
  try {
    prepareRendererRuntimes({ force: process.argv.includes("--force") });
  } catch (error) {
    console.error(`\nRenderer runtime preparation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
