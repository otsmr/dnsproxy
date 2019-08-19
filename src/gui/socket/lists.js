// domain-change-status

"use strict";

const log = require("../../core/log");
const List = require("../../core/list");
const client = require("../../client/client");

const lists = {
    black: new List("black"),
    regexblack: new List("regexblack"),
    white: new List("white"),
    regexwhite: new List("regexwhite"),
}


module.exports = (socket) => {


    socket
    .on("domain-change-status", (data, call) => {

        if (data.block) {
            lists.black.add(data.domain);
        } else {
            lists.black.remove(data.domain);
        }

        client.network.clearDNSCache();

        call(true);

    })
    .on("list-clear-log", (file, call) => {
        try {
            log.clear(file);
            call(true);
        } catch (error) {
            console.log(error);
            call(false);
        }
    })
    .on("list-add", (list, input, call) => {
        try {
            lists[list].add(input);
            client.network.clearDNSCache();
            call(true);
        } catch (error) {
            call(false);
        }

    })
    .on("list-remove-items", (items, call) => {
        try {

            for (const item of items) {
                lists[item.list].remove(item.domain);
            }
            client.network.clearDNSCache();
            call(true);
            
        } catch (error) {
            call(false);
        }

    })
    .on("list-load-list", (color, call) => {

        let res = [];
        
        for (const item of lists[color].read()) {
            res.push({
                domain: item,
                list: color
            });
        }
        for (const item of lists["regex"+color].read()) {
            res.push({
                domain: item,
                list: "regex"+color
            });
        }
        call(res);

    });

}
