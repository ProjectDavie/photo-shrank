const {
  app,
  BrowserWindow
} = require("electron");

const path = require("path");

const {
  registerMetadataIPC
} = require("./ipc/metadata.ipc");

function createWindow() {

  const mainWindow =
    new BrowserWindow({

      width: 1400,
      height: 900,

      webPreferences: {

        preload: path.join(
          __dirname,
          "..",
          "preload",
          "preload.js"
        ),

        nodeIntegration: false,

        contextIsolation: true
      }
    });

  mainWindow.removeMenu();

  mainWindow.loadFile(
    path.join(
      __dirname,
      "..",
      "renderer",
      "index.html"
    )
  );

  // OPTIONAL:
   //mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {

  registerMetadataIPC();

  createWindow();

  app.on(
    "activate",
    () => {

      if (
        BrowserWindow
          .getAllWindows()
          .length === 0
      ) {
        createWindow();
      }
    }
  );
});

app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !== "darwin"
    ) {
      app.quit();
    }
  }
);