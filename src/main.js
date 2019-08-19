"use strict";

const { app, BrowserWindow } = require('electron');
const fs = require("fs");
process.env.mypath = app.getPath("userData");
process.env.exe = app.getPath("exe");

if (!fs.existsSync(process.env.mypath + "/data")) {
    fs.mkdirSync(process.env.mypath + "/data");
}

// (name)
const Tray  = require("./electron/tray");
const gui   = require("./gui/server");
require("./dns/app");

let window;

function createWindow () {

    window = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: './public/img/logo.png',
        webPreferences: {
            plugins: true,
            nodeIntegration: true
        },
        frame: false
    });

    new Tray(window, app);
    gui(window, app);

    window.loadFile('./public/index.html');

    window.on('closed', () => {
        window = null;
    });

    window.hide();

    // window.toggleDevTools();

}

if (!app.requestSingleInstanceLock()) app.quit();
else {

    app.on('second-instance', (event, commandLine) => {
        if (!window) return;
        if (window.isMinimized()) window.restore();
        window.focus();
    });

    app.on('ready', createWindow);

    // app.on('window-all-closed', () => {
    //     app.quit();  // Soll im Hintergrund weiter laufen
    // });

}