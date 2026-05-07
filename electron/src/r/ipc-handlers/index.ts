import { ipcMain } from "electron";
import EmbeddedRManager from "../../r/r-manager";
import path from "node:path";
import { resourcePath } from "../../core/utils";


const resolveRScriptPath = (scriptPath: string): string => {
  if (path.isAbsolute(scriptPath)) return scriptPath;

  const normalizedPath = scriptPath.replace(/\\/g, "/");
  const scriptName = path.basename(normalizedPath);

  return resourcePath("scripts", "r", scriptName);
};

export function setupRHandlers() {
  const rManager = new EmbeddedRManager();

  ipcMain.handle(
    "run-r",
    async (
      _event,
      { scriptPath, args }: { scriptPath?: string; args?: string[] }
    ) => {
      if (!scriptPath) {
        throw new Error("No R script path provided.");
      }

      if (!rManager.isRAvailable()) {
        throw new Error("R is not available on this system.");
      }

      rManager.ensurePackagesInstalled(["ggplot2", "dplyr", "jsonlite"]);

      try {
        const output = await rManager.runRScript(resolveRScriptPath(scriptPath), args || []);
        return output;
      } catch (err) {
        console.error("R error:", err);
        throw err;
      }
    }
  );
}
