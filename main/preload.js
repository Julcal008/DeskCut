const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  message: (data) => ipcRenderer.send("message", data),
  installWine: (distro) => ipcRenderer.send("install-wine", distro),
  onInstallResult: (callback) => ipcRenderer.on("install-wine-result", (event, result) => callback(result)),
});
