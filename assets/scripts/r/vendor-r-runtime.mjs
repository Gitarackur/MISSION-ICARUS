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

class RRuntimeVendor {
  constructor(options = {}) {
    this.__dirname = path.dirname(fileURLToPath(import.meta.url));

    /**
     * This script lives at:
     * assets/scripts/r/vendor-r-runtime.mjs
     *
     * So ../../.. resolves to the project root.
     */
    this.rootDir = options.rootDir ?? path.resolve(this.__dirname, "../../..");

    this.requiredPackages = options.requiredPackages ?? ["jsonlite", "ggplot2", "ragg"];

    this.shouldClean =
      options.shouldClean ?? process.argv.includes("--clean");

    this.targetRuntimeDir =
      options.targetRuntimeDir ??
      path.join(
        this.rootDir,
        "assets",
        "runtime",
        "r",
        `${this.platformName()}-${this.archName()}`
      );
  }

  platformName() {
    const platform = os.platform();

    if (platform === "darwin") return "macos";
    if (platform === "win32") return "windows";

    return "linux";
  }

  archName() {
    const arch = os.arch();

    if (arch === "x64") return "x64";
    if (arch === "arm64") return "arm64";

    return arch;
  }

  candidateRscripts() {
    if (process.env.RSCRIPT_PATH) {
      return [process.env.RSCRIPT_PATH];
    }

    if (os.platform() === "win32") {
      return ["Rscript.exe"];
    }

    return [
      "/usr/local/bin/Rscript",
      "/opt/homebrew/bin/Rscript",
      "/usr/bin/Rscript",
      "/Library/Frameworks/R.framework/Resources/bin/Rscript",
      "Rscript",
    ];
  }

  runR(rscript, expression) {
    return execFileSync(rscript, ["-e", expression], {
      encoding: "utf8",
      env: process.env,
    }).trim();
  }

  assertPackages(rscript) {
    const expression = `
      pkgs <- c(${this.requiredPackages.map((pkg) => `"${pkg}"`).join(",")});
      missing <- pkgs[!vapply(pkgs, requireNamespace, logical(1), quietly = TRUE)];

      if (length(missing) > 0) {
        stop(
          sprintf("Missing required R packages: %s", paste(missing, collapse = ", ")),
          call. = FALSE
        );
      }
    `;

    this.runR(rscript, expression);
  }

  hasRequiredPackages(rscript) {
    try {
      this.assertPackages(rscript);
      return true;
    } catch {
      return false;
    }
  }

  resolveRscript() {
    const existingCandidates = [];

    for (const candidate of this.candidateRscripts()) {
      try {
        execFileSync(candidate, ["--version"], { stdio: "ignore" });
        existingCandidates.push(candidate);
      } catch {
        // Try the next candidate.
      }
    }

    for (const candidate of existingCandidates) {
      if (this.hasRequiredPackages(candidate)) {
        return candidate;
      }
    }

    if (existingCandidates.length > 0) {
      return existingCandidates[0];
    }

    throw new Error(
      "Rscript was not found. Install R or set RSCRIPT_PATH before running this script."
    );
  }

  pathToPosix(value) {
    return value.split(path.sep).join("/");
  }

