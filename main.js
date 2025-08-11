const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Set app user model ID for Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.nokael.boqbuilder');
}

// Start the Express backend server
let serverProcess;
try {
  serverProcess = require(path.join(__dirname, 'server', 'server.js'));
  console.log('Backend server started successfully');
} catch (error) {
  console.error('Failed to start backend server:', error);
}

function createWindow() {
  // Create the browser window
  let win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false, // Don't show until ready
    titleBarStyle: 'default'
  });

  // Load the React build output
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    win.loadFile(indexPath);
  } else {
    // Fallback for development
    win.loadURL('http://localhost:5173');
  }

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show();
    
    // Focus on the window
    if (process.platform === 'darwin') {
      win.focus();
    }
  });

  // Handle external links
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }

  // Handle window closed
  win.on('closed', () => {
    // Dereference the window object
    win = null;
  });

  // Handle window close event (before closing)
  win.on('close', (event) => {
    // Perform any cleanup here if needed
    // For now, just allow the window to close normally
  });

  return win;
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Send message to renderer process
            BrowserWindow.getFocusedWindow()?.webContents.send('menu-new-project');
          }
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('menu-open-project');
          }
        },
        { type: 'separator' },
        {
          label: 'Export BOQ',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('menu-export-boq');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Add Items',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('menu-add-items');
          }
        },
        {
          label: 'Manage Database',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('menu-manage-database');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'F1',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('menu-shortcuts');
          }
        },
        {
          label: 'About BOQ Builder',
          click: () => {
            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
              type: 'info',
              title: 'About BOQ Builder',
              message: 'BOQ Builder',
              detail: `Version: ${app.getVersion()}\nA professional Bill of Quantities generator\n\nCopyright © 2024 Nokael`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  // Clean up server process if needed
  try {
    if (serverProcess && typeof serverProcess.close === 'function') {
      serverProcess.close();
    }
  } catch (error) {
    console.log('Server cleanup completed');
  }
});

// Handle app quit
app.on('will-quit', (event) => {
  // Final cleanup before quitting
  try {
    // Any final cleanup can go here
  } catch (error) {
    console.log('App cleanup completed');
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('https://localhost') || url.startsWith('https://127.0.0.1')) {
    // Allow localhost certificates in development
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
