"use strict";
const loader = require("../core/loader");
const moment = require("moment");

class Live {

    constructor (socket, p) {
        this.p = p;
        this.socket = socket;

    }

    startup () {

        loader.show();
        this.socket.emit("querys-load-old", (querys) => {
            loader.hide();
            querys = querys.slice(querys.length - 10);
            for (let i = 0; i < 10; i++) {
                this.addItemToList(querys[i]);
            }

        });

        this.startLiveStream();

    }


    startLiveStream () {

        this.socket.on("querys-live-new", (querys) => {
            for (const query of querys) {
                this.addItemToList(query);
            }
        });

    }


    listener () {

        const $filter = $("[query-show-filter]");
        $filter.off("change").on("change", () => {
           this.filter();
        });
    
        $("[query-show-max]").off("change").on("change", () => {
            this.filter();
        });

        $("[query-live-search]").off("keyup").keyup(()=>{
            this.filter();
        });

        $("[notifiy-select]").off("change").on("change", (e) => {
            const $target = $(e.currentTarget);
            const data = {
                domain: $target.attr("domain"),
                modus: $target.val()
            }
            this.socket.emit("notifiy-select-change", data, (status) => {
                this.socket.change(status);
            });

        });

        $("[domain-change-status]").off("click").click((e) => {
            this.p.domainChangeStatus($(e.currentTarget));
        })

    }

    filter () {

        const type = $("[query-show-filter]").val();
        let blocked = false;
        if (type === "all") {
            $(`[querys-list] [blocked]`).removeClass("hide");
        } else {
            $(`[querys-list] [blocked]`).addClass("hide");
            if ( type=== "blocked" ) blocked = true;
            $(`[querys-list] [blocked=${blocked}]`).removeClass("hide");
        }

        const query = $("[query-live-search]").val();

        if (query.length > 0) {

            const $els = $("[querys-list]").children(":not(.hide)");

            for (const item of $els) {
                const $item = $(item);
                const domain = $item.find("[domain-search] b").text();

                if (!domain.match(new RegExp(query, "g"))) {
                    $item.addClass("hide");
                }

            }

        }

        const max = $("[query-show-max]").val();

        const $children = $("[querys-list]").children(":not(.hide)");

        if ($children.length > max) {
            for (let i = $children.length; i>max;i--) {
                $children.eq(i).remove();
            }
        }
    }

    addItemToList (data) {

        if (!data) return;

        data.btn = {
            title: "Blockieren",
            color: "grey darken-4 white-text"
        }
        data.blockColor = "green-text";
        if (data.block.is) {
            data.blockColor = "red-text";
            data.btn.title = "Freigeben";
            data.btn.color = "grey lighten-3 black-text";
        }
        data.time = moment(parseInt(data.time)).format('D.MM, HH:mm:ss');

        const $html = $(`<li blocked="${data.block.is}">
            <div class="collapsible-header waves-effect">
                <div class="row valign-wrapper" style="flex: 1;margin-bottom: 0;"">
                    <div class="col s1">${data.time}</div>
                    <div class="col s6" domain-search>
                        <b>${data.domain}</b>
                    </div>
                    <div class="col s3 ${data.blockColor}"> ${data.block.text} </div>
                    <div class="col s2">
                        <a domain="${data.domain}" blocked="${data.block.is}" domain-change-status class="btn ${data.btn.color} waves-effect z-depth-0 right">${data.btn.title}</a>
                    </div>
                </div>
            </div>
            <div class="collapsible-body">
                <div class="row" style="margin-bottom: 0">
                    <div class="input-field col s6">
                        <input disabled value="${data.address}" type="text">
                        <span class="helper-text">IP-Addresse</span>
                    </div>
                    <div class="input-field col s6">
                        <select domain="${data.domain}" notifiy-select>
                            <option value="disable" ${(data.notify === "disabled") ? "selected" : ""}>Deaktivieren</option>
                            <option value="enable" ${(data.notify === "enable") ? "selected" : ""}>Aktivieren</option>
                            <option value="enableSound" ${(data.notify === "enableSound") ? "selected" : ""}">Aktivieren mit Sound</option>
                        </select>
                        <label>Benachrichtigung</label>
                    </div>
                </div>
                <div class="row" style="margin-bottom: 0">
                    <div class="input-field col s6">
                        <input disabled value="${data.count.total}" type="text">
                        <span class="helper-text">Anfragen gesamt</span>
                    </div>
                    <div class="input-field col s6">
                        <input disabled value="${data.count.hour}" type="text">
                        <span class="helper-text">Anfragen in der letzten Stunde</span>
                    </div>
                </div>
            </div>
        </li>`);

        $("[querys-list]").prepend($html);

        this.filter();
        this.listener();

        $('select').formSelect();

    }

}

class List {

    constructor (socket, p) {
        this.p = p;
        this.socket = socket;
        this.$table = $("[query-list-table]");

    }

    
    startup () {
    
        this.listener();
        this.buildList();

    }

