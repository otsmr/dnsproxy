"use strict";
const fs = require("fs");

class List {

    constructor (list) {

        this.id = list;
        this.path = `${process.env.mypath}/data/${list}.txt`

        this.checkForFile()

    }

    checkForFile () {
        const exists = fs.existsSync(this.path)
        if (!exists) fs.writeFileSync(this.path, "")
    }

    write (data) {

        fs.writeFileSync(this.path, data, { flag: 'w' });
        return data;

    }

    read () {

        try {
            let data = fs.readFileSync(this.path).toString().replace(/\r/, "").split("\n");
            let res = [];
            for (const item of data) {
                if (item !== "") res.push(item);
            }
            return res;
        } catch(e) {
            return this.write("");
        }

    }

    add (data) {

        const file = this.read(); 
        if (file.indexOf(data) > -1) return;
        if (file.length !== 0) data = "\n" + data;
    
        fs.appendFileSync(this.path, data);

    }

    remove (item) {
        const data = this.read();
        data.splice(data.indexOf(item), 1);
        this.write(data.join("\n"));
    }

    inList (reqDomain) {

        const list = this.read();

        for (const domain of list) {
            if (this.id.startsWith("regex")) {
                if (new RegExp(domain, 'g').exec(reqDomain)){
                    return true;
                }
            } else  if (reqDomain === domain) return true;
        }

        return false;

    }

}

module.exports = List;