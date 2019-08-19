"use strict";

module.exports = class {

    constructor (json, max) {

        this.json = json;
        this.max = max;
        this.pages = this.getPages();

    }

    getPages () {

        if (this.json.length > this.max) {
            let pages = 0;
            for (let i = 0; i <= this.json.length; i = i+this.max) {
                pages++;
                if (pages > 10000) break;
            }
            return pages;
        } else {
            return 1;
        }
    }

    getPage (page) {
        
        page = parseInt(page);

        const end = this.max * page;
        const start = end - this.max;

        return this.json.slice(start, end);

    }

}