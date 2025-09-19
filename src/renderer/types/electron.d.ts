interface ElectronAPI {
  invoke<T>(channel: string, payload?: unknown): Promise<T>;
  send(channel: string, payload?: unknown): void;
  on(channel: string, listener: (...args: unknown[]) => void): () => void;
  once(channel: string, listener: (...args: unknown[]) => void): void;
  removeAllListeners(channel: string): void;
  getPreloadPath(key: "webview"): string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
