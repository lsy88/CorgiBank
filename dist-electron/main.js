import { app, ipcMain, shell, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(app.getPath("userData"), "corgibank-data.json");
const BACKUP_FILE = path.join(app.getPath("userData"), "corgibank-data.bak");
const TEMP_FILE = path.join(app.getPath("userData"), "corgibank-data.temp");
ipcMain.handle("read-data", () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const data = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(data);
      } catch (e) {
        console.error("Main data file corrupted, trying backup...", e);
        if (fs.existsSync(BACKUP_FILE)) {
          const backupData = fs.readFileSync(BACKUP_FILE, "utf-8");
          return JSON.parse(backupData);
        }
        throw e;
      }
    }
    return { employees: [], products: [], materials: [], records: [], batches: [], losses: [] };
  } catch (error) {
    console.error("Failed to read data:", error);
    return { employees: [], products: [], materials: [], records: [], batches: [], losses: [] };
  }
});
ipcMain.handle("write-data", (_, data) => {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(TEMP_FILE, jsonStr);
    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.copyFileSync(DATA_FILE, BACKUP_FILE);
      } catch (e) {
        console.warn("Failed to create backup:", e);
      }
    }
    try {
      fs.copyFileSync(TEMP_FILE, DATA_FILE);
      fs.unlinkSync(TEMP_FILE);
    } catch (e) {
      console.warn("Atomic move failed, trying direct write", e);
      fs.writeFileSync(DATA_FILE, jsonStr);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to write data:", error);
    return { success: false, error };
  }
});
ipcMain.handle("open-data-folder", () => {
  if (!fs.existsSync(DATA_FILE)) {
    try {
      if (!fs.existsSync(path.dirname(DATA_FILE))) {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify({ employees: [], products: [], materials: [], records: [] }, null, 2));
    } catch (e) {
      console.error("Failed to create initial data file", e);
    }
  }
  shell.showItemInFolder(DATA_FILE);
});
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: path.join(process.env.VITE_PUBLIC, "logo.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
