import { Manager } from "../core/Manager";

import path from "path";
import fs from "fs";
import CoreExec from "../core/Exec";
import { resourcePath } from "../core/utils";
import { app } from "electron";



export class PythonManager extends Manager {
  private checkIfPathIsPythonScript(scriptPath: string): void {
    const ext = path.extname(scriptPath).toLowerCase();
    if (ext !== ".py") {
      throw new Error(`Not a Python script: ${scriptPath}`);
    }
  }

  public getBin(scriptPath: string): string {
    this.checkIfPathIsPythonScript(scriptPath);

    const dirname = path.dirname(scriptPath);
    const extname = path.extname(scriptPath);
    const basename = path.basename(scriptPath, extname);
    const binPath = path.join(dirname, 'bin', basename + this.getBinExtension());

    if (!fs.existsSync(binPath)) {
      throw new Error(
        `Compiled Python binary not found. Expected at: ${binPath}`
      );
    }

    return binPath;
  }


  public runScript(scriptPath: string, args?: string[], data?: unknown): Promise<string> {
    console.log(`Running Python script: ${scriptPath} with args: ${args} and data: ${data ? 'provided' : 'none'}`);

    if (!app.isPackaged && fs.existsSync(scriptPath)) {
      return CoreExec.run("python3", [scriptPath, ...(args ?? [])], data);
    }

    const binPath = this.getBin(scriptPath);
    console.log(`Running packaged Python binary: ${binPath}`);
    return CoreExec.run(binPath, args, data);
  }

  public async getPlot<T = Record<string, unknown>>(data: T): Promise<string> {
    const scriptPath = resourcePath('scripts', 'python', 'commander.py');
    const stringifiedData = typeof data == 'string' ? data : JSON.stringify(data);
    return this.runScript(scriptPath, ['plot', stringifiedData, '--use-json']);
  }

  private async runCommanderCommand<T = Record<string, unknown>>(
    command: string,
    data: T
  ): Promise<string> {
    const scriptPath = resourcePath('scripts', 'python', 'commander.py');
    const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data);
    return this.runScript(scriptPath, [command, stringifiedData, '--use-json']);
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
