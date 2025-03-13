const { app, BrowserWindow } = require('electron');
const path = require('path');

// Lancement du serveur (Express + Socket.io)
require('./server.js');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  });
  win.loadURL('http://localhost:8081'); 
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});