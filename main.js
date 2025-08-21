const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let serverProcess = null;
let serverReady = false;

// Start Express server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Express server...');
    console.log('Server path:', path.join(__dirname, 'server', 'server.js'));
    console.log('Current working directory:', process.cwd());
    console.log('__dirname:', __dirname);
    
    try {
      // Try to start server in the same process
      require(path.join(__dirname, 'server', 'server.js'));
      console.log('Express server started successfully in main process');
      serverReady = true;
      
      // Give the server a moment to start listening
      setTimeout(() => {
        resolve();
      }, 1000);
    } catch (error) {
      console.error('Failed to start Express server in main process:', error);
      console.error('Error details:', error.stack);
      reject(error);
    }
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Start server and wait for it to be ready
  try {
    if (!serverReady) {
      await startServer();
    }
    
    // Wait a moment for server to fully initialize
    setTimeout(() => {
      win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }, 2000);
  } catch (error) {
    console.error('Server failed to start, loading app anyway:', error);
    // Load the app even if server fails, but show an error
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Open DevTools for debugging in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Clean up server process if it exists
  if (serverProcess) {
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle app quit
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
