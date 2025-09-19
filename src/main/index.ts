import { app, BrowserWindow, ipcMain, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

let mainWindow: BrowserWindow | null = null;

const loadRenderer = async (window: BrowserWindow) => {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (!app.isPackaged && devServerUrl) {
    await window.loadURL(devServerUrl);
    return;
  }

  const rendererIndexPath = path.join(__dirname, "../renderer/index.html");

  if (fs.existsSync(rendererIndexPath)) {
    await window.loadFile(rendererIndexPath);
    return;
  }

  throw new Error(
    "Unable to determine renderer entry. Either set VITE_DEV_SERVER_URL or run `npm run build` to generate dist/renderer/index.html.",
  );
};

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#0f172a",
    show: false,
    title: "Acacia",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
      preload: path.join(__dirname, "../preload/index.js"),
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  await loadRenderer(mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch((err) => {
      console.error("Failed to open external url", err);
    });
    return { action: "deny" };
  });
};

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("app:get-webview-preload", () => {
  return pathToFileURL(
    path.join(__dirname, "../preload/webview.js"),
  ).toString();
});

ipcMain.handle("app:focus", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});
