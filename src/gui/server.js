"use strict";

const http     = require('http');
const express  = require("express");
const io       = require('socket.io')();

const log      = require("../core/log");
const settings = require("./socket/settings");
const querys   = require("./socket/querys");
const lists    = require("./socket/lists");
const tools    = require("./socket/tools");

const port     = 6451;
const app      = express();


module.exports = (win, appeclipse) => {
    
    app.set('port', port);

    const server = http.createServer(app);

    io.on('connection', (socket) => {

        settings(socket);
        querys(socket);
        lists(socket);
        tools(socket, win, appeclipse);

    });

    server.listen(port);
    server.on('error', err => console.log(err));

    io.attach(server);

    log.info("webserver", `Server gestartet auf Port ${port}`);

}