const { ipcMain, dialog } = require("electron");

const {
  loadMetadata,
  saveMetadata,
  addTags,
  addPeople,
  autoMigrateFolder
} = require("../../main/services/metadata");

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
}

module.exports = {
  registerMetadataIPC
};