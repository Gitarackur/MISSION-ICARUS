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

const platformNames = {
  darwin: "macos",
  linux: "linux",
  win32: "windows",
};

const runtimePrefixes = {
  darwin: "osx",
  linux: "linux",
  win32: "win",
};

export const getRuntimeTarget = (
  nodePlatform = process.platform,
  nodeArch = process.arch
) => {
  const platform = platformNames[nodePlatform];
  const runtimePrefix = runtimePrefixes[nodePlatform];

  if (!platform || !runtimePrefix) {
    throw new Error(`Unsupported renderer runtime platform: ${nodePlatform}`);
  }

  return {
    nodePlatform,
    arch: nodeArch,
    platform,
    runtimeKey: `${platform}-${nodeArch}`,
    runtimeIdentifier: `${runtimePrefix}-${nodeArch}`,
    nativeExecutableSuffix: nodePlatform === "win32" ? ".exe" : "",
    pythonExecutableName:
      nodePlatform === "win32"
        ? "commander.exe"
        : nodePlatform === "darwin"
          ? "commander.bin"
          : "commander",
  };
};

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

const walkFiles = (
  directory,
  predicate = () => true,
  excludedDirectoryNames = new Set()
) => {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory() && !excludedDirectoryNames.has(entry.name)) {
      files.push(
        ...walkFiles(entryPath, predicate, excludedDirectoryNames)
      );
    } else if (entry.isFile() && predicate(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
};

const hashFiles = (files) => {
  const digest = createHash("sha256");

  for (const filePath of [...new Set(files)].sort()) {
    digest.update(path.relative(repositoryRoot, filePath).split(path.sep).join("/"));
    digest.update("\0");
    digest.update(readFileSync(filePath));
    digest.update("\0");
  }

  return digest.digest("hex");
};

const isNonEmptyFile = (filePath) => {
  try {
    const stats = statSync(filePath);
    return stats.isFile() && stats.size > 0;
  } catch {
    return false;
  }
};

const hashArtifact = (filePath) =>
  isNonEmptyFile(filePath) ? hashFiles([filePath]) : null;

const quoteArgument = (argument) =>
  /\s/.test(argument) ? JSON.stringify(argument) : argument;

const runCommand = (command, args, { cwd = repositoryRoot, env, label }) => {
  console.log(`\n> ${[command, ...args].map(quoteArgument).join(" ")}`);

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
};

const commandIsAvailable = (command, args = ["--version"]) => {
  const result = spawnSync(command, args, { stdio: "ignore" });
  return !result.error && result.status === 0;
};

const resolvePython = () => {
  const candidates = [
    process.env.PYTHON,
    process.platform === "win32" ? "python" : "python3",
    "python",
  ].filter(Boolean);

  for (const candidate of [...new Set(candidates)]) {
    if (commandIsAvailable(candidate)) return candidate;
  }

  throw new Error(
    "Python was not found. Install Python 3.13 or set PYTHON to its executable path."
  );
};

const resolvePipenv = (python) => {
  if (commandIsAvailable(python, ["-m", "pipenv", "--version"])) {
    return { command: python, argumentPrefix: ["-m", "pipenv"] };
  }

  if (commandIsAvailable("pipenv")) {
    return { command: "pipenv", argumentPrefix: [] };
  }

  throw new Error(
    `Pipenv is required to rebuild the Python renderer. Run ${python} -m pip install pipenv==2025.0.4.`
  );
};

const removePath = (targetPath) => {
  rmSync(targetPath, { recursive: true, force: true });
};

const createDefinitions = (target, force) => {
  const pythonRoot = path.join(repositoryRoot, "assets", "scripts", "python");
  const pythonBinDirectory = path.join(pythonRoot, "bin");
  const fsharpProjectDirectory = path.join(
    repositoryRoot,
    "assets",
    "scripts",
    "fsharp",
    "IcarusPlotRenderer"
  );
  const fsharpProjectPath = path.join(
    fsharpProjectDirectory,
    "IcarusPlotRenderer.fsproj"
  );
  const fsharpOutputDirectory = path.join(
    repositoryRoot,
    "assets",
    "runtime",
    "fsharp",
    target.runtimeKey
  );
  const rOutputDirectory = path.join(
    repositoryRoot,
    "assets",
    "runtime",
    "r",
    target.runtimeKey
  );

  const pythonSources = [
    path.join(pythonRoot, "Pipfile"),
    path.join(pythonRoot, "Pipfile.lock"),
    path.join(pythonRoot, "build_nuitka.py"),
    path.join(pythonRoot, "commander.py"),
    ...walkFiles(path.join(pythonRoot, "commands"), (filePath) =>
      filePath.endsWith(".py")
    ),
    ...walkFiles(path.join(pythonRoot, "core"), (filePath) =>
      filePath.endsWith(".py")
    ),
    scriptPath,
  ];

  const fsharpSources = [
    ...walkFiles(
      fsharpProjectDirectory,
      (filePath) => [".fs", ".fsproj"].includes(path.extname(filePath)),
      new Set(["bin", "obj"])
    ),
    scriptPath,
  ];

  const rSources = [
    path.join(repositoryRoot, "assets", "scripts", "r", "vendor-r-runtime.mjs"),
    scriptPath,
  ];

  return [
    {
      key: "fsharp",
      label: "F# renderer",
      sourceFiles: fsharpSources,
      artifactPath: path.join(
        fsharpOutputDirectory,
        `fsharp-plot${target.nativeExecutableSuffix}`
      ),
      build: () => {
        if (!commandIsAvailable("dotnet")) {
          throw new Error(".NET SDK 10 is required to rebuild the F# renderer.");
        }

        removePath(fsharpOutputDirectory);
        mkdirSync(fsharpOutputDirectory, { recursive: true });
        runCommand(
          "dotnet",
          createFsharpPublishArgs({
            projectPath: fsharpProjectPath,
            outputDirectory: fsharpOutputDirectory,
            runtimeIdentifier: target.runtimeIdentifier,
          }),
          { label: "F# renderer build" }
        );
      },
    },
    {
      key: "python",
      label: "Python renderer",
      sourceFiles: pythonSources,
      artifactPath: path.join(pythonBinDirectory, target.pythonExecutableName),
      build: () => {
        const python = resolvePython();
        const pipenv = resolvePipenv(python);

        const executableCandidates = force
          ? ["commander", "commander.bin", "commander.exe"]
          : [target.pythonExecutableName];
        const buildStatePaths = [
          path.join(pythonRoot, ".nuitka-cache"),
          path.join(pythonBinDirectory, "commander.build"),
          path.join(pythonBinDirectory, "commander.dist"),
          path.join(pythonBinDirectory, "commander.onefile-build"),
        ];

        for (const executableName of executableCandidates) {
          removePath(path.join(pythonBinDirectory, executableName));
        }
        for (const buildStatePath of buildStatePaths) removePath(buildStatePath);

        const pythonEnvironment = {
          ...process.env,
          PIP_DISABLE_PIP_VERSION_CHECK: "1",
          PIPENV_VENV_IN_PROJECT: "1",
        };

        try {
          runCommand(pipenv.command, [...pipenv.argumentPrefix, "sync", "--dev"], {
            cwd: pythonRoot,
            env: pythonEnvironment,
            label: "Python renderer dependency sync",
          });
          runCommand(
            pipenv.command,
            [...pipenv.argumentPrefix, "run", "prepare"],
            {
              cwd: pythonRoot,
              env: pythonEnvironment,
              label: "Python renderer build",
            }
          );
        } finally {
          removePath(path.join(pythonRoot, ".venv"));
          for (const buildStatePath of buildStatePaths) removePath(buildStatePath);
        }
      },
    },
    {
      key: "r",
      label: "R renderer runtime",
      sourceFiles: rSources,
      artifactPath: path.join(
        rOutputDirectory,
        "bin",
        `Rscript${target.nativeExecutableSuffix}`
      ),
      build: () => {
        runCommand(
          process.execPath,
          [
            path.join(
              repositoryRoot,
              "assets",
              "scripts",
              "r",
              "vendor-r-runtime.mjs"
            ),
            "--clean",
          ],
          { label: "R renderer runtime build" }
        );
      },
    },
  ];
};

const readManifest = (manifestPath) => {
  try {
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
};

const writeManifest = (manifestPath, manifest) => {
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  const temporaryPath = `${manifestPath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`);
  renameSync(temporaryPath, manifestPath);
};

const prepareRendererRuntimes = ({ force = false } = {}) => {
  const target = getRuntimeTarget();
  const manifestPath = path.join(
    repositoryRoot,
    ".cache",
    "renderer-runtimes",
    `${target.runtimeKey}.json`
  );
  const previousManifest = readManifest(manifestPath);
  const definitions = createDefinitions(target, force);
  const initialHashes = Object.fromEntries(
    definitions.map((definition) => [
      definition.key,
      hashFiles(definition.sourceFiles),
    ])
  );

  const buildStates = definitions.map((definition) => {
    const rendererManifest = previousManifest?.renderers?.[definition.key];
    const artifactHash = hashArtifact(definition.artifactPath);
    const current =
      !force &&
      previousManifest?.version === manifestVersion &&
      previousManifest?.runtimeKey === target.runtimeKey &&
      rendererManifest?.sourceHash === initialHashes[definition.key] &&
      rendererManifest?.artifactHash === artifactHash;

    return { definition, current };
  });

  console.log(`Preparing renderer runtimes for ${target.runtimeKey}:`);
  for (const { definition, current } of buildStates) {
    console.log(`- ${definition.label}: ${current ? "current" : "rebuild required"}`);
  }

  if (buildStates.every(({ current }) => current)) {
    console.log("All bundled renderer runtimes are current.");
    return;
  }

  removePath(manifestPath);

  for (const { definition, current } of buildStates) {
    if (current) continue;

    console.log(`\nRebuilding ${definition.label}...`);
    definition.build();

    if (!isNonEmptyFile(definition.artifactPath)) {
      throw new Error(
        `${definition.label} did not produce the expected artifact: ${definition.artifactPath}`
      );
    }
  }

  const finalHashes = Object.fromEntries(
    definitions.map((definition) => [
      definition.key,
      hashFiles(definition.sourceFiles),
    ])
  );

  for (const definition of definitions) {
    if (initialHashes[definition.key] !== finalHashes[definition.key]) {
      throw new Error(
        `${definition.label} sources changed during the build; run the preparation again.`
      );
    }
  }

  try {
    runCommand(
      process.execPath,
      [path.join(repositoryRoot, "scripts", "test-bundled-renderer-runtimes.mjs")],
      { label: "Bundled renderer runtime smoke tests" }
    );
  } catch (error) {
    removePath(manifestPath);
    throw error;
  }

  writeManifest(manifestPath, {
    version: manifestVersion,
    runtimeKey: target.runtimeKey,
    renderers: Object.fromEntries(
      definitions.map((definition) => [
        definition.key,
        {
          sourceHash: finalHashes[definition.key],
          artifactHash: hashArtifact(definition.artifactPath),
          artifact: path
            .relative(repositoryRoot, definition.artifactPath)
            .split(path.sep)
            .join("/"),
        },
      ])
    ),
  });

  console.log(`Renderer runtime manifest updated: ${manifestPath}`);
};

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