  walkFiles(dir) {
    const entries = readdirSync(dir);
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...this.walkFiles(fullPath));
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }

  isMachO(filePath) {
    try {
      const output = execFileSync("file", [filePath], { encoding: "utf8" });
      return output.includes("Mach-O");
    } catch {
      return false;
    }
  }

  runTool(command, args) {
    execFileSync(command, args, { stdio: "ignore" });
  }

  patchMachOFile({ filePath, runtimeRoot, sourceLibPrefix }) {
    const libDir = path.join(runtimeRoot, "lib");
    const relativeLibDir =
      this.pathToPosix(path.relative(path.dirname(filePath), libDir)) || ".";

    const loaderRpath = `@loader_path/${relativeLibDir}`;

    try {
      this.runTool("install_name_tool", ["-add_rpath", loaderRpath, filePath]);
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
        this.runTool("install_name_tool", [
          "-change",
          dependency,
          replacement,
          filePath,
        ]);
      } catch {
        // Some Mach-O files may not actually load the listed item; skip those.
      }
    }

    if (filePath.endsWith(".dylib")) {
      const installName = dependencies[0];

      if (installName?.startsWith(sourceLibPrefix)) {
        try {
          this.runTool("install_name_tool", [
            "-id",
            `@rpath/${path.basename(filePath)}`,
            filePath,
          ]);
        } catch {
          // Not every dylib allows changing its id after copy; skip if needed.
        }
      }
    }
  }

  patchShellWrappers(runtimeRoot) {
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
  }

  writeRscriptWrapper(runtimeRoot) {
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
  }

  patchMacRuntime(runtimeRoot, sourceRHome) {
    if (os.platform() !== "darwin") return;

    const sourceLibPrefix = path.join(sourceRHome, "lib");
    const machOFiles = this.walkFiles(runtimeRoot).filter((filePath) =>
      this.isMachO(filePath)
    );

    for (const filePath of machOFiles) {
      this.patchMachOFile({
        filePath,
        runtimeRoot,
        sourceLibPrefix,
      });
    }

    this.patchShellWrappers(runtimeRoot);
    this.writeRscriptWrapper(runtimeRoot);

    for (const filePath of machOFiles) {
      try {
        this.runTool("codesign", ["--force", "--sign", "-", filePath]);
      } catch {
        // Some copied artifacts are not signable Mach-O executables. Skip them.
      }
    }
  }

  getRequiredPackagesWithDependencies(rscript) {
    const expression = `
      required <- c(${this.requiredPackages.map((pkg) => `"${pkg}"`).join(",")});

      installed <- installed.packages();

      deps <- tools::package_dependencies(
        required,
        db = installed,
        recursive = TRUE
      );

      pkgs <- unique(c(required, unlist(deps, use.names = FALSE)));
      pkgs <- pkgs[!is.na(pkgs)];
      pkgs <- pkgs[nzchar(pkgs)];

      missing <- pkgs[!pkgs %in% rownames(installed)];

      if (length(missing) > 0) {
        stop(
          sprintf("Missing dependency R packages: %s", paste(missing, collapse = ", ")),
          call. = FALSE
        );
      }

      cat(paste(pkgs, collapse = "\\n"));
    `;

    return this.runR(rscript, expression)
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  getCoreRuntimePackages(rscript) {
    const expression = `
      installed <- installed.packages(priority = c("base", "recommended"));
      pkgs <- rownames(installed);
      pkgs <- pkgs[!is.na(pkgs)];
      pkgs <- pkgs[nzchar(pkgs)];
      cat(paste(pkgs, collapse = "\\n"));
    `;

    return this.runR(rscript, expression)
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  getPackagePath(rscript, packageName) {
    const expression = `
      path <- system.file(package = "${packageName}");

      if (!nzchar(path)) {
        stop("Package not found: ${packageName}", call. = FALSE);
      }

      cat(normalizePath(path, mustWork = TRUE));
    `;

    return this.runR(rscript, expression);
  }

  copyRequiredPackagesIntoRuntime(rscript, runtimeRoot) {
    const runtimeLibraryDir = path.join(runtimeRoot, "library");
    mkdirSync(runtimeLibraryDir, { recursive: true });

    const packageList = Array.from(
      new Set([
        ...this.getCoreRuntimePackages(rscript),
        ...this.getRequiredPackagesWithDependencies(rscript),
      ])
    );

    for (const packageName of packageList) {
      const sourcePackagePath = this.getPackagePath(rscript, packageName);
      const targetPackagePath = path.join(runtimeLibraryDir, packageName);

      if (existsSync(targetPackagePath)) {
        rmSync(targetPackagePath, {
          recursive: true,
          force: true,
        });
      }

      cpSync(sourcePackagePath, targetPackagePath, {
        recursive: true,
        dereference: true,
        force: true,
      });

      console.log(
        `Copied R package ${packageName}: ${sourcePackagePath} -> ${targetPackagePath}`
      );
    }

    return packageList;
  }

  verifyBundledRuntimePackages(runtimeRoot) {
    const bundledRscript = path.join(runtimeRoot, "bin", "Rscript");

    if (!existsSync(bundledRscript)) {
      throw new Error(`Bundled Rscript was not found: ${bundledRscript}`);
    }

    const expression = `
      pkgs <- c(${this.requiredPackages.map((pkg) => `"${pkg}"`).join(",")});

      missing <- pkgs[!vapply(pkgs, requireNamespace, logical(1), quietly = TRUE)];

      if (length(missing) > 0) {
        stop(
          sprintf("Bundled R runtime is missing required packages: %s", paste(missing, collapse = ", ")),
          call. = FALSE
        );
      }

      cat(sprintf("Bundled R packages OK: %s", paste(pkgs, collapse = ", ")));
    `;

    const output = this.runR(bundledRscript, expression);
    console.log(output);
  }

  cleanTargetRuntime() {
    if (this.shouldClean && existsSync(this.targetRuntimeDir)) {
      rmSync(this.targetRuntimeDir, {
        recursive: true,
        force: true,
      });
    }
  }

  copyRHomeToRuntime(rHome) {
    mkdirSync(path.dirname(this.targetRuntimeDir), {
      recursive: true,
    });

    mkdirSync(this.targetRuntimeDir, { recursive: true });

    const entries = readdirSync(rHome, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "library") continue;

      cpSync(path.join(rHome, entry.name), path.join(this.targetRuntimeDir, entry.name), {
        recursive: true,
        dereference: true,
        force: true,
      });
    }
  }

  run() {
    const rscript = this.resolveRscript();

    const rHome = this.runR(
      rscript,
      "cat(normalizePath(R.home(), mustWork = TRUE))"
    );

    this.assertPackages(rscript);

    if (!existsSync(rHome)) {
      throw new Error(`R_HOME does not exist: ${rHome}`);
    }

    this.cleanTargetRuntime();

    this.copyRHomeToRuntime(rHome);

    const copiedPackages = this.copyRequiredPackagesIntoRuntime(
      rscript,
      this.targetRuntimeDir
    );

    this.patchMacRuntime(this.targetRuntimeDir, rHome);

    this.verifyBundledRuntimePackages(this.targetRuntimeDir);

    console.log(`Vendored R runtime from: ${rHome}`);
    console.log(`Vendored R runtime to:   ${this.targetRuntimeDir}`);
    console.log(`Required packages:       ${this.requiredPackages.join(", ")}`);
    console.log(`Copied package count:    ${copiedPackages.length}`);
  }
}

const vendor = new RRuntimeVendor();
vendor.run();
