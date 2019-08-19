const chalk = require("chalk");
// const moment = require("moment");
const fs = require("fs");
const dnsquery = require("./log/reader/dnsquery");
const types = {
    socket: {
        color: {
            text: "red",
            bg: "White"
        },
        title: "Socket.io"
    },
    webserver: {
        color: {
            text: "white",
            bg: "Blue"
        },
        title: "Webserver"
    },
    dnsserver: {
        color: {
            text: "black",
            bg: "Green"
        },
        title: "DNS Server"
    }
}

class Log {

    constructor () {

        this.path = process.env.mypath + "/data/";
    }

    checkForFile (fileName, call) {

        fs.exists(fileName, (exists) => {
            if (exists) call();
            else fs.writeFile(fileName, "", (err, data) => { 
                call();
            })
        });

    }

    toFile (typ, type, msg = "") {

        if (typeof msg !== "string") return;
        const path = this.path + typ + ".txt";
        if (msg !== "") {
            msg = ";" +msg;
        }

        this.checkForFile(path, () => {
            fs.appendFile(path, `${new Date().getTime()};${type}${msg}\n`, () => {

            });
        });

    }

    info (type, msg) {

        let conf = {
            color: {
                text: "white",
                bg: "Black"
            },
            title: type
        }
        if (types[type]) conf = types[type]

        if (typeof msg === "string") {
            console.log(chalk[`bg${conf.color.bg}`][conf.color.text](`[${conf.title}] ${msg} `));
        } else {
            console.log(chalk[`bg${conf.color.bg}`][conf.color.text](`[${conf.title}]`), msg);
        }

        this.toFile("info", type, msg);

    }

    save (file, json) {
        this.toFile(file, JSON.stringify(json));
    }

    readLog (type) {

        const data = fs.readFileSync(this.path + type + ".txt").toString();
        let res = [];

        switch (type) {
            case "dnsquery": res = dnsquery(data); break;
        }

        return res;

    }

    clear (file) {
        const path = this.path + file + ".txt";
        fs.writeFileSync(path, "");
        
    }

}

module.exports = new Log();