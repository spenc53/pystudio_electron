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
        },
        show: false
    });
    mainWindow.once('ready-to-show', function () { return mainWindow.show(); });
    mainWindow.webContents.once('dom-ready', function () {
        client.getKernelInfo(function (data) {
            mainWindow.webContents.send("kernel_info", data);
        });
        client.subscribeToIOLoop(function (data) {
            mainWindow.webContents.send("io_pub_channel", data);
        });
    });
    // let menu = Menu.buildFromTemplate([{
    //       label: 'Menu',
    //       submenu: [
    //           {label:'Adjust Notification Value'},
    //           {label:'CoinMarketCap'},
    //           {label:'Exit'}
    //       ]
    //   }]);
    // Menu.setApplicationMenu(menu); 
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
var template = [
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            // {role: 'pasteandmatchstyle'},
            { role: 'delete' },
            // {role: 'selectall'},
            { type: 'separator' },
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            // {role: 'forcereload'},
            // {role: 'toggledevtools'},
            // {type: 'separator'},
            // {role: 'resetzoom'},
            // {role: 'zoomin'},
            // {role: 'zoomout'},
            { type: 'separator' },
        ]
    },
    {
        role: 'window',
        submenu: [
            { role: 'minimize' },
            { role: 'close' }
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
        label: electron_1.app.getName(),
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
