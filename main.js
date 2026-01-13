const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const MEDIA_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".heic",
  ".mp4", ".mov", ".mkv"
];

// Recursively scan folder
function scanFolderRecursive(folderPath) {
  let files = [];

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanFolderRecursive(fullPath));
    } else if (MEDIA_EXTENSIONS.includes(path.extname(fullPath).toLowerCase())) {
      const stats = fs.statSync(fullPath);
      files.push({
        path: fullPath,
        mtime: stats.mtime.getTime()
      });
    }
  }

  return files;
}

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
  let files = scanFolderRecursive(folderPath);

  // Sort newest first
  files.sort((a, b) => b.mtime - a.mtime);
  return files;
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
