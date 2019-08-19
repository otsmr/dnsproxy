"use strict";

const Network = require("./windows/network");
const System = require("./windows/system");
const config = require("../core/config");

class Client {

    constructor () {

        this.network = new Network();
        this.system = new System();

    }

    get adapter () {
        
        const confAdapter = config.data.network.adapter;

        if (confAdapter === "") {
            const adapter = this.network.activeAdapter;
            if (adapter) {
                config.data.network.adapter = adapter.alias;
                config.save();
                return adapter;
            }
            return false;
        }

        return this.network.getAdapter(confAdapter);

    }

    get ipversion () {

        const confVersion = config.data.network.ipversion;

        
        if (confVersion === "") {
            let version = "ipv4";
            if (this.adapter.usedDNSServer.isIPv6) {
                version = "ipv6";
            }
            config.data.network.ipversion = version;
            config.save();
            return version;
        }

        // if (confVersion !== version) {
        //     if (confVersion === "ipv4") {
        //         console.log("disable");
        //         this.adapter.disableIPv6();
        //     } else {
        //         console.log("enable");
        //         this.adapter.enableIPv6();
        //     }
        // }

        return confVersion;

    }

}

module.exports = new Client();