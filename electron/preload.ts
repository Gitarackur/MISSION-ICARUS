import { ipcRenderer, contextBridge, IpcRendererEvent } from 'electron'


// --------- Expose some API to the Renderer process ---------
// contextBridge.exposeInMainWorld('ipcRenderer', {
//   on(...args: Parameters<typeof ipcRenderer.on>) {
//     const [channel, listener] = args
//     return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
//   },
//   off(...args: Parameters<typeof ipcRenderer.off>) {
//     const [channel, ...omit] = args
//     return ipcRenderer.off(channel, ...omit)
//   },
//   send(...args: Parameters<typeof ipcRenderer.send>) {
//     const [channel, ...omit] = args
//     return ipcRenderer.send(channel, ...omit)
//   },
//   invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
//     const [channel, ...omit] = args
//     return ipcRenderer.invoke(channel, ...omit)
//   },

//   // You can expose other APTs you need here.
//   // ...
// })

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (...args: Parameters<typeof ipcRenderer.invoke>) => ipcRenderer.invoke(...args),
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) =>
      ipcRenderer.on(channel, listener),
    off: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) =>
      ipcRenderer.off(channel, listener),
    send: (...args: Parameters<typeof ipcRenderer.send>) => ipcRenderer.send(...args),
  },
});


