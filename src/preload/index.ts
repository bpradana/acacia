import { contextBridge, ipcRenderer } from 'electron'
import path from 'node:path'

type Listener = (...args: unknown[]) => void

type Disposer = () => void

const createOn = () => {
  return (channel: string, listener: Listener): Disposer => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      listener(...args)
    }

    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  }
}

const api = {
  invoke: <T>(channel: string, payload?: unknown): Promise<T> => ipcRenderer.invoke(channel, payload as never),
  send: (channel: string, payload?: unknown): void => {
    ipcRenderer.send(channel, payload as never)
  },
  on: createOn(),
  once: (channel: string, listener: Listener): void => {
    ipcRenderer.once(channel, (_event, ...args) => listener(...args))
  },
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel)
  },
  getPreloadPath: (key: 'webview'): string => {
    if (key === 'webview') {
      return path.join(__dirname, 'webview.js')
    }

    throw new Error(`Unknown preload key: ${key}`)
  },
}

contextBridge.exposeInMainWorld('electronAPI', api)
