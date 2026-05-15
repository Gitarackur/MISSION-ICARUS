import { execFileSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const REQUIRED_PACKAGES = ["jsonlite", "ggplot2"];

const platformName = () => {
  const platform = os.platform();
  if (platform === "darwin") return "macos";
  if (platform === "win32") return "windows";
  return "linux";
};

const archName = () => {
  const arch = os.arch();
  if (arch === "x64") return "x64";
  if (arch === "arm64") return "arm64";
  return arch;
};

const candidateRscripts = () => {
  if (process.env.RSCRIPT_PATH) return [process.env.RSCRIPT_PATH];

  return (
    os.platform() === "win32"
      ? ["Rscript.exe"]
      : [
          "/usr/local/bin/Rscript",
          "/opt/homebrew/bin/Rscript",
          "/usr/bin/Rscript",
          "/Library/Frameworks/R.framework/Resources/bin/Rscript",
          "Rscript",
        ]
  );
};

const hasRequiredPackages = (rscript) => {
  try {
    assertPackages(rscript);
    return true;
  } catch {
    return false;
  }
};

const resolveRscript = () => {
  const existingCandidates = [];

  for (const candidate of candidateRscripts()) {
    try {
      execFileSync(candidate, ["--version"], { stdio: "ignore" });
      existingCandidates.push(candidate);
    } catch {
      // Try the next candidate.
    }
  }

  for (const candidate of existingCandidates) {
    if (hasRequiredPackages(candidate)) {
      return candidate;
    }
  }

  if (existingCandidates.length > 0) {
    return existingCandidates[0];
  }

  throw new Error(
    "Rscript was not found. Install R or set RSCRIPT_PATH before running this script."
  );
};

const runR = (rscript, expression) =>
  execFileSync(rscript, ["-e", expression], {
    encoding: "utf8",
    env: process.env,
  }).trim();

const assertPackages = (rscript) => {
  const expression = `
    pkgs <- c(${REQUIRED_PACKAGES.map((pkg) => `"${pkg}"`).join(",")});
    missing <- pkgs[!vapply(pkgs, requireNamespace, logical(1), quietly = TRUE)];
    if (length(missing) > 0) {
      stop(sprintf("Missing required R packages: %s", paste(missing, collapse = ", ")), call. = FALSE);
    }
  `;

  runR(rscript, expression);
};

const targetRuntimeDir = path.join(
  rootDir,
  "assets",
  "runtime",
  "r",
  `${platformName()}-${archName()}`
);

const pathToPosix = (value) => value.split(path.sep).join("/");

const walkFiles = (dir) => {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (stat.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
};

const isMachO = (filePath) => {
  try {
    const output = execFileSync("file", [filePath], { encoding: "utf8" });
    return output.includes("Mach-O");
  } catch {
    return false;
  }
};

const runTool = (command, args) => {
  execFileSync(command, args, { stdio: "ignore" });
};

const patchMachOFile = ({ filePath, runtimeRoot, sourceLibPrefix }) => {
  const libDir = path.join(runtimeRoot, "lib");
  const relativeLibDir = pathToPosix(path.relative(path.dirname(filePath), libDir)) || ".";
  const loaderRpath = `@loader_path/${relativeLibDir}`;

  try {
    runTool("install_name_tool", ["-add_rpath", loaderRpath, filePath]);
  } catch {
    // The rpath may already exist, which is fine for repeated vendor runs.
  }

  const dependencies = execFileSync("otool", ["-L", filePath], {
    encoding: "utf8",
  })
    .split("\n")
    .map((line) => line.trim().split(" ")[0])
    .filter(Boolean);

  for (const dependency of dependencies) {
    if (!dependency.startsWith(sourceLibPrefix)) continue;
    const replacement = `@rpath/${path.basename(dependency)}`;

    try {
      runTool("install_name_tool", ["-change", dependency, replacement, filePath]);
    } catch {
      // Some Mach-O files may not actually load the listed item; skip those.
    }
  }

  if (filePath.endsWith(".dylib")) {
    const installName = dependencies[0];
    if (installName?.startsWith(sourceLibPrefix)) {
      try {
        runTool("install_name_tool", [
          "-id",
          `@rpath/${path.basename(filePath)}`,
          filePath,
        ]);
      } catch {
        // Not every dylib allows changing its id after copy; skip if needed.
      }
    }
  }
};

const patchShellWrappers = (runtimeRoot) => {
  for (const relativePath of ["bin/R"]) {
    const filePath = path.join(runtimeRoot, relativePath);
    if (!existsSync(filePath)) continue;

    const contents = readFileSync(filePath, "utf8");
    const patched = contents.replaceAll(
      /\/Library\/Frameworks\/R\.framework\/Resources/g,
      '"$(cd "$(dirname "$0")/.." && pwd)"'
    );
    writeFileSync(filePath, patched);
    chmodSync(filePath, 0o755);
  }
};

const writeRscriptWrapper = (runtimeRoot) => {
  const wrapperPath = path.join(runtimeRoot, "bin", "Rscript");
  const contents = `#!/bin/sh
R_HOME_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export R_HOME="$R_HOME_DIR"
export R_SHARE_DIR="$R_HOME_DIR/share"
export R_INCLUDE_DIR="$R_HOME_DIR/include"
export R_DOC_DIR="$R_HOME_DIR/doc"
export DYLD_LIBRARY_PATH="$R_HOME_DIR/lib:$DYLD_LIBRARY_PATH"
export R_LIBS="$R_HOME_DIR/library:$R_LIBS"
export R_LIBS_USER="$R_HOME_DIR/library:$R_LIBS_USER"

if [ "$1" = "--version" ]; then
  exec "$R_HOME_DIR/bin/exec/R" --version
fi

if [ "$1" = "-e" ]; then
  expr="$2"
  shift 2
  exec "$R_HOME_DIR/bin/exec/R" --slave --no-restore -e "$expr" --args "$@"
fi

script="$1"
shift
exec "$R_HOME_DIR/bin/exec/R" --slave --no-restore --file="$script" --args "$@"
`;

  writeFileSync(wrapperPath, contents);
  chmodSync(wrapperPath, 0o755);
};

const patchMacRuntime = (runtimeRoot, sourceRHome) => {
  if (os.platform() !== "darwin") return;

  const sourceLibPrefix = path.join(sourceRHome, "lib");
  const machOFiles = walkFiles(runtimeRoot).filter(isMachO);

  for (const filePath of machOFiles) {
    patchMachOFile({
      filePath,
      runtimeRoot,
      sourceLibPrefix,
    });
  }

  patchShellWrappers(runtimeRoot);
  writeRscriptWrapper(runtimeRoot);

  for (const filePath of machOFiles) {
    try {
      runTool("codesign", ["--force", "--sign", "-", filePath]);
    } catch {
      // Some copied artifacts are not signable Mach-O executables. Skip them.
    }
  }
};

const main = () => {
  const shouldClean = process.argv.includes("--clean");
  const rscript = resolveRscript();
  const rHome = runR(rscript, "cat(normalizePath(R.home(), mustWork = TRUE))");

  assertPackages(rscript);

  if (!existsSync(rHome)) {
    throw new Error(`R_HOME does not exist: ${rHome}`);
  }

  if (shouldClean && existsSync(targetRuntimeDir)) {
    rmSync(targetRuntimeDir, { recursive: true, force: true });
  }

  mkdirSync(path.dirname(targetRuntimeDir), { recursive: true });
  cpSync(rHome, targetRuntimeDir, {
    recursive: true,
    dereference: true,
    force: true,
  });

  patchMacRuntime(targetRuntimeDir, rHome);

  console.log(`Vendored R runtime from: ${rHome}`);
  console.log(`Vendored R runtime to:   ${targetRuntimeDir}`);
  console.log(`Required packages found: ${REQUIRED_PACKAGES.join(", ")}`);
};

main();
