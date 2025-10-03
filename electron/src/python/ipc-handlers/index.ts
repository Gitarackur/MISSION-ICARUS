import { ipcMain } from "electron";
import { PythonManager } from "../PythonManager";

const pythonManager = new PythonManager();

interface Data {
  method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any[];
}

export function setupPythonHandlers() {
  ipcMain.handle("run:python", async (_event, { method, args = [] }: Data) => {
    if (
      typeof pythonManager[method as keyof typeof pythonManager] !== "function"
    ) {
      throw new Error(`Method '${method}' does not exist on PythonManager`);
    }
    const methodFunc = pythonManager[method as keyof typeof pythonManager] as (
      ...args: unknown[]
    ) => Promise<unknown>;
    return methodFunc.call(pythonManager, ...(args || []));
  });
}
