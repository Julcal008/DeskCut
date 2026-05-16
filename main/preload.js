const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  message: (data) => ipcRenderer.send("message", data),
  installWine: (payload) => ipcRenderer.send("install-wine", payload),
  onInstallResult: (callback) => ipcRenderer.on("install-wine-result", (event, result) => callback(result)),
  openWineCfg: () => ipcRenderer.send("open-winecfg"),
  onOpenWineCfgResult: (callback) => ipcRenderer.on("open-winecfg-result", (event, result) => callback(result)),
});
