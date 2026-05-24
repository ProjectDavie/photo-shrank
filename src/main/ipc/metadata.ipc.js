const { ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

const {
  loadMetadata,
  saveMetadata,
  addTags,
  addPeople,
  autoMigrateFolder
} = require("../services/metadata");

const MEDIA_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".mp4",
  ".mov",
  ".mkv"
]);

function scanFolderRecursive(folderPath) {
  let files = [];

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(scanFolderRecursive(fullPath));
      continue;
    }

    files.push({ path: fullPath, name: entry.name.toLowerCase() });
  }

  return files.sort((a, b) => a.name.localeCompare(b.name));
}

function registerMetadataIPC() {

  ipcMain.handle(
    "metadata:load",
    async (_, mediaPath) => {
      return loadMetadata(mediaPath);
    }
  );

  ipcMain.handle(
    "metadata:add-tags",
    async (_, mediaPath, tags) => {
      return addTags(mediaPath, tags);
    }
  );

  ipcMain.handle(
    "metadata:add-people",
    async (_, mediaPath, people) => {
      return addPeople(mediaPath, people);
    }
  );

  ipcMain.handle(
    "metadata:save",
    async (_, mediaPath, metadata) => {
      return saveMetadata(mediaPath, metadata);
    }
  );

  ipcMain.handle(
    "folder:migrate",
    async (_, folderPath) => {
      return autoMigrateFolder(folderPath);
    }
  );

  ipcMain.handle(
    "folder:select",
    async () => {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"]
      });

      if (result.canceled) return null;

      return result.filePaths[0];
    }
  );

  ipcMain.handle(
    "open-folder-dialog",
    async () => {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"]
      });

      if (result.canceled) return null;

      return result.filePaths[0];
    }
  );

  ipcMain.handle(
    "scan-folder",
    async (_, folderPath) => {
      return scanFolderRecursive(folderPath);
    }
  );

  ipcMain.handle(
    "metadata:read",
    async (_, filePath) => {
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        return JSON.parse(raw);
      } catch (err) {
        return null;
      }
    }
  );
}

module.exports = {
  registerMetadataIPC
};