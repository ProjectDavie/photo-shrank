const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoMigrateFolder } = require("./metadata");

app.commandLine.appendSwitch("disable-breakpad");

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
    } else {
      const stats = fs.statSync(fullPath);

      files.push({
        path: fullPath,
        name: entry.name.toLowerCase(),
        mtime: stats.mtime.getTime()
      });
    }
  }

  // SORT BY NAME (core requirement)
  return files.sort((a, b) => a.name.localeCompare(b.name));
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
  // STEP 1: MIGRATE FIRST
  autoMigrateFolder(folderPath);

  // STEP 2: SCAN AFTER RENAMING
  let files = scanFolderRecursive(folderPath);

  files.sort((a, b) => a.name.localeCompare(b.name));

  return files;
});

ipcMain.handle("read-json-file", async (_, filePath) => {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
