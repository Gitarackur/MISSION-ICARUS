import { ipcMain } from "electron";
import EmbeddedRManager from "../../r/r-manager";
import path from "node:path";
import { resourcePath } from "../../core/utils";
import fs from "node:fs";


const resolveRScriptPath = (scriptPath: string): string => {
  if (path.isAbsolute(scriptPath)) return scriptPath;

  const normalizedPath = scriptPath.replace(/\\/g, "/");
  const scriptName = path.basename(normalizedPath);

  return resourcePath("scripts", "r", scriptName);
};

export function setupRHandlers() {
  const rManager = new EmbeddedRManager();

  ipcMain.handle("renderer:r-available", async () => rManager.isRAvailable());

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
        throw new Error(
          "R is not available on this system. Install R/Rscript to use the R renderer in production."
        );
      }

      rManager.ensurePackagesInstalled(["ggplot2", "jsonlite", "ragg"]);

      try {
        const resolvedScriptPath = resolveRScriptPath(scriptPath);
        if (!fs.existsSync(resolvedScriptPath)) {
          throw new Error(
            `R renderer script not found at: ${resolvedScriptPath}`
          );
        }

        const output = await rManager.runRScript(resolvedScriptPath, args || []);
        return output;
      } catch (err) {
        console.error("R error:", err);
        throw err;
      }
    }
  );
}
