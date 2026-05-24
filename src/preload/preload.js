const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {

  folder: {
    open: () =>
      ipcRenderer.invoke("open-folder-dialog"),

    scan: (folderPath) =>
      ipcRenderer.invoke("scan-folder", folderPath)
  },

  metadata: {
    read: (filePath) =>
      ipcRenderer.invoke(
        "metadata:read",
        filePath
      ),

    load: (mediaPath) =>
      ipcRenderer.invoke(
        "metadata:load",
        mediaPath
      ),

    save: (mediaPath, metadata) =>
      ipcRenderer.invoke(
        "metadata:save",
        mediaPath,
        metadata
      ),

    addTags: (mediaPath, tags) =>
      ipcRenderer.invoke(
        "metadata:add-tags",
        mediaPath,
        tags
      ),

    addPeople: (mediaPath, people) =>
      ipcRenderer.invoke(
        "metadata:add-people",
        mediaPath,
        people
      )
  },

  migration: {
    autoRename: (folderPath) =>
      ipcRenderer.invoke(
        "migration:auto-rename",
        folderPath
      )
  }
});