// const { app, BrowserWindow,ipcMain } = require('electron');
// const path = require('path');
// const { spawn } = require('child_process');

// function createWindow() {
//   const win = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//   });

//   if (process.env.NODE_ENV === 'development') {
//     win.loadURL("http://localhost:5173");
//   } else {
//     win.loadFile(path.join(__dirname, "frontend", "dist", "index.html"));
//   }
// }

// app.whenReady().then(() => {
//   // Start backend (server.js must point to your DB file)
//   spawn("node", ["backend/server.js"], { stdio: "inherit" });

//   createWindow();
// });
// ipcMain.handle("print-preview", async () => {
//   try {
//     const pdfData = await mainWindow.webContents.printToPDF({ printBackground: true });

//     const pdfPath = path.join(app.getPath("temp"), "print-preview.pdf");
//     fs.writeFileSync(pdfPath, pdfData);

//     let previewWin = new BrowserWindow({ width: 900, height: 700 });
//     previewWin.loadURL(`file://${pdfPath}`); // Chromium can render PDFs directly

//     return { success: true };
//   } catch (err) {
//     console.error("Error generating PDF preview:", err);
//     return { success: false, error: err.message };
//   }
// });
// const { app, BrowserWindow, ipcMain } = require("electron");
// const path = require("path");
// const fs = require("fs");
// const { spawn } = require("child_process");

// let mainWindow;
// let backendProcess = null;

// const isDev = process.env.NODE_ENV === 'development';

// function getResourcePath(relativePath) {
//   if (isDev) {
//     return path.join(__dirname, relativePath);
//   } else {
//     // Try different possible paths for production
//     const possiblePaths = [
//       path.join(process.resourcesPath, 'app', relativePath),
//       path.join(app.getAppPath(), relativePath),
//       path.join(__dirname, relativePath),
//       path.join(process.cwd(), relativePath)
//     ];
    
//     for (const testPath of possiblePaths) {
//       if (fs.existsSync(testPath)) {
//         console.log(`Found resource at: ${testPath}`);
//         return testPath;
//       }
//     }
    
//     console.error(`Resource not found: ${relativePath}`);
//     console.log('Tried paths:', possiblePaths);
//     return possiblePaths[0]; // fallback to first option
//   }
// }

// function startBackend() {
//   try {
//     const backendDir = getResourcePath('backend');
//     const serverPath = path.join(backendDir, 'server.js');
    
//     console.log('Backend directory:', backendDir);
//     console.log('Server path:', serverPath);
    
//     // Check if backend directory and server file exist
//     if (!fs.existsSync(backendDir)) {
//       console.error('Backend directory not found:', backendDir);
//       return;
//     }
    
//     if (!fs.existsSync(serverPath)) {
//       console.error('Server file not found:', serverPath);
//       return;
//     }
    
//     // Check if routes directory exists
//     const routesDir = path.join(backendDir, 'routes');
//     if (!fs.existsSync(routesDir)) {
//       console.error('Routes directory not found:', routesDir);
//     }

//     console.log('Starting backend server...');
    
//     // Start backend with correct working directory
//     backendProcess = spawn('node', ['server.js'], {
//       cwd: backendDir, // Important: set working directory to backend folder
//       stdio: ['inherit', 'pipe', 'pipe'], // capture stdout and stderr
//       env: {
//         ...process.env,
//         NODE_ENV: isDev ? 'development' : 'production'
//       }
//     });

//     // Log backend output
//     backendProcess.stdout.on('data', (data) => {
//       console.log('Backend stdout:', data.toString());
//     });

//     backendProcess.stderr.on('data', (data) => {
//       console.error('Backend stderr:', data.toString());
//     });

//     backendProcess.on('error', (error) => {
//       console.error('Failed to start backend:', error);
//     });

//     backendProcess.on('close', (code) => {
//       console.log(`Backend process exited with code ${code}`);
//       backendProcess = null;
//     });

//     // Give backend time to start
//     setTimeout(() => {
//       console.log('Backend should be running now');
//     }, 2000);

