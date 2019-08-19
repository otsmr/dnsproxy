"use strict";

const $ = require("jquery");

module.exports = class Pagination{

    constructor($table, opt = []){

        this.$table = $($table);
        this.rowsShown = opt.rowsShown || 10;

        this.createPagination();

    }

    createPagination(){

        var $items = this.$table.find("tbody tr"),
            rowsTotal = $items.length,
            numPages = Math.ceil(rowsTotal / this.rowsShown),
            big = (this.$table.hasClass("big")) ? "big" : "";

        this.$p = $('<ul>').appendTo(
            $(`<div class='pagination ${big}'>`).insertAfter(this.$table)
        );

        for(var i = 1;i <= numPages;i++) 
            this.$p.append(`<li page="${i-1}">${i}</li>`);
        
        this.$p
            .prepend('<li class="disabled" page="left"><i class="fas fa-angle-left"></i></li>')
            .append('<li page="right"><i class="fas fa-angle-right"></i></li>');

        $items.hide().slice(0, this.rowsShown).show();

        if(this.$p.find("li").length <= 3) this.$p.fadeOut(0);

        this.$p.find("li").click((e) => {
            this.changePagination(e);
        }).eq(1).addClass('aktiv');

    }

    changePagination (e) {

        var $target = $(e.currentTarget),
            $items = this.$table.find("tbody tr"),
            $aktive = this.$p.find("li.aktiv"),

            maxItems = this.$p.find("li").length,
            aktive = parseInt($aktive.attr("page")),
            currPage = $target.attr('page');

        

        if($target.hasClass("disabled")) return;

        if(currPage === "left") currPage = aktive - 1;
        
        if(currPage === "right") currPage = aktive + 1;

        var startItem = parseInt(currPage) * this.rowsShown,
            endItem = startItem + this.rowsShown;

        $items.css("opacity", "0").hide().slice(startItem, endItem).css({
            display: "table-row",
            opacity: 1,
        });
        $aktive.removeClass('aktiv');
        this.$p.find(`[page=${currPage}]`).addClass('aktiv');

        if(currPage == 0) this.$p.find(`[page=left]`).addClass("disabled");
        else this.$p.find(`[page=left]`).removeClass("disabled");
        if(this.$p.find("li").last().index()-1 === this.$p.find("li.aktiv").index()) this.$p.find(`[page=right]`).addClass("disabled");
        else this.$p.find(`[page=right]`).removeClass("disabled");


    }

}