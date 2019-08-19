const { Menu, Tray } = require('electron');
const path = require("path");

class TrayIcon {

    constructor (win, app) {

        this.win = win;

        this.appIcon = new Tray(path.join(__dirname, "/../../public/img/logo.ico"));

        const contextMenu = Menu.buildFromTemplate([{
                label: 'Fenster öffnen/schließen',
                click: () => {
                    if (win.isMinimized()) {
                        win.restore();
                        win.focus();
                    } else if (this.win.isVisible()) {
                        this.win.hide()
                    } else {
                        this.win.show();
                    } 
                }
            },
            {
                label: 'DNSProxy beenden',
                click: () => {
                    app.quit();
                }
            },
        ])

        this.appIcon.setToolTip('DNSProxy')
        this.appIcon.setContextMenu(contextMenu);

        this.appIcon.on('click', () => {
            this.appIcon.popUpContextMenu();
        })

    }

}

module.exports = TrayIcon;