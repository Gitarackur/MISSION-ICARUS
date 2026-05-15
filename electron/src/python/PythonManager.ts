import { Manager } from "../core/Manager";

import path from "path";
import fs from "fs";
import CoreExec from "../core/Exec";
import { resourcePath } from "../core/utils";
import { app } from "electron";



export class PythonManager extends Manager {
  private getBinaryNameForCommand(command: string): string {
    switch (command) {
      case "heatmap":
        return "commander-plot-heatmap";
      case "pca":
        return "commander-plot-ml";
      case "plot":
      case "boxplot":
      case "scatter":
      case "volcano":
      default:
        return "commander-plot-core";
    }
  }

  private getLegacyBinaryName(): string {
    return "commander";
  }

  private getRuntimeEnv(): NodeJS.ProcessEnv {
    const baseTempDir = path.join(app.getPath("temp"), "mission-icarus-python");
    const mplConfigDir = path.join(baseTempDir, "matplotlib");
    const xdgCacheDir = path.join(baseTempDir, "cache");
    const fontConfigDir = path.join(baseTempDir, "fontconfig");

    fs.mkdirSync(mplConfigDir, { recursive: true });
    fs.mkdirSync(xdgCacheDir, { recursive: true });
    fs.mkdirSync(fontConfigDir, { recursive: true });

    return {
      ...process.env,
      TMPDIR: baseTempDir,
      MPLCONFIGDIR: mplConfigDir,
      XDG_CACHE_HOME: xdgCacheDir,
      FONTCONFIG_PATH: fontConfigDir,
    };
  }

  public isPythonRendererAvailable(): boolean {
    const scriptPath = resourcePath("scripts", "python", "commander.py");
    if (!app.isPackaged) {
      return fs.existsSync(scriptPath);
    }

    try {
      return (
        fs.existsSync(this.getBin(scriptPath, "commander-plot-core")) ||
        fs.existsSync(this.getBin(scriptPath, this.getLegacyBinaryName()))
      );
    } catch {
      return false;
    }
  }

  private checkIfPathIsPythonScript(scriptPath: string): void {
    const ext = path.extname(scriptPath).toLowerCase();
    if (ext !== ".py") {
      throw new Error(`Not a Python script: ${scriptPath}`);
    }
  }

  public getBin(scriptPath: string, binaryBaseName?: string): string {
    this.checkIfPathIsPythonScript(scriptPath);

    const dirname = path.dirname(scriptPath);
    const extname = path.extname(scriptPath);
    const basename = binaryBaseName ?? path.basename(scriptPath, extname);
    const binPath = path.join(dirname, 'bin', basename + this.getBinExtension());

    if (!fs.existsSync(binPath)) {
      throw new Error(
        `Compiled Python binary not found. Expected at: ${binPath}`
      );
    }

    return binPath;
  }

  private resolveBinaryBaseName(scriptPath: string, requestedBinaryBaseName?: string): string {
    if (!app.isPackaged) {
      return requestedBinaryBaseName ?? path.basename(scriptPath, path.extname(scriptPath));
    }

    if (requestedBinaryBaseName) {
      try {
        this.getBin(scriptPath, requestedBinaryBaseName);
        return requestedBinaryBaseName;
      } catch {
        // Fall back to the legacy shipped binary until split binaries are built.
      }
    }

    return this.getLegacyBinaryName();
  }


  public runScript(
    scriptPath: string,
    args?: string[],
    data?: unknown,
    binaryBaseName?: string
  ): Promise<string> {
    console.log(`Running Python script: ${scriptPath} with args: ${args} and data: ${data ? 'provided' : 'none'}`);
    const env = this.getRuntimeEnv();

    if (!app.isPackaged && fs.existsSync(scriptPath)) {
      return CoreExec.run("python3", [scriptPath, ...(args ?? [])], data, { env });
    }

    const resolvedBinaryBaseName = this.resolveBinaryBaseName(scriptPath, binaryBaseName);
    const binPath = this.getBin(scriptPath, resolvedBinaryBaseName);
    console.log(`Running packaged Python binary: ${binPath}`);
    return CoreExec.run(binPath, args, data, { env });
  }

  public async getPlot<T = Record<string, unknown>>(data: T): Promise<string> {
    return this.runCommanderCommand('plot', data);
  }

  private async runCommanderCommand<T = Record<string, unknown>>(
    command: string,
    data: T
  ): Promise<string> {
    const scriptPath = resourcePath('scripts', 'python', 'commander.py');
    const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data);
    const binaryBaseName = this.getBinaryNameForCommand(command);
    return this.runScript(scriptPath, [command, stringifiedData, '--use-json'], undefined, binaryBaseName);
  }

  public async getHeatmap<T = Record<string, unknown>>(data: T): Promise<string> {
    return this.runCommanderCommand('heatmap', data);
  }

  public async getVolcanoPlot<T = Record<string, unknown>>(data: T): Promise<string> {
    return this.runCommanderCommand('volcano', data);
  }

  public async getBoxPlot<T = Record<string, unknown>>(data: T): Promise<string> {
    return this.runCommanderCommand('boxplot', data);
  }

  public async getScatterPlot<T = Record<string, unknown>>(data: T): Promise<string> {
    return this.runCommanderCommand('scatter', data);
  }

  public async getPcaPlot<T = Record<string, unknown>>(data: T): Promise<string> {
    return this.runCommanderCommand('pca', data);
  }

  public async getPlotByCommand<T = Record<string, unknown>>(
    command: string,
    data: T
  ): Promise<string> {
    const allowedCommands = new Set([
      'plot',
      'boxplot',
      'scatter',
      'heatmap',
      'volcano',
      'pca',
    ]);

    if (!allowedCommands.has(command)) {
      throw new Error(`Unsupported Python plot command: ${command}`);
    }

    return this.runCommanderCommand(command, data);
  }
}
