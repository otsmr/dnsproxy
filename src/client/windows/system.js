"use strict";
const AutoLaunch = require("auto-launch");

class System {

    setStartUp (status) {

        const autolaunch = new AutoLaunch({
            name: 'DNSProxy',
            path: process.env.exe,
        });
         
        if (status) autolaunch.enable();
        else autolaunch.disable();

    }

}

module.exports = System;