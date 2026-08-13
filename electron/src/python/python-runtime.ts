import { app } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resourcePath } from "../core/utils";

export const getPythonRuntimeEnv = (): NodeJS.ProcessEnv => {
  const baseTempDir = path.join(app.getPath("temp"), "mission-icarus-python");
  const mplConfigDir = path.join(baseTempDir, "matplotlib");
  const xdgCacheDir = path.join(baseTempDir, "cache");
  const fontConfigDir = path.join(baseTempDir, "fontconfig");

  fs.mkdirSync(mplConfigDir, { recursive: true });
  fs.mkdirSync(xdgCacheDir, { recursive: true });
  fs.mkdirSync(fontConfigDir, { recursive: true });

  return {
    ...process.env,
    TMPDIR: baseTempDir,
    MPLCONFIGDIR: mplConfigDir,
    XDG_CACHE_HOME: xdgCacheDir,
    FONTCONFIG_PATH: fontConfigDir,
    MPLBACKEND: "Agg",
    PYTHONUTF8: "1",
    PYTHONIOENCODING: "utf-8",
  };
};

export const getPythonCommanderScript = () =>
  resourcePath("scripts", "python", "commander.py");

export const getPythonBinary = (scriptPath: string): string => {
  if (path.extname(scriptPath).toLowerCase() !== ".py") {
    throw new Error(`Not a Python script: ${scriptPath}`);
  }

  const extension =
    os.platform() === "win32" ? ".exe" : os.platform() === "darwin" ? ".bin" : "";
  const binary = path.join(
    path.dirname(scriptPath),
    "bin",
    path.basename(scriptPath, path.extname(scriptPath)) + extension
  );
  if (!fs.existsSync(binary)) {
    throw new Error(`Compiled Python binary not found. Expected at: ${binary}`);
  }
  return binary;
};

export const resolvePythonWorkerLaunch = (
  workerMode: "--worker" | "--statistics-worker" = "--worker"
): {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
} => {
  const scriptPath = getPythonCommanderScript();
  const useSource = !app.isPackaged && fs.existsSync(scriptPath);
  return {
    command: useSource ? "python3" : getPythonBinary(scriptPath),
    args: useSource ? [scriptPath, workerMode] : [workerMode],
    env: getPythonRuntimeEnv(),
  };
};

export const isPythonRuntimeAvailable = (): boolean => {
  const scriptPath = getPythonCommanderScript();
  if (!app.isPackaged) return fs.existsSync(scriptPath);
  try {
    return fs.existsSync(getPythonBinary(scriptPath));
  } catch {
    return false;
  }
};
