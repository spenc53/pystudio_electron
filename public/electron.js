"use strict";
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
        label: "file",
        submenu: [
            {
                label: 'Open Project',
                click: function () {
                    mainWindow.webContents.send(Channels_1.OPEN_PROJECT);
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
