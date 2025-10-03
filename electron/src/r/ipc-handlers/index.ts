import { ipcMain } from "electron";
import EmbeddedRManager from "../../r/r-manager";



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
        const output = await rManager.runRScript(scriptPath, args || []);
        return output;
      } catch (err) {
        console.error("R error:", err);
        throw err;
      }
    }
  );
}