const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const MEDIA_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".heic",
  ".mp4", ".mov", ".mkv"
];

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false
    }
  });

  win.loadFile("index.html");
}

ipcMain.handle("open-folder-dialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle("scan-folder", async (_, folderPath) => {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  const files = entries
    .filter(e => e.isFile())
    .map(e => {
      const fullPath = path.join(folderPath, e.name);
      const stats = fs.statSync(fullPath);
      return {
        path: fullPath,
        mtime: stats.mtime.getTime()
      };
    })
    .filter(file =>
      MEDIA_EXTENSIONS.includes(path.extname(file.path).toLowerCase())
    )
    // Sort newest first
    .sort((a, b) => b.mtime - a.mtime);

  return files;
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
