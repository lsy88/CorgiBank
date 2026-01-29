import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Data persistence
const DATA_FILE = path.join(app.getPath('userData'), 'corgibank-data.json')
const BACKUP_FILE = path.join(app.getPath('userData'), 'corgibank-data.bak')
const TEMP_FILE = path.join(app.getPath('userData'), 'corgibank-data.temp')

ipcMain.handle('read-data', () => {
  try {
    // Try reading the main file first
    if (fs.existsSync(DATA_FILE)) {
      try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8')
        return JSON.parse(data)
      } catch (e) {
        console.error('Main data file corrupted, trying backup...', e)
        // If main file is corrupted, try backup
        if (fs.existsSync(BACKUP_FILE)) {
          const backupData = fs.readFileSync(BACKUP_FILE, 'utf-8')
          return JSON.parse(backupData)
        }
        throw e // If both fail, throw error
      }
    }
    return { employees: [], products: [], materials: [], records: [], batches: [], losses: [] }
  } catch (error) {
    console.error('Failed to read data:', error)
    return { employees: [], products: [], materials: [], records: [], batches: [], losses: [] }
  }
})

ipcMain.handle('write-data', (_, data) => {
  try {
    const jsonStr = JSON.stringify(data, null, 2)
    
    // 1. Write to temp file first (Atomic Write Step 1)
    fs.writeFileSync(TEMP_FILE, jsonStr)
    
    // 2. Backup existing file if it exists
    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.copyFileSync(DATA_FILE, BACKUP_FILE)
      } catch (e) {
        console.warn('Failed to create backup:', e)
      }
    }
    
    // 3. Rename temp to actual file (Atomic Write Step 2)
    // On Windows, rename might fail if destination exists, so we copy and unlink
    try {
        fs.copyFileSync(TEMP_FILE, DATA_FILE)
        fs.unlinkSync(TEMP_FILE)
    } catch (e) {
        // Fallback for some systems
        console.warn('Atomic move failed, trying direct write', e)
        fs.writeFileSync(DATA_FILE, jsonStr)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to write data:', error)
    return { success: false, error }
  }
})

ipcMain.handle('open-data-folder', () => {
  if (!fs.existsSync(DATA_FILE)) {
    // Create an empty file if it doesn't exist so we can show it
    try {
      if (!fs.existsSync(path.dirname(DATA_FILE))) {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify({ employees: [], products: [], materials: [], records: [] }, null, 2));
    } catch (e) {
      console.error('Failed to create initial data file', e);
    }
  }
  shell.showItemInFolder(DATA_FILE)
})

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
