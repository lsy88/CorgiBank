import { app as s, ipcMain as a, shell as f, BrowserWindow as l } from "electron";
import { fileURLToPath as h } from "node:url";
import e from "node:path";
import t from "node:fs";
const d = e.dirname(h(import.meta.url)), o = e.join(s.getPath("userData"), "salary-manager-data.json");
a.handle("read-data", () => {
  try {
    if (!t.existsSync(o))
      return { employees: [], products: [], materials: [], records: [] };
    const n = t.readFileSync(o, "utf-8");
    return JSON.parse(n);
  } catch (n) {
    return console.error("Failed to read data:", n), { employees: [], products: [], materials: [], records: [] };
  }
});
a.handle("write-data", (n, u) => {
  try {
    return t.writeFileSync(o, JSON.stringify(u, null, 2)), { success: !0 };
  } catch (c) {
    return console.error("Failed to write data:", c), { success: !1, error: c };
  }
});
a.handle("open-data-folder", () => {
  if (!t.existsSync(o))
    try {
      t.existsSync(e.dirname(o)) || t.mkdirSync(e.dirname(o), { recursive: !0 }), t.writeFileSync(o, JSON.stringify({ employees: [], products: [], materials: [], records: [] }, null, 2));
    } catch (n) {
      console.error("Failed to create initial data file", n);
    }
  f.showItemInFolder(o);
});
process.env.APP_ROOT = e.join(d, "..");
const i = process.env.VITE_DEV_SERVER_URL, S = e.join(process.env.APP_ROOT, "dist-electron"), p = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = i ? e.join(process.env.APP_ROOT, "public") : p;
let r;
function m() {
  r = new l({
    width: 1200,
    height: 900,
    icon: e.join(process.env.VITE_PUBLIC, "icon.png"),
    autoHideMenuBar: !0,
    webPreferences: {
      preload: e.join(d, "preload.mjs")
    }
  }), r.webContents.on("did-finish-load", () => {
    r == null || r.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), i ? r.loadURL(i) : r.loadFile(e.join(p, "index.html"));
}
s.on("window-all-closed", () => {
  process.platform !== "darwin" && (s.quit(), r = null);
});
s.on("activate", () => {
  l.getAllWindows().length === 0 && m();
});
s.whenReady().then(m);
export {
  S as MAIN_DIST,
  p as RENDERER_DIST,
  i as VITE_DEV_SERVER_URL
};
