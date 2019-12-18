import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';

import { JupyterKernelClient, KernelConfig } from 'zmq_jupyter';

const config: KernelConfig = {
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

let mainWindow: any;

const client = new JupyterKernelClient(config);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true
  }});

  mainWindow.webContents.once('dom-ready', () => {
    client.getKernelInfo();
    client.subscribeToIOLoop((data) => {
      mainWindow.webContents.send("shell_channel", data)
    });
  })
  

  

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on('closed', () => mainWindow = null);
}

app.once('ready', createWindow);

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