    listener () {

        $("[query-list-show-max]").off("change").on("change", () => {
            this.buildList();
        });
        $("[query-list-show-filter]").off("change").on("change", () => {
            this.buildList();
        });

        $("[query-list-search]").off("keyup").keyup(()=>{
            this.buildList();
        });

        $("[ query-list-reload]").off("click").click(()=> {
            this.buildList();
        });

        $("[domain-change-status]").off("click").click((e) => {
            this.p.domainChangeStatus($(e.currentTarget));
        })
        $("[query-list-clear]").off("click").click((e) => {
            console.log("CLEAR");
            // this.p.domainChangeStatus($(e.currentTarget));
            this.socket.emit("list-clear-log", "dnsquery",  (status) => {
                this.socket.change(status);
                if (status) {
                    this.buildList();
                }
            })
        })
        
    }

    addItemToList (data) {

        let block = {
            color: "green-text",
            text: "Nicht geblockt"
        }
        data.btn = {
            title: "Blockieren",
            color: "grey darken-4 white-text"
        }
        if (data.block.is) {
            block.color = "red-text";
            block.text = `Geblock (${data.block.list})`;
            data.btn.title = "Freigeben";
            data.btn.color = "grey lighten-3 black-text";
        }
        data.time = moment(parseInt(data.time)).format('D.MM, HH:mm:ss');
        const html = `<tr>
            <td>${data.time}</td>
            <td><b>${data.domain}</b></td>
            <td class="${block.color}">${block.text}</td>
            <td>${data.count.total} Gesamt <br>${data.count.hour} letzte Stunde</td>
            <td>
                <a domain="${data.domain}" blocked="${data.block.is}" domain-change-status class="btn ${data.btn.color} waves-effect z-depth-0 right">${data.btn.title}</a>
            </td>
        </tr>`

        this.$table.append(html);

        this.listener();

    }

    createPagination (pages) {

        $("[pagination-list]").remove();
        const $ul = $(`<ul pagination-list class="pagination center">`);

        $ul.append(`<li class="disabled remove waves-effect"><a href="#!"><i class="material-icons">chevron_left</i></a></li>`);

        for (let i = 1; i <= pages; i++) {
            $ul.append(`
                <li class="waves-effect" page="${i}"><a href="#!">${i}</a></li>
            `);
            
        }
        $ul.append(`<li class="disabled add waves-effect"><a href="#!"><i class="material-icons">chevron_right</i></a></li>`);


        $ul.find("li").click((e) => {
            const $t = $(e.currentTarget);
            let page = $t.attr("page");
            if (!page) {
                page = parseInt($ul.find("li.active").attr("page"));
                if ($t.hasClass("add")) page++;
                else page--;
            }
            page = parseInt(page);
            const $lis = $ul.find("li");
            if (page !== 0 && page <= parseInt($lis.eq($lis.length - 2).attr("page")) ) {
                this.getPage(page);
            }
        }).eq(1).addClass("active").removeClass("waves-effect");

        this.$table.parent().after($ul);
        this.$pag = $ul;
    }

    updatePagination (page) {

        const $items = this.$pag.children("[page]");
        $items.removeClass("hide");
        if ($items.length > 10) {

            for (let i = 2; i < $items.length - 2; i++) {
                const $item = $($items[i]);
                if (i >= page - 3 && i <= page + 1 ) {
                } else {
                    $item.addClass("hide");
                }
                
            }

        }

    }

    getPage (page) {

        this.updatePagination(page);

        this.$pag.find("li.active").removeClass("active").addClass("waves-effect");
        this.$pag.find(`[page=${page}]`).addClass("active").removeClass("waves-effect");

        loader.show();
        this.$table.empty();
        
        this.socket.emit("querys-live-all-pagination-page", page, (res) => {
            loader.hide();

            for (const query of res.data) {
                this.addItemToList(query);
            }

        });

    } 

    buildList () {

        loader.show();
        const data = {
            max: parseInt($("[query-list-show-max]").val()),
            filter: {
                show: $("[query-list-show-filter]").val(),
                search: $("[query-list-search]").val()
            }
        }

        this.socket.emit("querys-live-all-pagination", data, (pages) => {
            loader.hide();

            this.createPagination(pages);
            this.getPage(1);
        });

    }

}

module.exports = class {

    constructor (socket) {

        this.socket = socket;
        this.beforeDomain = "";

        this.live = new Live(socket, this);
        this.list = new List(socket, this);

    }

    startup () {

        let open = ["query-live"];
        this.live.startup();

        $('[tabs-querys]').tabs({
            onShow: (item) => {
                const id = $(item).attr("id");
                if (open.indexOf(id) === -1) {
                    if (id === "query-list") {
                        this.list.startup();
                    }
                    open.push(id);
                }
    
            }
        });

    }

    domainChangeStatus ($btn) {

        const data = {
            domain: $btn.attr("domain"),
            block: ($btn.attr("blocked") === "false") ? true : false
        }
        console.log(data);

        loader.show();

        this.socket.emit("domain-change-status", data, (status) => {
            loader.hide();
            if (status) {
                $btn = $(`[domain-change-status][domain='${data.domain}']`)
                if (data.block) {
                    $btn
                    .text("Freigeben")
                    .removeClass("grey darken-4 white-text")
                    .addClass("grey lighten-3 black-text")
                    .attr("blocked", data.block)
                } else {
                    $btn
                    .text("Blockieren")
                    .removeClass("grey lighten-3 black-text")
                    .addClass("grey darken-4 white-text")
                    .attr("blocked", data.block)
                }
            }
            this.socket.change(status);
        })



    }

}