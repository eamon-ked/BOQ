const { app, BrowserWindow } = require('electron');
const path = require('path');

// Start your Express backend as a child process
// Start your Express backend in the same process as Electron
require(path.join(__dirname, 'server', 'server.js'));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the React build output (served by Express or directly from file)
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Open DevTools for debugging
  //win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
