import { app, ipcMain } from "electron";
import EmbeddedFSharpManager from "../../fsharp/fsharp-manager";

export function setupFSharpHandlers() {
  const fsharpManager = new EmbeddedFSharpManager();

  ipcMain.handle("renderer:fsharp-available", async () => {
    const available = fsharpManager.isFSharpAvailable();
    if (available) void fsharpManager.warmUp();
    return available;
  });

  ipcMain.handle(
    "run-fsharp",
    async (
      _event,
      { args }: { args?: string[] }
    ) => {
      if (!fsharpManager.isFSharpAvailable()) {
        throw new Error(
          "F# is not available on this system. Bundle the F# plot renderer runtime to use the F# renderer."
        );
      }

      try {
        const output = await fsharpManager.render(args || []);
        return output;
      } catch (err) {
        console.error("F# error:", err);
        throw err;
      }
    }
  );

  app.once("before-quit", () => fsharpManager.dispose());
}