//   } catch (error) {
//     console.error('Error starting backend:', error);
//   }
// }

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       preload: getResourcePath('preload.js'),
//     },
//   });

//   if (isDev) {
//     mainWindow.loadURL("http://localhost:5173");
//     mainWindow.webContents.openDevTools();
//   } else {
//     const indexPath = getResourcePath(path.join("frontend", "dist", "index.html"));
//     console.log('Loading frontend from:', indexPath);
//     mainWindow.loadFile(indexPath);
//   }

//   mainWindow.webContents.once('did-finish-load', () => {
//     console.log('Main window finished loading');
//   });
// }

// app.whenReady().then(() => {
//   console.log('App is ready');
//   console.log('isDev:', isDev);
//   console.log('__dirname:', __dirname);
//   console.log('process.cwd():', process.cwd());
//   console.log('app.getAppPath():', app.getAppPath());
//   console.log('process.resourcesPath:', process.resourcesPath);
  
//   startBackend();
  
//   // Wait a bit for backend to start, then create window
//   setTimeout(() => {
//     createWindow();
//   }, 3000);
// });

// // Clean shutdown
// app.on('window-all-closed', () => {
//   console.log('All windows closed');
//   if (backendProcess) {
//     console.log('Killing backend process');
//     backendProcess.kill('SIGTERM');
//     setTimeout(() => {
//       if (backendProcess) {
//         backendProcess.kill('SIGKILL');
//       }
//     }, 5000);
//   }
  
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });

// app.on('before-quit', () => {
//   console.log('App is quitting');
//   if (backendProcess) {
//     backendProcess.kill('SIGTERM');
//   }
// });

// // Print handlers remain the same
// ipcMain.handle("show-print-preview", async () => {
//   try {
//     console.log('show-print-preview called');
//     mainWindow.webContents.print({
//       silent: false,
//       printBackground: true,
//       margins: { marginType: 'printableArea' }
//     });
//     return { success: true };
//   } catch (err) {
//     console.error("Error showing print preview:", err);
//     return { success: false, error: err.message };
//   }
// });

// ipcMain.handle("show-pdf-preview", async () => {
//   try {
//     console.log('show-pdf-preview called');
    
//     await mainWindow.webContents.executeJavaScript('document.readyState');
    
//     const pdfData = await mainWindow.webContents.printToPDF({ 
//       printBackground: true,
//       pageSize: 'A4',
//       margins: { marginType: 'minimum' }
//     });

//     const tempDir = app.getPath('temp');
//     const pdfPath = path.join(tempDir, `invoice-preview-${Date.now()}.pdf`);
//     fs.writeFileSync(pdfPath, pdfData);
    
//     console.log('PDF created at:', pdfPath);

//     let previewWin = new BrowserWindow({ 
//       width: 900, 
//       height: 700,
//       webPreferences: {
//         nodeIntegration: false,
//         contextIsolation: true,
//         webSecurity: false
//       },
//       title: 'Print Preview'
//     });
    
//     previewWin.loadFile(pdfPath);
    
//     previewWin.on('closed', () => {
//       try {
//         if (fs.existsSync(pdfPath)) {
//           fs.unlinkSync(pdfPath);
//           console.log('Cleaned up temp PDF file');
//         }
//       } catch (cleanupError) {
//         console.error('Error cleaning up temp file:', cleanupError);
//       }
//     });

//     previewWin.show();
//     return { success: true };
//   } catch (err) {
//     console.error("Error generating PDF preview:", err);
//     return { success: false, error: err.message };
//   }
// });
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Option 1: Use preload (more secure) - only if preload.js exists
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      
      // Option 2: If preload doesn't work, uncomment these (less secure)
      // nodeIntegration: true,
      // contextIsolation: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    // Open DevTools in development to see console logs
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "frontend", "dist", "index.html"));
  }

  // Debug: Log when window is ready
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Main window finished loading');
  });
}

app.whenReady().then(() => {
  spawn("node", ["backend/server.js"], { stdio: "inherit" });
  createWindow();
});

