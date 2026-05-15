const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  message: (data) => ipcRenderer.send("message", data),
  installWine: (payload) => ipcRenderer.send("install-wine", payload),
  onInstallResult: (callback) => ipcRenderer.on("install-wine-result", (event, result) => callback(result)),
});
