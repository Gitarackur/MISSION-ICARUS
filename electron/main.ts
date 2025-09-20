import { app, BrowserWindow, Menu, globalShortcut, ipcMain } from "electron";
// import { createRequire } from 'node:module'
import { fileURLToPath } from "node:url";
import path from "node:path";

// import EmbeddedPythonManager from "./src/python/python-manager";
import EmbeddedRManager from "./src/r/r-manager";
import { PythonManager } from "./src/python/PythonManager";

import {
  IcarusSessionRecord,
  IcarusWorkflowRecord,
  IcarusActivityRecord,
  IcarusMatrixRecord,
  IcarusVisualizationRecord,
} from "@/app-layer/database/database.types";
import { IcarusDB } from "./src/database/adapter";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "assets", "icarus.png"),
    resizable: true,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open the DevTools only in a non-production environment.
  // if (process.env.NODE_ENV !== 'production') {
  //   win.webContents.openDevTools();
  // }

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  if (app.isPackaged) {
    console.log("Running in production mode. Disabling DevTools access.");

    Menu.setApplicationMenu(null);

    win.webContents.on("devtools-opened", () => {
      console.log("Developer Tools tried to open! Closing them.");
    });

    globalShortcut.register("F12", () => {
      console.log("F12 pressed, DevTools access blocked.");
    });

    globalShortcut.register("CommandOrControl+Shift+I", () => {
      console.log("Ctrl+Shift+I pressed, DevTools access blocked.");
      // Do nothing.
    });

    // Optional: Register for common macOS shortcuts if you want to be extra thorough
    globalShortcut.register("Command+Alt+I", () => {
      console.log("Cmd+Opt+I pressed, DevTools access blocked.");
    });

    win.webContents.on("context-menu", (event) => {
      const customContextMenuTemplate = [
        { label: "Go Back", click: () => win?.webContents.goBack() },
      ];

      const customContextMenu = Menu.buildFromTemplate(
        customContextMenuTemplate
      );
      if (win) customContextMenu.popup({ window: win });

      event.preventDefault();
    });
  } else {
    // --- DEVELOPMENT MODE ---
    console.log("Running in development mode. DevTools access is enabled.");

    globalShortcut.register("F12", () => {
      console.log("F12 pressed in dev mode, opening DevTools.");
      win?.webContents.openDevTools();
    });

    globalShortcut.register("CommandOrControl+Shift+I", () => {
      console.log("Ctrl+Shift+I pressed in dev mode, opening DevTools.");
      win?.webContents.openDevTools();
    });

    globalShortcut.register("Command+Alt+I", () => {
      console.log("Cmd+Opt+I pressed in dev mode, opening DevTools.");
      win?.webContents.openDevTools();
    });

    win.webContents.on(
      "context-menu",
      (_event: Electron.Event, params: Electron.ContextMenuParams) => {
        const devContextMenuTemplate = [
          { label: "Reload", role: "reload" },
          { label: "Force Reload", role: "forcereload" },
          { type: "separator" },
          { label: "Inspect Element", role: "toggleDevTools" },
          { type: "separator" },
          { label: "Copy", role: "copy" },
          { label: "Paste", role: "paste" },
          // Add other useful dev-mode context menu items here if needed
        ] as (Electron.MenuItemConstructorOptions | Electron.MenuItem)[];

        const devContextMenu = Menu.buildFromTemplate(devContextMenuTemplate);
        win && devContextMenu.popup({ window: win, x: params.x, y: params.y });
      }
    );
  }
}

// Embedded Python Manager
// Embedded R Manager
// const pythonManager = new EmbeddedPythonManager();
const rManager = new EmbeddedRManager();
const pythonManager = new PythonManager();

interface Data {
  method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any[];
}

ipcMain.handle("run:python", async (_event, { method, args = [] }: Data) => {
  if (
    typeof pythonManager[method as keyof typeof pythonManager] !== "function"
  ) {
    throw new Error(`Method '${method}' does not exist on PythonManager`);
  }
  const methodFunc = pythonManager[
    method as keyof typeof pythonManager
  ] as (...args: unknown[]) => Promise<unknown>;
  return methodFunc.call(pythonManager, ...(args || []));
});

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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// DATABASE IPC HANDLERS
// Session handlers
ipcMain.handle("db:saveSession", async (_, session: IcarusSessionRecord) => {
  try {
    IcarusDB.saveSession(session);
    return { success: true };
  } catch (error) {
    console.error("Error saving session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("db:getSession", async (_, id: string) => {
  try {
    const session = IcarusDB.getSession(id);
    return { success: true, data: session };
  } catch (error) {
    console.error("Error getting session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("db:getAllSessions", async () => {
  try {
    const sessions = IcarusDB.getAllSessions();
    return { success: true, data: sessions };
  } catch (error) {
    console.error("Error getting sessions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("db:deleteSession", async (_, id: string) => {
  try {
    IcarusDB.deleteSession(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("db:getSessionWithWorkflows", async (_, id: string) => {
  try {
    const session = IcarusDB.getSessionWithWorkflows(id);
    return { success: true, data: session };
  } catch (error) {
    console.error("Error getting session with workflows:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Workflow handlers
ipcMain.handle("db:saveWorkflow", async (_, workflow: IcarusWorkflowRecord) => {
  try {
    IcarusDB.saveWorkflow(workflow);
    return { success: true };
  } catch (error) {
    console.error("Error saving workflow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("db:getWorkflow", async (_, id: string) => {
  try {
    const workflow = IcarusDB.getWorkflow(id);
    return { success: true, data: workflow };
  } catch (error) {
    console.error("Error getting workflow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Matrix handlers
ipcMain.handle("db:saveMatrix", async (_, matrix: IcarusMatrixRecord) => {
  try {
    IcarusDB.saveMatrix(matrix);
    return { success: true };
  } catch (error) {
    console.error("Error saving matrix:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("db:getMatrix", async (_, id: string) => {
  try {
    const matrix = IcarusDB.getMatrix(id);
    return { success: true, data: matrix };
  } catch (error) {
    console.error("Error getting matrix:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Activity handlers
ipcMain.handle("db:saveActivity", async (_, activity: IcarusActivityRecord) => {
  try {
    IcarusDB.saveActivity(activity);
    return { success: true };
  } catch (error) {
    console.error("Error saving activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("db:getActivity", async (_, id: string) => {
  try {
    const activity = IcarusDB.getActivity(id);
    return { success: true, data: activity };
  } catch (error) {
    console.error("Error getting activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Visualization handlers
ipcMain.handle(
  "db:saveVisualization",
  async (_, visualization: IcarusVisualizationRecord) => {
    try {
      IcarusDB.saveVisualization(visualization);
      return { success: true };
    } catch (error) {
      console.error("Error saving visualization:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

ipcMain.handle("db:getVisualization", async (_, id: string) => {
  try {
    const visualization = IcarusDB.getVisualization(id);
    return { success: true, data: visualization };
  } catch (error) {
    console.error("Error getting visualization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

app.whenReady().then(createWindow);
