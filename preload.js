const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  showPrintPreview: () => ipcRenderer.invoke('show-print-preview'),
  showPdfPreview: () => ipcRenderer.invoke('show-pdf-preview'),
  saveAndOpenPdf: () => ipcRenderer.invoke('save-and-open-pdf'),
  
  // Add platform detection
  platform: process.platform,
  
  // Add version info
  versions: process.versions
});