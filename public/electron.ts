import { app, dialog, BrowserWindow, Menu, MenuItemConstructorOptions, ipcMain } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import { SHELL_CHANNEL_CODE, STDIN_CHANNEL_REPLY, STDIN_CHANNEL_REQUEST, KERNEL_INTERUPT_REQUEST, OPEN_PROJECT } from '../src/constants/Channels';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';

import { JupyterKernelClient, KernelConfig } from 'zmq_jupyter';

let mainWindow: any;
let kernelProcess: ChildProcess;
let client: JupyterKernelClient = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    },
    show: false
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.once('dom-ready', () => {
    ipcMain.addListener(SHELL_CHANNEL_CODE, (event, args) => {
      client.sendShellCommand(args, (data) => console.log(data))
    });
    ipcMain.addListener(STDIN_CHANNEL_REPLY, (event, args) => {
      console.log("std in sent");
      console.log(args);
      client.sendStdinReply(args);
    });
    ipcMain.addListener(KERNEL_INTERUPT_REQUEST, (event) => {
      console.log("kernel interrupt request sent!")
      kernelProcess.kill('SIGINT');
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
  // if (process.platform !== 'darwin') {
    app.quit();
  // }
});

app.on('quit', () => {
  if (kernelProcess != null) {
    console.log('killing python process')
    kernelProcess.kill('SIGQUIT');
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.addListener(OPEN_PROJECT, (event, args) => {
  if (kernelProcess != null) {
    console.log('killing python process')
    kernelProcess.kill('SIGQUIT');
  }

  // TODO: make read this command from a config file
  const command = [
    args.pythonPath,
    "-m",
    "ipykernel_launcher",
    "-f",
    args.configPath,
  ].join(" ");

  const config: KernelConfig = JSON.parse(fs.readFileSync(args.configPath).toString());

  kernelProcess = spawn(command, {shell: true});
  kernelProcess.stdout.on('data', (data) => {
    if (client == null) {
      client = new JupyterKernelClient(config);
      client.getKernelInfo((data) => {
        mainWindow.webContents.send("kernel_info", data);
      });
      client.subscribeToIOLoop((data) => {
        mainWindow.webContents.send("io_pub_channel", data)
      });
      client.startSTDINLoop((data) => {
        mainWindow.webContents.send(STDIN_CHANNEL_REQUEST, data);
      });
    }
  });

  kernelProcess.stderr.on('data', (data) => {
    console.log(data.toString('utf-8'));
  })
});


const template: MenuItemConstructorOptions[] = [
  {
    label: "file",
    submenu: [
      {
        label: 'Open Project',
        click() {
          mainWindow.webContents.send(OPEN_PROJECT)
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'delete'},
      {type: 'separator'},
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