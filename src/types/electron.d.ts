// src/types/electron.d.ts

export {};

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke<T = string>(channel: string, data?: unknown): Promise<T>;
        send(channel: string, data?: unknown): void;
        on(
          channel: string,
          listener: (event: unknown, ...args: unknown[]) => void
        ): void;
        off(
          channel: string,
          listener: (event: unknown, ...args: unknown[]) => void
        ): void;
      };
    };
  }
}
