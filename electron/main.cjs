const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const { startLanHost, stopLanHost, getLanStatus, regenLanPin } = require("./lan-host.cjs");

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: "Unicfilm Creative Hub",
    backgroundColor: "#0a0a0a",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  window.loadFile(path.join(__dirname, "../dist/index.html"));
}

ipcMain.handle("lan-host-start", () => startLanHost(app.getPath("userData")));
ipcMain.handle("lan-host-stop", () => stopLanHost());
ipcMain.handle("lan-host-status", () => getLanStatus());
ipcMain.handle("lan-host-regen-pin", () => regenLanPin());

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
