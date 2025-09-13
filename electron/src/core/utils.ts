import os from 'os'
import path from 'path'
import { app } from 'electron';

export function isMac(): boolean {
  return os.platform() === 'darwin';
}
export function isWindows(): boolean {
  return os.platform() === 'win32';
}
export function isLinux(): boolean {
  return os.platform() === 'linux';
}

export function getHomeDir(): string {
  return os.homedir();
}

export function getTempDir(): string {
  return os.tmpdir();
}

export function getAppDataDir(appName: string): string {
  const homeDir = getHomeDir();
  if (isWindows()) {
    return process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming', appName);
  } else if (isMac()) {
    return path.join(homeDir, 'Library', 'Application Support', appName);
  } else {
    return process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config', appName);
  }
}

export function resourcePath(...paths: string[]): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "assets", ...paths)
    : path.join(app.getAppPath(), "assets", ...paths);
}