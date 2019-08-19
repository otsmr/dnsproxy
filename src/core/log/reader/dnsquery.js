"use strict";
let counts = [];

module.exports = (data) => {
    counts = [];
    let res = [];

    let lines = data.split("\n");
    for (const line of lines) {
        if (line === "") continue;
        const items = line.split(";");
        const json = JSON.parse(items[1]);
        res.push({
            ...json,
            time: items[0]
        });
    }

    for (const query of res) {
        
        query.count = count(query.domain, res);
        if (!query.address) {
            query.address = "-"
        }
        if (query.block) {
            query.block = {
                is: true,
                text: `Geblockt durch "${query.block}"`,
                list: query.block
            }
        } else {
            query.block = {
                is: false,
                text: "Nicht geblockt"
            }
        }

    }

    return res;

}


const count = (domain, querys) => {

    if (counts[domain]) return counts[domain];

    let time = new Date();
    time.setHours(time.getHours()-1);
    time = time.getTime();

    let c = 0;
    let chout = 0;
    for (const query of querys) {
        if (query.domain === domain) {
            c++;
            if (query.time >= time) {
                chout++;
            }
        }
    }
    return counts[domain] = {
        total: c,
        hour: chout
    }

}