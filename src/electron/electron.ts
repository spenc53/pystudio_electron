import { app, dialog, BrowserWindow, Menu, MenuItemConstructorOptions, ipcMain } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import { SHELL_CHANNEL_CODE, STDIN_CHANNEL_REPLY, STDIN_CHANNEL_REQUEST, KERNEL_INTERUPT_REQUEST, OPEN_PROJECT, KERNEL_STATUS, LOADING_PROJECT_CHANNEL, SHELL_CHANNEL_CODE_SILENT } from '../constants/Channels';
import { KernelStatus } from '../constants/KernelStatus';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';

import { JupyterKernelClient, KernelConfig } from 'zmq_jupyter';

const Store = require('electron-store');

// console.log = function(data: any){
//   // send to front end to log
//   mainWindow.webContents.send("log", data);
// };

let mainWindow: any;
let openWindow: any;
let kernelConnection: KernelConnection;

const storage = new Store();

function createMainWindow() {
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
    
  })

  mainWindow.loadURL(isDev ? 'http://localhost:3000?main' : `file://${path.join(__dirname, '../../index.html?main')}`);
  // if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    mainWindow.webContents.openDevTools();
  // }
  mainWindow.on('closed', () => {
    mainWindow = null
  });
}

function createOpenWindow() {
  openWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    },
    show: false
  });
  openWindow.once('ready-to-show', () => openWindow.show());
  openWindow.loadURL(isDev ? 'http://localhost:3000?open' : `file://${path.join(__dirname, '../../index.html?open')}`);
  // if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    openWindow.webContents.openDevTools();
  // }
  openWindow.on('closed', () => openWindow = null);
}

function startApp() {
  const projectPath = storage.get('projectPath');

  if (projectPath && validatePystudioProject(projectPath)) {
    startProject(projectPath);
    return;
  }
  createOpenWindow();
}

app.once('ready', startApp);

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
  // app should not be open without any active windows
});

ipcMain.addListener(SHELL_CHANNEL_CODE, (event, args) => {
  if (kernelConnection) {
    kernelConnection.sendShellCode(args);
  }
});

ipcMain.addListener(SHELL_CHANNEL_CODE_SILENT, (event, args) => {
  if (kernelConnection) {
    kernelConnection.sendShellCode(args, true);
  }
})

ipcMain.addListener(STDIN_CHANNEL_REPLY, (event, args) => {
  if (kernelConnection) {
    kernelConnection.sendStdInReply(args);
  }
});
ipcMain.addListener(KERNEL_INTERUPT_REQUEST, (event) => {
  if (kernelConnection) {
    kernelConnection.sendIntterupt();
  }
});

ipcMain.addListener('OPEN_PROJECT', (_, pathToProject) => {
  // persist project
  storage.set('projectPath', pathToProject);
  let recentProjects: string[] = storage.get('recentProjects');
  if (!recentProjects) {
    recentProjects = [];
  }

  let index = 0;
  while (index != -1) {
    index = recentProjects.indexOf(pathToProject)
    if (index == 0) {
      recentProjects = recentProjects.slice(1);
    } else if (index > 0) {
      recentProjects.splice(recentProjects.indexOf(pathToProject, 1));
    }
  }

  recentProjects.unshift(pathToProject);
  recentProjects = recentProjects.slice(0,10);
  storage.set('recentProjects', recentProjects);

  // openProject
  startProject(pathToProject);
})

function openPystudioProject() {
  const data = dialog.showOpenDialogSync({properties: ['openDirectory']});
  if (!data || data.length === 0) return;

  const pathToProject = data[0];

  if (!validatePystudioProject(pathToProject)) {
    // not a valid project, do not open
    // open dialog with error
    dialog.showErrorBox("Pystudio", pathToProject + " is not a valid Pystudio Project");
    return;
  }

  // persist project
  storage.set('projectPath', pathToProject);
  let recentProjects: string[] = storage.get('recentProjects');
  if (!recentProjects) {
    recentProjects = [];
  }

  let index = 0;
  while (index != -1) {
    index = recentProjects.indexOf(pathToProject)
    if (index == 0) {
      recentProjects = recentProjects.slice(1);
    } else if (index > 0) {
      recentProjects.splice(recentProjects.indexOf(pathToProject, 1));
    }
  }

  recentProjects.unshift(pathToProject);
  recentProjects = recentProjects.slice(0,10);
  storage.set('recentProjects', recentProjects);

  // openProject
  startProject(pathToProject);
}

function validatePystudioProject(pathToProject: string): boolean {
  // check for the config data file
  if (!fs.existsSync(pathToProject + "/.pystudio/config.json")) {
    console.log('not a pystudio project');
    return false;
  }

  // check if the env exists
  let configData = JSON.parse(fs.readFileSync(pathToProject + "/.pystudio/config.json").toString());
  let envFolder = configData['env_name'];
  if (!fs.existsSync(pathToProject + "/" + envFolder)) {
    console.log('no python env present')
    return false;
  }

  // project exists
  return true;
}

function startProject(pathToProject: string) {
  let configData = JSON.parse(fs.readFileSync(pathToProject + "/.pystudio/config.json").toString());
  let envFolder = configData['env_name'];
  const pythonPath = pathToProject + "/" + envFolder + "/bin/python";
  const configPath = pathToProject + "/.pystudio/ipython_config.json";

  if (!mainWindow) {
    console.log('here')
    createMainWindow();
  }

  if (kernelConnection && !kernelConnection.isClosed()) {
    kernelConnection.close();
  }
  kernelConnection = new KernelConnection(pythonPath, configPath);

  if (openWindow) {
    openWindow.close();
    openWindow = null;
  }
}

