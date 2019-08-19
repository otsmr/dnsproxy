"use strict";

const loader = require("../core/loader");

class ItemList {

    constructor (socket, list) {
        this.list = list;
        this.socket = socket;
    }

    startup () {
        this.listener();
        this.buildList();
    }

    listener () {
        
        const $cbs = $(`[list-${this.list}-checkbox]`);
        const $cbAll = $(`[list-${this.list}-checkbox-all]`);
        $cbAll.off("change").on("change", () => {

            if ($cbAll.is(":checked")) {
                $cbs.prop("checked", true)
            } else {
                $cbs.prop("checked", false)
            }

        });

        $cbs.off("change").on("change", () => {
            $cbAll.prop("checked", false)
        });

        $(`[list-${this.list}-btn-delete]`).off("click").click(() => {
            const $cbschecked = $(`[list-${this.list}-checkbox]:checked`);
            let remove = [];
            
            for (const item of $cbschecked) {
                const $item = $(item);
                remove.push({
                    list: $item.attr("list"),
                    domain: $item.attr("domain")
                });
            }

            this.deleteFromList(remove);

        });

        $(`[list-${this.list}-btn-delete-domain]`).off("click").click((e)=>{
           
            const items = [{
                list: $(e.currentTarget).attr("list"),
                domain: $(e.currentTarget).attr("domain"),
            }];

            this.deleteFromList(items);

        });

        $(`[list-add-${this.list}]`).off("click").click((e) => {
            const list = $(e.currentTarget).attr("addto");
            const $input = $(`[list-add-input-${this.list}]`);
            const input = $input.val();
            loader.show();
            this.socket.emit("list-add", list, input, (status) => {
                loader.hide();
                this.socket.change(status);
                if (status) {
                    $input.val("");
                    this.buildList();
                }
            })

        })

    }

    deleteFromList (items) {

        loader.show();
        this.socket.emit("list-remove-items", items, (status) => {
            loader.hide();
            this.socket.change(status);
            this.buildList();
        });

    }

    buildList () {

        loader.show();

        this.socket.emit("list-load-list", this.list, (items) => {
            loader.hide();
            let html = ""; 

            for (const item of items) {
                html += this.getItem(item);
            }
            
            $(`[list-table-${this.list}]`).empty().append(html);
            this.listener();
        });

    }

    getItem (item) {
        return `<tr>
        <td style="padding: 8px 0 0 20px;">
            <label>
                <input list="${item.list}" domain="${item.domain}" list-${this.list}-checkbox type="checkbox" />
                <span></span>
            </label>
        </td>
        <td> <b>${item.domain}</b> </td>
        <td> ${(item.list.startsWith("regex")) ? "reguläre" : "exakt"} </td>
        <td>
            <a list="${item.list}" domain="${item.domain}" list-${this.list}-btn-delete-domain class="btn waves-effect red z-depth-0 right"><i class="material-icons">delete</i></a>
        </td>
    </tr>`
    }

}



module.exports = class {

    constructor (socket, p) {

        this.socket = socket;
        this.p = p;
        this.black = new ItemList(socket, "black");
        this.white = new ItemList(socket, "white");
    }

    startup () {

        let open = ["list-black"];
        this.black.startup();

        $('[tabs-lists]').tabs({
            onShow: (item) => {
                const id = $(item).attr("id");
                if (open.indexOf(id) === -1) {
                    if (id === "list-white") this.white.startup();
                    if (id === "list-black") this.black.startup();
                    
                    open.push(id);
                } else {
                    
                    if (id === "list-white") this.white.buildList();
                    if (id === "list-black") this.black.buildList();
                }
    
            }
        });

    }

}