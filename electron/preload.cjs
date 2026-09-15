// Ponte segura renderer <-> main (modo rede local do anfitrião).
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("unicfilmLan", {
  hostStart: () => ipcRenderer.invoke("lan-host-start"),
  hostStop: () => ipcRenderer.invoke("lan-host-stop"),
  hostStatus: () => ipcRenderer.invoke("lan-host-status"),
  hostRegenPin: () => ipcRenderer.invoke("lan-host-regen-pin"),
});
