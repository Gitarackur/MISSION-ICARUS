// src/types/electron.d.ts

export {};

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, data: unknown): Promise<string>;
        send(channel: string, data?: unknown): void;
        on(channel: string, listener: (...args: unknown[]) => void): void;
        off(channel: string, listener: (...args: unknown[]) => void): void;
      };
    };
  }
}
