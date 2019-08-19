"use strict";

import Settings from "./pages/settings";
import Querys from "./pages/query";
import List from "./pages/list";
import titlebar from "./electron/titlebar"

const startUp = () => {

    // titlebar();
    
    $('.sidenav').sidenav();
    $('.dropdown-trigger').dropdown();
    $('.chips').chips();
    $('.collapsible').collapsible();
    
    $('select').formSelect();
    
    $('[data-length]').characterCounter();
    
    let socket = io.connect("http://127.0.0.1:6451");
    
    socket.change = (status) => {
        if (status) M.toast({html: 'Erfolgreich geändert.'});
        else M.toast({html: 'Es ist ein Fehler aufgetreten.'});
    }
    
    const menu = titlebar(socket);

    $(".window-icon.window-close").remove();
    $(".window-icon-bg.window-close-bg").append(
        $(`<div class="window-icon window-close">`).click(()=> {
            socket.emit("window-hide");
        })
    )

    console.log("CLOSE ADD");
    
    const settings = new Settings(socket);
    const querys = new Querys(socket);
    const list = new List(socket);
    
    let open = ["querys"];
    querys.startup();
    menu.title = "Anfragen - DNSProxy";

    $('[tabs-navigation]').tabs({
        onShow: (item) => {
            const id = $(item).attr("id");

            if (open.indexOf(id) === -1) {

                if (id === "settings") settings.startup();
                if (id === "list") list.startup();
                if (id === "querys") querys.startup();
                open.push(id);
            }

            switch (id) {
                case "settings": menu.title = "Einstellungen - DNSProxy"; break;
                case "list": menu.title = "Listen - DNSProxy"; break;
                case "querys": menu.title = "Anfragen - DNSProxy"; break;
            }

        }
    });
}

$(() => {
    startUp();
});