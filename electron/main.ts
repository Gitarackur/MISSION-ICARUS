import { app, BrowserWindow, Menu, globalShortcut } from "electron";

import { fileURLToPath } from "node:url";
import path from "node:path";

import { setupPythonHandlers } from "./src/python/ipc-handlers";
import { setupRHandlers } from "./src/r/ipc-handlers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

// Add global error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error("Reason:", reason);
  console.error(
    "Stack:",
    reason instanceof Error ? reason.stack : "No stack trace"
  );
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  console.error("Stack:", error.stack);
});

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
    });

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
        ] as (Electron.MenuItemConstructorOptions | Electron.MenuItem)[];

        const devContextMenu = Menu.buildFromTemplate(devContextMenuTemplate);
        win && devContextMenu.popup({ window: win, x: params.x, y: params.y });
      }
    );
  }
}

// Wrap IPC handlers in try-catch
try {
  console.log("Setting up Python handlers...");
  setupPythonHandlers();
  console.log("Python handlers set up successfully");
} catch (error) {
  console.error("Error setting up Python handlers:", error);
}

try {
  console.log("Setting up R handlers...");
  setupRHandlers();
  console.log("R handlers set up successfully");
} catch (error) {
  console.error("Error setting up R handlers:", error);
}

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

async function main() {
  try {
    console.log("Starting main function...");

    console.log("Importing database module...");
    const { initializeDatabase } = await import("./src/database");

    console.log("Importing database handlers...");
    const { setupDatabaseHandlers } = await import(
      "./src/database/ipc-handlers"
    );

    console.log("Waiting for app ready...");
    await app.whenReady();

    console.log("Initializing database...");
    const result = await initializeDatabase();

    if (!result) {
      throw new Error("Database initialization returned undefined");
    }

    console.log("Database initialized successfully");
    const { icarusDBAdapter } = result;

    console.log("Setting up database handlers...");
    setupDatabaseHandlers(icarusDBAdapter);

    console.log("Creating window...");
    createWindow();

    console.log("Application started successfully");
  } catch (error) {
    console.error("Failed to Open Application:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "No stack trace",
      name: error instanceof Error ? error.name : typeof error,
    });
    app.quit();
  }
}

app
  .whenReady()
  .then(main)
  .catch((error) => {
    console.error("Error in app.whenReady():", error);
    app.quit();
  });
