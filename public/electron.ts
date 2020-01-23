import { app, dialog, BrowserWindow, Menu, MenuItemConstructorOptions, ipcMain } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import { SHELL_CHANNEL_CODE, STDIN_CHANNEL_REPLY, STDIN_CHANNEL_REQUEST, KERNEL_INTERUPT_REQUEST, OPEN_PROJECT, KERNEL_STATUS } from '../src/constants/Channels';
import { KernelStatus } from '../src/constants/KernelStatus';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';

import { JupyterKernelClient, KernelConfig } from 'zmq_jupyter';

let mainWindow: any;
let kernelConnection: KernelConnection;

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
      kernelConnection.sendShellCode(args);
      // client.sendShellCommand(args, (data) => console.log(data))
    });
    ipcMain.addListener(STDIN_CHANNEL_REPLY, (event, args) => {
      kernelConnection.sendStdInReply(args);
      // client.sendStdinReply(args);
    });
    ipcMain.addListener(KERNEL_INTERUPT_REQUEST, (event) => {
      kernelConnection.sendIntterupt();
      // kernelProcess.kill('SIGINT');
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
  if (kernelConnection && !kernelConnection.isClosed()) {
    console.log('killing python process')
    kernelConnection.close();
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.addListener(OPEN_PROJECT, (event, args) => {
  if (kernelConnection) {
    kernelConnection.close();
  }

  kernelConnection = new KernelConnection(args.pythonPath, args.configPath);
});

class KernelConnection {
  kernelProcess: ChildProcess
  client: JupyterKernelClient

  heartbeatInterval: any;

  running: boolean;

  constructor(pythonPath: string, configPath: string) {
    const command = [
      pythonPath,
      "-m",
      "ipykernel_launcher",
      "-f",
      configPath,
    ].join(" ");
  
    this.kernelProcess = spawn(command, {shell: true});

    const config: KernelConfig = JSON.parse(fs.readFileSync(configPath).toString());
    this.client = new JupyterKernelClient(config);
     
    this.running = true;

    this.init();
    console.log('init-ed');
  }

  init() {
    this.kernelProcess.stdout.on('data', (data) => {
      console.log(data.toString('utf-8'));
    });

    this.kernelProcess.stderr.on('data', (data) => {
      console.log(data.toString('utf-8'));
    });

    this.client.getKernelInfo((data) =>  {
      if (this.running) {
        mainWindow.webContents.send("kernel_info", data);
      }
    });

    this.client.subscribeToIOLoop((data) => {
      if (this.running) {
        mainWindow.webContents.send("io_pub_channel", data)
      }
    });

    this.client.startSTDINLoop((data) => {
      if (this.running) {
        mainWindow.webContents.send(STDIN_CHANNEL_REQUEST, data);
      }
    });

    // this.heartbeatInterval = setInterval(() => {
    //   let done = false;
    //   let timeout = setTimeout(() => {
    //     if (done) {
    //       return;
    //     }
    //     mainWindow.webContents.send(KERNEL_STATUS, (KernelStatus.STOPPED));
    //     done = true;
    //   }, 1000);
    //   this.client.checkHeartbeat((data) => {
    //     if (done) {
    //       return;
    //     }
    //     mainWindow.webContents.send(KERNEL_STATUS, (KernelStatus.RUNNING));
    //     done = true;
    //     clearTimeout(timeout);
    //   });
    // }, 100);

    this.kernelProcess.on('exit', () => {
      this.disconnect();
    });
  
    this.kernelProcess.on('close', () => {
      this.disconnect();
    });
  }

  sendShellCode(args: any) {
    this.client.sendShellCommand(args, (data) => console.log(data))
  }

  sendStdInReply(args: any) {
    this.client.sendStdinReply(args);
  }

  sendIntterupt() {
    this.kernelProcess.kill("SIGINT");
  }

  isClosed() {
    return !this.running;
  }

  close() {
    this.kernelProcess.kill('SIGQUIT');
    this.disconnect();
  }

  disconnect() {
    this.running = false;
    // clearInterval(this.heartbeatInterval);
    this.client.stop();
    if (mainWindow) {
      // mainWindow.webContents.send(KERNEL_STATUS, KernelStatus.STOPPED);
    }
  }
}


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