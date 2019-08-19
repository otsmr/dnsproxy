const { Menu, MenuItem } = require('electron').remote
const customTitlebar = require('custom-electron-titlebar');

module.exports = class {

    constructor () {

        this.titlebar = new customTitlebar.Titlebar({
            backgroundColor: customTitlebar.Color.fromHex('#444'),
            icon: "img/logo.png",
            shadow: false
        });
        this.title = "DNSProxy";
        
    }
    
    set title (title) {
        
        this.titlebar.updateTitle(title);
    }

    setMenu (items) {

        const menu = this.menu = new Menu();
        menu.append(new MenuItem(items));
        this.titlebar.updateMenu(menu);

    }

}