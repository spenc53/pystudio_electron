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
var kernelProcess;
var client = null;
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
            client.sendShellCommand(args, function (data) { return console.log(data); });
        });
        electron_1.ipcMain.addListener(Channels_1.STDIN_CHANNEL_REPLY, function (event, args) {
            console.log("std in sent");
            console.log(args);
            client.sendStdinReply(args);
        });
        electron_1.ipcMain.addListener(Channels_1.KERNEL_INTERUPT_REQUEST, function (event) {
            console.log("kernel interrupt request sent!");
            kernelProcess.kill('SIGINT');
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
    if (kernelProcess != null) {
        console.log('killing python process');
        kernelProcess.kill('SIGQUIT');
    }
});
electron_1.app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
electron_1.ipcMain.addListener(Channels_1.OPEN_PROJECT, function (event, args) {
    if (kernelProcess != null) {
        console.log('killing python process');
        kernelProcess.kill('SIGQUIT');
    }
    // TODO: make read this command from a config file
    var command = [
        args.pythonPath,
        "-m",
        "ipykernel_launcher",
        "-f",
        args.configPath,
    ].join(" ");
    var config = JSON.parse(fs.readFileSync(args.configPath).toString());
    mainWindow.webContents.send(Channels_1.KERNEL_STATUS, (KernelStatus_1.KernelStatus.RUNNING));
    kernelProcess = child_process_1.spawn(command, { shell: true });
    kernelProcess.stdout.on('data', function (data) {
        if (client == null) {
            client = new zmq_jupyter_1.JupyterKernelClient(config);
            client.getKernelInfo(function (data) {
                mainWindow.webContents.send("kernel_info", data);
            });
            client.subscribeToIOLoop(function (data) {
                mainWindow.webContents.send("io_pub_channel", data);
            });
            client.startSTDINLoop(function (data) {
                mainWindow.webContents.send(Channels_1.STDIN_CHANNEL_REQUEST, data);
            });
        }
    });
    kernelProcess.stderr.on('data', function (data) {
        console.log(data.toString('utf-8'));
    });
    kernelProcess.on('exit', function () {
        if (!mainWindow) {
            return;
        }
        mainWindow.webContents.send(Channels_1.KERNEL_STATUS, KernelStatus_1.KernelStatus.STOPPED);
    });
    kernelProcess.on('close', function () {
        if (!mainWindow) {
            return;
        }
        mainWindow.webContents.send(Channels_1.KERNEL_STATUS, KernelStatus_1.KernelStatus.STOPPED);
    });
});
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
