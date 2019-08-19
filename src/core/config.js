"use strict";
const fs = require("fs");

const defaultConf = {
    "network": {
        "adapter": "",
        "ipversion": "",
        "localhost": {
            "ipv4": [ "127.0.0.1" ],
            "ipv6": [ "::1" ]
        }
    },
    "autostart": false,
    "fallback": false,
    "blocklisttype": "black",
    "proxy": {
        "server": "cloudlfare"
    },
    "dnsserver": {
        "default": {
            "title": "Standard"
        },
        "cloudlfare": {
            "server": {
                "ipv4": [
                    "1.1.1.1",
                    "1.0.0.1"
                ],
                "ipv6": [
                    "2606:4700:4700::1111",
                    "2606:4700:4700::1001"
                ]
            },
            "title": "Cloudflare (1.1.1.1)"
        },
        "google": {
            "server": {
                "ipv4": [
                    "8.8.8.8",
                    "8.8.4.4"
                ],
                "ipv6": [
                    "2001:4860:4860::8888",
                    "2001:4860:4860::8844"
                ]
            },
            "title": "Google (8.8.8.8)"
        },
        "quad9": {
            "server": {
                "ipv4": [
                    "9.9.9.9",
                    "149.112.112.112"
                ],
                "ipv6": [
                    "2620:fe::fe",
                    "2620:fe::9"
                ]
            },
            "title": "Quad9 (9.9.9.9)"
        }
    },
    "notify": {}
};

class Config {

    constructor () {
        
        this.path = process.env.mypath +  "/data/config.json";

        if (!fs.existsSync(this.path)) {
            this._config = defaultConf;
            this.save();
        }

    }


    get data () {
        this.update();
        return this._config;
    }

    save () {

        fs.writeFileSync(this.path, JSON.stringify(this._config, null, 4), {
            flag: 'w'
        });

    }

    update () {

        try {
            this._config = JSON.parse(fs.readFileSync(this.path).toString());
        } catch (error) {
            this._config = {}
        }

    }

}

module.exports = new Config();