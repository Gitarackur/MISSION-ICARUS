import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { resourcePath } from "../core/utils";

// F# is a self-contained net10.0 single-file executable that renders a single
// plot to a Plotly figure JSON document on stdout. Unlike the R/Python workers
// it has no persistent stdin/stdout JSON protocol, so every render is a fresh
// one-shot subprocess: we write the payload JSON to a temp file and pass its
// path as argv[1], then capture the emitted figure JSON from stdout.
export default class EmbeddedFSharpManager {
  private bundledRuntimeRoot: string | null;
  private fsharpExe: string | null;
  private disposed = false;

  constructor() {
    this.bundledRuntimeRoot = this.findBundledRuntimeRoot();
    this.fsharpExe = this.findFSharpExecutable();
  }

  private getRuntimeDirCandidates(): string[] {
    const platform = os.platform();
    const arch = os.arch();

    if (platform === "darwin") {
      return [
        resourcePath("runtime", "fsharp", `macos-${arch}`),
        resourcePath("runtime", "fsharp", "macos"),
      ];
    }

    if (platform === "win32") {
      return [
        resourcePath("runtime", "fsharp", `windows-${arch}`),
        resourcePath("runtime", "fsharp", "windows"),
      ];
    }

    return [
      resourcePath("runtime", "fsharp", `linux-${arch}`),
      resourcePath("runtime", "fsharp", "linux"),
    ];
  }

  private executableName(): string {
    return os.platform() === "win32" ? "fsharp-plot.exe" : "fsharp-plot";
  }

  private findBundledRuntimeRoot(): string | null {
    for (const candidate of this.getRuntimeDirCandidates()) {
      if (fs.existsSync(path.join(candidate, this.executableName()))) {
        return candidate;
      }
    }
    return null;
  }

  private findFSharpExecutable(): string | null {
    if (!this.bundledRuntimeRoot) return null;
    const executable = path.join(this.bundledRuntimeRoot, this.executableName());
    return fs.existsSync(executable) ? executable : null;
  }

  isFSharpAvailable(): boolean {
    return this.fsharpExe !== null && fs.existsSync(this.fsharpExe);
  }

  isUsingBundledRuntime(): boolean {
    return Boolean(this.bundledRuntimeRoot);
  }

  public async render(
    args: string[] = []
  ): Promise<string> {
    if (!this.fsharpExe) {
      throw new Error(
        "F# plot renderer executable not found on this system."
      );
    }

    const payloadArg = args[0] ? String(args[0]) : "";
    if (!payloadArg) {
      throw new Error("F# renderer requires a JSON payload argument.");
    }

    const tmpPath = path.join(
      os.tmpdir(),
      `icarus-fsharp-${Date.now()}-${Math.floor(Math.random() * 1e9)}.json`
    );
    fs.writeFileSync(tmpPath, payloadArg, "utf8");

    return new Promise<string>((resolve, reject) => {
      const proc = spawn(this.fsharpExe!, [tmpPath], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      proc.on("error", (err) => {
        cleanup(tmpPath);
        reject(
          new Error(`Failed to start F# renderer: ${err.message}`)
        );
      });
      proc.on("close", (code) => {
        cleanup(tmpPath);
        const trimmed = stdout.trim();
        if (code === 0 && (trimmed.startsWith("{") || trimmed.startsWith("<svg"))) {
          resolve(trimmed);
        } else {
          reject(
            new Error(
              `F# renderer failed with exit code ${code ?? "unknown"}.\nSTDERR:\n${stderr.trim()}\nSTDOUT:\n${stdout.trim()}`
            )
          );
        }
      });
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.fsharpExe = null;
    this.bundledRuntimeRoot = null;
  }
}

function cleanup(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // best-effort temp cleanup; ignore failures
  }
}