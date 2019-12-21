import { app, BrowserWindow, Menu, MenuItemConstructorOptions, ipcMain } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import { SHELL_CHANNEL_CODE, STDIN_CHANNEL_REPLY, STDIN_CHANNEL_REQUEST } from '../src/constants/Channels';

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

const client = new JupyterKernelClient(config);
client.setVerbose(true);

let mainWindow: any;


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true
    },
    show: false
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.once('dom-ready', () => {
    ipcMain.addListener(SHELL_CHANNEL_CODE, (event, args) => {
      client.sendShellCommand(args, (data) => console.log(data))
    });
    ipcMain.addListener(STDIN_CHANNEL_REPLY, (event, args) => {
      // client.sendShellCommand
    })
    
    client.getKernelInfo((data) => {
      mainWindow.webContents.send("kernel_info", data);
    });
    client.subscribeToIOLoop((data) => {
      mainWindow.webContents.send("io_pub_channel", data)
    });
    client.startSTDINLoop((data) => {
      mainWindow.webContents.send(STDIN_CHANNEL_REQUEST, data);
    })
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


const template: MenuItemConstructorOptions[] = [
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      // {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      // {role: 'selectall'},
      {type: 'separator'},
      // {
      //   label: 'Speech',
      //   submenu: [
      //     {role: 'startspeaking'},
      //     {role: 'stopspeaking'}
      //   ]
      // }
    ]
  },
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      // {role: 'forcereload'},
      // {role: 'toggledevtools'},
      // {type: 'separator'},
      // {role: 'resetzoom'},
      // {role: 'zoomin'},
      // {role: 'zoomout'},
      {type: 'separator'},
      // {
      //   role: 'togglefullscreen',
      //   enabled: false,
      // }
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'minimize'},
      {role: 'close'}
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click() { require('electron').shell.openExternal('https://electronjs.org') }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  template.unshift({
    label: app.name,
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      // {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  })

  // Window menu
  template[3].submenu = [
    {role: 'close'},
    {role: 'minimize'},
    {role: 'zoom'},
    {type: 'separator'},
    {role: 'front'}
  ]
}

Menu.setApplicationMenu(Menu.buildFromTemplate(template));