function closeProject() {
  if (kernelConnection && !kernelConnection.isClosed()) {
    kernelConnection.close();
  }

  storage.delete('projectPath');

  if(!openWindow) {
    createOpenWindow();
  }

  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
}

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
  }

  init() {
    this?.kernelProcess?.stdout?.on('data', (data) => {
      console.log(data.toString('utf-8'));
    });

    this?.kernelProcess?.stderr?.on('data', (data) => {
      console.log(data.toString('utf-8'));
    });

    this.client.getKernelInfo((data) =>  {
      if (this.running) {
        mainWindow.webContents.send("kernel_info", data);
      }
    });

    this.client.sendShellCommand("%matplotlib inline", (data) => { // send this silently

    }, true);

    this.client.sendShellCommand(`
    def _publish_local_vars():
      import json as _json
      def _is_jsonable(x):
        try:
          _json.dumps(x)
          return True
        except:
          return False
              
      _user_ns = get_ipython().user_ns
      _user_ns_hidden = get_ipython().user_ns_hidden
      
      _nonmatching = object()  # This can never be in user_ns
      _out = [ i for i in _user_ns
              if not i.startswith('_') 
              and (_user_ns[i] is not _user_ns_hidden.get(i, _nonmatching))]
      
      _types = [type(globals()[x]) for x in _out]
      
      _vars = dict(zip(_out, [globals()[x] if _is_jsonable(globals()[x]) else str(type(globals()[x])) for x in _out]))
      
      get_ipython().display_pub.publish({'application/json': _vars})
    `, (data) => {

    }, true);

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

    mainWindow.webContents.send(KERNEL_STATUS, (KernelStatus.RUNNING));

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

  sendShellCode(args: any, silent: boolean = false) {
    this.client.sendShellCommand(args, (data) => console.log(data), silent)
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
    // send the client an exit command instead of the sigquit otherwise it will see it as python crashing, which isn't good
    this.kernelProcess.kill('SIGQUIT');
    this.disconnect();
  }

  disconnect() {
    if (mainWindow && this.running) {
      mainWindow.webContents.send(KERNEL_STATUS, KernelStatus.STOPPED);
    }
    this.running = false;
    console.log('STOPPED');
    this.client.stop();
  }
}


const template: MenuItemConstructorOptions[] = [
  {
    label: "File",
    submenu: [
      {
        label: 'Open Project',
        click() {
          openPystudioProject();
        }
      },
      {
        label: 'Close Project',
        click() {
          closeProject();
        }
      },
      {
        label: 'New Project',
        click() {
          // TODO: write custom new Project dialog
          const dirs = dialog.showOpenDialogSync({ properties: ['openDirectory']});
          
          if (!dirs || dirs.length === 0) {
            return;
          }

          const dir = dirs[0];

          if (fs.existsSync(dir + "/" + ".pystudio")) {
            dialog.showErrorBox("Project already exists", "A project already exists in this folder. Try opening it instead")
            return;
          }
          
          // show parent modal
          // can set parent so, we can set the parent to be the main or the openview
          const setupPromise = new Promise(async (resolve, reject) => {
            mainWindow.webContents.send(LOADING_PROJECT_CHANNEL, {
              message: 'Creating new Project',
              isError: false,
              isDone: false
            });

            // initialize it
            fs.mkdirSync(dir + "/" + ".pystudio")
            fs.writeFileSync(dir + "/" + ".pystudio/config.json", JSON.stringify(config));
            fs.writeFileSync(dir + "/" + ".pystudio/ipython_config.json", JSON.stringify(pykernelConfig)); 

            const envSetupProcess = spawn("python3", ["-m", "venv", dir + "/" + "env"]);
            envSetupProcess.on('error', () => {
              reject('Could not setup python process');
            });

            envSetupProcess.on('exit', (code: number) => {
              if (code !== 0) {
                reject('Non zero exit: ' + code);
                return;
              } 

              const envInstall = spawn(dir + "/" + "env/bin/pip", ["install", "ipykernel", "matplotlib"]);
              envInstall.on('error', () => {
                reject('Could not setup python process');
              });

              envInstall.on('exit', (code: number) => {
                if (code !== 0) {
                  reject('Non zero exit: ' + code);
                  return;
                }
                resolve('');
              });
            })
          });

          setupPromise.then((value: any) => {
            // call the open project command
            mainWindow.webContents.send(OPEN_PROJECT, dir);
          });

          setupPromise.catch((error: any) => {
            console.log(error);
            mainWindow.webContents.send(LOADING_PROJECT_CHANNEL, {
              message: "Error creating python project",
              isDone: true,
              isError: true
            })
            dialog.showErrorBox("Python Error", "Error making python virutal env")
          });
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


const config = {
  "env_name": "env",
  "config_name": "ipython_config"
}

const pykernelConfig = {
  "shell_port": 53794,
  "iopub_port": 53795,
  "stdin_port": 53796,
  "control_port": 53797,
  "hb_port": 53798,
  "ip": "127.0.0.1",
  "key": "",
  "transport": "tcp",
  "signature_scheme": "hmac-sha256",
  "kernel_name": ""
}