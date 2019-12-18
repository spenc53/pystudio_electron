"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var path = require("path");
var isDev = require("electron-is-dev");
var zmq_jupyter_1 = require("zmq_jupyter");
var config = {
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
};
var mainWindow;
var client = new zmq_jupyter_1.JupyterKernelClient(config);
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 900,
        height: 680,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.webContents.once('dom-ready', function () {
        client.getKernelInfo();
        client.subscribeToIOLoop(function (data) {
            mainWindow.webContents.send("shell_channel", data);
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
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
