import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'

let mainWindow: BrowserWindow | null = null

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#0f172a',
    show: false,
    title: 'Acacia',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173'

  if (!app.isPackaged) {
    await mainWindow.loadURL(devServerUrl)
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(err => {
      console.error('Failed to open external url', err)
    })
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('app:get-webview-preload', () => {
  return path.join(__dirname, '../preload/webview.js')
})

ipcMain.handle('app:focus', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  }
})