// Handle window closed
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

// Method 1: Print with system dialog (recommended)
ipcMain.handle("show-print-preview", async () => {
  try {
    console.log('show-print-preview called');
    
    // Show Electron's print dialog with preview
    mainWindow.webContents.print({
      silent: false,        // Show print dialog (this gives preview)
      printBackground: true,
      margins: {
        marginType: 'printableArea'
      }
    });
    
    return { success: true };
  } catch (err) {
    console.error("Error showing print preview:", err);
    return { success: false, error: err.message };
  }
});

// Method 2: Generate PDF and show in new window (FIXED VERSION)
ipcMain.handle("show-pdf-preview", async () => {
  try {
    console.log('show-pdf-preview called');

    // Wait for the page to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate PDF
    const pdfData = await mainWindow.webContents.printToPDF({ 
      printBackground: true,
      pageSize: 'A4',
      margins: { 
        marginType: 'minimum'
      },
      landscape: false,
      preferCSSPageSize: false
    });

    // Create temp directory if it doesn't exist
    const tempDir = app.getPath('temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save to temp with proper path handling
    const timestamp = Date.now();
    const pdfFileName = `invoice-preview-${timestamp}.pdf`;
    const pdfPath = path.join(tempDir, pdfFileName);
    
    console.log('Saving PDF to:', pdfPath);
    fs.writeFileSync(pdfPath, pdfData);

    // Verify file was created
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF file was not created successfully');
    }

    console.log('PDF created successfully at:', pdfPath);

    // Create preview window
    let previewWin = new BrowserWindow({
      width: 900,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        plugins: true // Enable PDF plugin
      },
      title: 'Invoice Preview - PDF',
      show: false, // Don't show until ready
      autoHideMenuBar: true
    });

    // Handle window ready
    previewWin.once('ready-to-show', () => {
      console.log('PDF preview window ready to show');
      previewWin.show();
      previewWin.focus();
    });

    // Handle load errors
    previewWin.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('PDF preview failed to load:', errorCode, errorDescription);
      // Fallback: open with system default PDF viewer
      shell.openPath(pdfPath);
      previewWin.close();
    });

    // Load the PDF - use proper file URL encoding
    const fileUrl = `file://${pdfPath.replace(/\\/g, '/')}`;
    console.log('Loading PDF URL:', fileUrl);
    
    // Try loading the PDF
    try {
      await previewWin.loadURL(fileUrl);
    } catch (loadError) {
      console.error('Error loading PDF in window:', loadError);
      // Fallback: open with system default PDF viewer
      console.log('Falling back to system PDF viewer');
      shell.openPath(pdfPath);
      previewWin.close();
      return { success: true, fallback: true };
    }

    // Cleanup when window closes
    previewWin.on('closed', () => {
      console.log('PDF preview window closed, cleaning up...');
      try {
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
          console.log('Cleaned up temp PDF file');
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    });

    // Add menu for print option
    previewWin.webContents.once('dom-ready', () => {
      previewWin.webContents.executeJavaScript(`
        document.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            window.print();
          }
        });
      `);
    });

    return { success: true };
  } catch (err) {
    console.error("Error generating PDF preview:", err);
    return { success: false, error: err.message };
  }
});

// Alternative method: Save PDF to Downloads and open with system viewer
ipcMain.handle("save-and-open-pdf", async () => {
  try {
    console.log('save-and-open-pdf called');

    const pdfData = await mainWindow.webContents.printToPDF({ 
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'minimum' }
    });

    // Save to Downloads folder
    const downloadsPath = app.getPath('downloads');
    const pdfPath = path.join(downloadsPath, `invoice-${Date.now()}.pdf`);
    
    fs.writeFileSync(pdfPath, pdfData);
    console.log('PDF saved to:', pdfPath);

    // Open with system default PDF viewer
    shell.openPath(pdfPath);

    return { success: true, path: pdfPath };
  } catch (err) {
    console.error("Error saving PDF:", err);
    return { success: false, error: err.message };
  }
});