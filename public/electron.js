"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var electron_1 = require("electron");
var path = require("path");
var isDev = require("electron-is-dev");
var Channels_1 = require("../src/constants/Channels");
var KernelStatus_1 = require("../src/constants/KernelStatus");
var child_process_1 = require("child_process");
var fs = require("fs");
var zmq_jupyter_1 = require("zmq_jupyter");
var mainWindow;
var kernelConnection;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 900,
        height: 680,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true
        },
        show: false
    });
    mainWindow.once('ready-to-show', function () { return mainWindow.show(); });
    mainWindow.webContents.once('dom-ready', function () {
        electron_1.ipcMain.addListener(Channels_1.SHELL_CHANNEL_CODE, function (event, args) {
            kernelConnection.sendShellCode(args);
            // client.sendShellCommand(args, (data) => console.log(data))
        });
        electron_1.ipcMain.addListener(Channels_1.STDIN_CHANNEL_REPLY, function (event, args) {
            kernelConnection.sendStdInReply(args);
            // client.sendStdinReply(args);
        });
        electron_1.ipcMain.addListener(Channels_1.KERNEL_INTERUPT_REQUEST, function (event) {
            kernelConnection.sendIntterupt();
            // kernelProcess.kill('SIGINT');
        });
    });
    mainWindow.loadURL(isDev ? 'http://localhost:3000' : "file://" + path.join(__dirname, '../build/index.html'));
    if (isDev) {
        // Open the DevTools.
        //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', function () { return mainWindow = null; });
}
electron_1.app.once('ready', createWindow);
electron_1.app.on('window-all-closed', function () {
    // if (process.platform !== 'darwin') {
    electron_1.app.quit();
    // }
});
electron_1.app.on('quit', function () {
    if (kernelConnection && !kernelConnection.isClosed()) {
        console.log('killing python process');
        kernelConnection.close();
    }
});
electron_1.app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
electron_1.ipcMain.addListener(Channels_1.OPEN_PROJECT, function (event, args) {
    if (kernelConnection && !kernelConnection.isClosed()) {
        kernelConnection.close();
    }
    kernelConnection = new KernelConnection(args.pythonPath, args.configPath);
});
var KernelConnection = /** @class */ (function () {
    function KernelConnection(pythonPath, configPath) {
        var command = [
            pythonPath,
            "-m",
            "ipykernel_launcher",
            "-f",
            configPath,
        ].join(" ");
        this.kernelProcess = child_process_1.spawn(command, { shell: true });
        var config = JSON.parse(fs.readFileSync(configPath).toString());
        this.client = new zmq_jupyter_1.JupyterKernelClient(config);
        this.running = true;
        this.init();
    }
    KernelConnection.prototype.init = function () {
        var _this = this;
        this.kernelProcess.stdout.on('data', function (data) {
            console.log(data.toString('utf-8'));
        });
        this.kernelProcess.stderr.on('data', function (data) {
            console.log(data.toString('utf-8'));
        });
        this.client.getKernelInfo(function (data) {
            if (_this.running) {
                mainWindow.webContents.send("kernel_info", data);
            }
        });
        this.client.sendShellCommand("%matplotlib inline", function (data) {
        });
        this.client.subscribeToIOLoop(function (data) {
            if (_this.running) {
                mainWindow.webContents.send("io_pub_channel", data);
            }
        });
        this.client.startSTDINLoop(function (data) {
            if (_this.running) {
                mainWindow.webContents.send(Channels_1.STDIN_CHANNEL_REQUEST, data);
            }
        });
        mainWindow.webContents.send(Channels_1.KERNEL_STATUS, (KernelStatus_1.KernelStatus.RUNNING));
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
        this.kernelProcess.on('exit', function () {
            _this.disconnect();
        });
        this.kernelProcess.on('close', function () {
            _this.disconnect();
        });
    };
    KernelConnection.prototype.sendShellCode = function (args) {
        this.client.sendShellCommand(args, function (data) { return console.log(data); });
    };
    KernelConnection.prototype.sendStdInReply = function (args) {
        this.client.sendStdinReply(args);
    };
    KernelConnection.prototype.sendIntterupt = function () {
        this.kernelProcess.kill("SIGINT");
    };
    KernelConnection.prototype.isClosed = function () {
        return !this.running;
    };
    KernelConnection.prototype.close = function () {
        this.kernelProcess.kill('SIGQUIT');
        this.disconnect();
    };
    KernelConnection.prototype.disconnect = function () {
        if (mainWindow && this.running) {
            mainWindow.webContents.send(Channels_1.KERNEL_STATUS, KernelStatus_1.KernelStatus.STOPPED);
        }
        this.running = false;
        console.log('STOPPED');
        this.client.stop();
    };
    return KernelConnection;
}());
var template = [
    {
        label: "File",
        submenu: [
            {
                label: 'Open Project',
                click: function () {
                    var data = electron_1.dialog.showOpenDialogSync({ properties: ['openDirectory'] });
                    if (!data || data.length === 0)
                        return;
                    mainWindow.webContents.send(Channels_1.OPEN_PROJECT, data[0]);
                }
            },
            {
                label: 'New Project',
                click: function () {
                    var _this = this;
                    var dirs = electron_1.dialog.showOpenDialogSync({ properties: ['openDirectory'] });
                    if (!dirs || dirs.length === 0) {
                        return;
                    }
                    var dir = dirs[0];
                    if (fs.existsSync(dir + "/" + ".pystudio")) {
                        electron_1.dialog.showErrorBox("Project already exists", "A project already exists in this folder. Try opening it instead");
                        return;
                    }
                    var setupPromise = new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var envSetupProcess;
                        return __generator(this, function (_a) {
                            mainWindow.webContents.send(Channels_1.LOADING_PROJECT_CHANNEL, {
                                message: 'Creating new Project',
                                isError: false,
                                isDone: false
                            });
                            // initialize it
                            fs.mkdirSync(dir + "/" + ".pystudio");
                            fs.writeFileSync(dir + "/" + ".pystudio/config.json", JSON.stringify(config));
                            fs.writeFileSync(dir + "/" + ".pystudio/ipython_config.json", JSON.stringify(pykernelConfig));
                            envSetupProcess = child_process_1.spawn("python3", ["-m", "venv", dir + "/" + "env"]);
                            envSetupProcess.on('error', function () {
                                reject('Could not setup python process');
                            });
                            envSetupProcess.on('exit', function (code) {
                                if (code !== 0) {
                                    reject('Non zero exit: ' + code);
                                    return;
                                }
                                var envInstall = child_process_1.spawn(dir + "/" + "env/bin/pip", ["install", "ipykernel", "matplotlib"]);
                                envInstall.on('error', function () {
                                    reject('Could not setup python process');
                                });
                                envInstall.on('exit', function (code) {
                                    if (code !== 0) {
                                        reject('Non zero exit: ' + code);
                                        return;
                                    }
                                    resolve('');
                                });
                            });
                            return [2 /*return*/];
                        });
                    }); });
                    setupPromise.then(function (value) {
                        mainWindow.webContents.send(Channels_1.OPEN_PROJECT, dir);
                    });
                    setupPromise["catch"](function (error) {
                        console.log(error);
                        mainWindow.webContents.send(Channels_1.LOADING_PROJECT_CHANNEL, {
                            message: "Error creating python project",
                            isDone: true,
                            isError: true
                        });
                        electron_1.dialog.showErrorBox("Python Error", "Error making python virutal env");
                    });
                }
            },
            {
                label: 'Test load',
                click: function () {
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
            { role: 'delete' },
            { type: 'separator' },
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: function () { require('electron').shell.openExternal('https://electronjs.org'); }
            }
        ]
    }
];
if (process.platform === 'darwin') {
    template.unshift({
        label: electron_1.app.name,
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services', submenu: [] },
            { type: 'separator' },
            { role: 'hide' },
            // {role: 'hideothers'},
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    });
    // Window menu
    template[3].submenu = [
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
    ];
}
electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
var config = {
    "env_name": "env",
    "config_name": "ipython_config"
};
var pykernelConfig = {
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
};
