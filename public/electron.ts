const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const isDev = require('electron-is-dev');

const { JupyterKernelClient } = require('zmq_jupyter');

const { ipcMain } = require('electron')

const config = {
  shell_port: "53794",
  iopub_port: "53795",
  stdin_port: "53796",
  control_port: "53797",
  hb_port: "53798",
  key: "",
  ip: "127.0.0.1",
  transport: "tcp",
  signature_scheme: "",
  kernel_name: ""
}

let mainWindow;

const client = new JupyterKernelClient(config);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true
  }});

  // mainWindow.webContents.once('dom-ready', () => {
  //   console.log('here')
  //   client.getKernelInfo();
  //   client.subscribeToIOLoop((data) => {
  //     const client = new JupyterKernelClient(config);
  //     client.getKernelInfo();
  //     client.subscribeToIOLoop((data) => {
  //       mainWindow.webContents.send("shell_channel", data)
  //     })
  //   });
  // })
  

  

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on('closed', () => mainWindow = null);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});