const { ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

function registerFolderIPC() {

  ipcMain.handle(
    "folder:select",
    async () => {

      const result =
        await dialog.showOpenDialog({
          properties: ["openDirectory"]
        });

      if (
        result.canceled ||
        result.filePaths.length === 0
      ) {
        return null;
      }

      return result.filePaths[0];
    }
  );

  ipcMain.handle(
    "scan-folder",
    async (_, folderPath) => {

      try {

        const files =
          fs.readdirSync(folderPath);

        const mediaExtensions = [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".webp",
          ".mp4",
          ".mov",
          ".avi",
          ".mkv",
          ".webm"
        ];

        const allFiles = files
          .map(file => {

            const fullPath =
              path.join(folderPath, file);

            const stats =
              fs.statSync(fullPath);

            return {
              name: file,
              path: fullPath,
              isDirectory:
                stats.isDirectory(),
              extension:
                path.extname(file)
                  .toLowerCase(),
              type:
                mediaExtensions.includes(
                  path.extname(file)
                    .toLowerCase()
                )
                  ? "media"
                  : "other"
            };
          });

        return allFiles;

      } catch (error) {

        console.error(
          "scan-folder failed:",
          error
        );

        return [];
      }
    }
  );
}

module.exports = {
  registerFolderIPC
};