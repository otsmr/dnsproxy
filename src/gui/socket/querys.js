"use strict";

const watch = require("node-watch");
const Pagination = require("../../core/socketpagination");
const log = require("../../core/log");
const config = require("../../core/config");
const path = require("path");
const fs = require("fs");

const conf = {
    log: path.join(process.env.mypath + "/data/dnsquery.txt")
}

let logLength = -1;
let pagination;
module.exports = (socket) => {

    if (!fs.existsSync(conf.log)) {
        fs.writeFileSync(conf.log, "");
    }

    watch(conf.log, {}, () => {

        const querys = log.readLog("dnsquery");

        if (querys.length > logLength) {
            const newQuerys = querys.slice(logLength);
            logLength = querys.length - 1;

            socket.emit("querys-live-new", newQuerys)

        }
        
    });

    socket
    .on("querys-load-old", (call) => {

        const logs = log.readLog("dnsquery");
        logLength = logs.length - 1;

        call(logs);

    })
    .on("notifiy-select-change", (data, call) => {

        try {
            config.data.notify[data.domain] = data.modus;
            config.save();
            call(true);
        } catch (error) {
            call(false);
        }

    })
    .on("querys-live-all-pagination", (data, call) => {

        let querys = log.readLog("dnsquery");
        querys.reverse();
        let res = [];

        if (data.filter.show !== "all") {

            for (const query of querys) {
                if (
                    (!query.block.is && data.filter.show === "notblocked") || 
                    (query.block.is && data.filter.show === "blocked")
                ) {
                    res.push(query);
                }
                
            }

        } else {
            res = querys;
        }
        
        if (data.filter.search !== "") {
            const regex = new RegExp(data.filter.search, "g");

            let resSearch = [];
            
            for (const query of res) {
                if (query.domain.match(regex)) {
                    resSearch.push(query);
                }
            }
            res = resSearch;
        }

        pagination = new Pagination(res, data.max);

        call(pagination.pages);
        
    })
    .on("querys-live-all-pagination-page", (page, call) => {

        if (!pagination) {
            return;
        }
        call({
            data: pagination.getPage(page),
            pages: pagination.pages
        });
    })

}
