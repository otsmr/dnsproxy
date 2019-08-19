"use strict";

module.exports = (socket) => {

    const titlebar = new Titlebar();
    titlebar.setMenu({
        label: 'Menü',
        submenu: [
            {
                label: 'Webseite',
                click () {
                    socket.emit("open-website", "https://github.com/otsmr/dnsproxy")
                }
            },
            {
                label: 'Beenden',
                click:() => {
                    socket.emit("close-app");
                }
            }
        ]
    });

    return titlebar;

}