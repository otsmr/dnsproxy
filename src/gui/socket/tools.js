"use strict";

const open = require("open");

module.exports = (socket, win, app) => {

    socket
    .on("window-hide", () => {
        win.hide();
    })
    .on("open-website", (link) => {
        open(link)
    })
    .on("close-app", () => {
        app.quit();
    })

}