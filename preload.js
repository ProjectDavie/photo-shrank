const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  openFolder: () => ipcRenderer.invoke("open-folder-dialog"),
  scanFolder: (folderPath) => ipcRenderer.invoke("scan-folder", folderPath),
  readJsonFile: (filePath) => ipcRenderer.invoke("read-json-file", filePath)
});
