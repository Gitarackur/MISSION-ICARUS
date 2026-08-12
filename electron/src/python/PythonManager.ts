import { Manager } from "../core/Manager";

import fs from "fs";
import CoreExec from "../core/Exec";
import {
  PersistentJsonWorker,
  PersistentWorkerUnavailableError,
} from "../core/PersistentJsonWorker";
import { app } from "electron";
import {
  getPythonBinary,
  getPythonCommanderScript,
  getPythonRuntimeEnv,
  isPythonRuntimeAvailable,
  resolvePythonWorkerLaunch,
} from "./python-runtime";



export class PythonManager extends Manager {
  private worker: PersistentJsonWorker | null = null;

  public isPythonRendererAvailable(): boolean {
    return isPythonRuntimeAvailable();
  }

  public getBin(scriptPath: string): string {
    return getPythonBinary(scriptPath);
  }

  public runScript(
    scriptPath: string,
    args?: string[],
    data?: unknown
  ): Promise<string> {
    console.log(`Running Python script: ${scriptPath} with args: ${args} and data: ${data ? 'provided' : 'none'}`);
    const env = getPythonRuntimeEnv();

    if (!app.isPackaged && fs.existsSync(scriptPath)) {
      return CoreExec.run("python3", [scriptPath, ...(args ?? [])], data, { env });
    }

    const binPath = this.getBin(scriptPath);
    console.log(`Running packaged Python binary: ${binPath}`);
    return CoreExec.run(binPath, args, data, { env });
  }

  public async warmUp(): Promise<boolean> {
    try {
      await this.getWorker().start();
      return true;
    } catch (error) {
      this.resetWorker(error);
      return false;
    }
  }

  public dispose(): void {
    this.worker?.dispose();
    this.worker = null;
  }

  public async getPlot<T = Record<string, unknown>>(data: T): Promise<string> {
    return this.runCommanderCommand('plot', data);
  }

  private async runCommanderCommand<T = Record<string, unknown>>(
    command: string,
    data: T
  ): Promise<string> {
    const scriptPath = getPythonCommanderScript();

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.getWorker().request({ command, payload: data });
      } catch (error) {
        if (!(error instanceof PersistentWorkerUnavailableError)) throw error;
        this.resetWorker(error);
      }
    }

    const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data);
    return this.runScript(scriptPath, [command, stringifiedData, '--use-json']);
  }

  private getWorker(): PersistentJsonWorker {
    if (this.worker) return this.worker;

    const { command, args, env } = resolvePythonWorkerLaunch();
    this.worker = new PersistentJsonWorker(
      command,
      args,
      { env },
      "Python renderer"
    );
    return this.worker;
  }

  private resetWorker(error: unknown): void {
    console.warn(
      "Persistent Python renderer stopped; it will be restarted on demand.",
      error
    );
    this.worker?.dispose();
    this.worker = null;
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
