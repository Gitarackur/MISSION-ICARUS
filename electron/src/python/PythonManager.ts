import { Manager } from "../core/Manager";

import path from "path";
import fs from "fs";
import { app } from "electron";
import CoreExec from "../core/Exec";


const SCRIPT_DIR_PATH = path.join(app.getAppPath(), 'scripts', 'python');

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
      throw new Error(`Compiled binary not found for script: ${scriptPath}. Expected at: ${binPath}`);
    }

    return binPath;
  }


  public runScript(scriptPath: string, args?: string[], data?: unknown): Promise<string> {
    console.log(`Running Python script: ${scriptPath} with args: ${args} and data: ${data ? 'provided' : 'none'}`);

    const binPath = this.getBin(scriptPath);
    return CoreExec.run(binPath, args, data);
  }

  public async getPlot<T = Record<string, unknown>>(data: T): Promise<string> {
    const stringifiedData = JSON.stringify(data);
    const scriptPath = path.join(SCRIPT_DIR_PATH, 'plot_data.py');
    return this.runScript(scriptPath, [stringifiedData, '--use-json']);
  }
}