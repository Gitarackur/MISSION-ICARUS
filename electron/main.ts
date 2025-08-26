import { app, BrowserWindow, Menu, globalShortcut, ipcMain } from "electron";
// import { createRequire } from 'node:module'
import { fileURLToPath } from "node:url";
import path from "node:path";

import EmbeddedPythonManager from "./src/python/python-manager";
import EmbeddedRManager from "./src/r/r-manager";

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
    console.log('Running in production mode. Disabling DevTools access.');

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

      const customContextMenu = Menu.buildFromTemplate(customContextMenuTemplate);
      if (win) customContextMenu.popup({ window: win });

      event.preventDefault();
    });
  } else {
    console.log('Running in development mode. DevTools access is enabled.');
    // In development, you might want to open DevTools automatically for convenience
    // mainWindow.webContents.openDevTools();
  }
}

// Embedded Python Manager
// Embedded R Manager
const pythonManager = new EmbeddedPythonManager();
const rManager = new EmbeddedRManager();

ipcMain.handle(
  "run-python",
  async (
    _event,
    { scriptPath, args }: { scriptPath: string; args?: string[] }
  ) => {
    return pythonManager.runPythonScript(scriptPath, args || []);
  }
);

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

app.whenReady().then(createWindow);
