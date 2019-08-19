"use strict";
const loader = require("../core/loader");

module.exports = class {

    constructor (socket) {

        this.socket = socket;
        
    }
    
    startup () {
        this.addNewDNSServer();
        this.updateSettings();
    }

    updateSettings () {

        loader.show(4);

        this.loadIPv();
        this.loadSystemDNS();
        this.loadNetworkInterface();
        this.loadAutostart();
        this.loadDNSServer();
        this.loadListType();

        $("[dns-config-reset]").off("click").on("click", () => {

            loader.show();
            this.socket.emit("dns-config-reset", (status) => {
                this.changed(status);
                loader.hide();
                if (status) {
                    this.loadIPv();
                    this.loadSystemDNS();
                }
            })

        })

    }

    loadIPv () {

        this.socket.emit("network-version-load", (ipv) => {
            loader.hide();

            const $select = $("[network-version-select]");
            M.FormSelect.getInstance($select[0]).destroy();

            
            $select.find("[selected]").attr("selected", false);
            $select.find(`[value=${ipv}]`).attr("selected", true);
            $select.formSelect();
            
            $select.off("change").on("change", () => {
                loader.show();

                this.socket.emit("network-version-change", $select.val(), (status) => {
                    loader.hide();
                    this.changed(status);
                    if (status) {
                        this.loadDNSServer();
                    }
                });

            });


        })

    }

    loadSystemDNS () {

        this.socket.emit("system-dns-server-check", (server, ipv) => {

            loader.hide();

            server = server[ipv];
            
            if (
                server[0] === "127.0.0.1" ||
                server[0] === "::1"
            ) {
                $("[system-dns-server-isokay]").removeClass("hide").text(server.join(", "));
                $("[system-dns-server-change]").addClass("hide");
            } else {
                $("[system-dns-server-isokay]").addClass("hide");
                $("[system-dns-server-change]")
                .removeClass("hide")
                .off("click")
                .click(() => {

                    const $inter = $("[network-interface-select]");
                    const inter = $inter.val();

                    if (inter) {
                        loader.show();
                        this.socket.emit("system-dns-server-change", false, (status) => {
                            loader.hide();
                            
                            if (status) {
                                $("[system-dns-server-isokay]").removeClass("hide");
                                $("[system-dns-server-change]").addClass("hide");
                            }
                            this.changed(status);
                        });
                        
                    } else $inter.parent().children(".dropdown-trigger").click();

                });

            }

        });

    }

    loadNetworkInterface () {

        this.socket.emit("network-interface-load", (adapters, select) => {

            loader.hide();

            const $select = $("[network-interface-select]");

            const instance = M.FormSelect.getInstance($select[0]);

            instance.destroy();
            
            for (const adapter of adapters) {
                const $opt = $(`<option value="${adapter.name}">${adapter.name}</option>`);

                if (adapter.name === select) {
                    $select.children("[selected=true]").attr("selected", false);
                    $opt.attr("selected", true);
                }
                $select.append($opt);
            }
            
            $select.formSelect();

            $select.off("change").on('change', () => {
                const select = $select.val();
                loader.show();
                this.socket.emit("network-interface-change", select, (status) => {
                    loader.hide();
                    this.changed(status);
                })
            });

        });

    }

    loadAutostart () {

        this.socket.emit("autostart-load", (isaktiv) => {

            loader.hide();

            const $checkbox = $("[autostart-checkbox]");

            $checkbox.prop('checked', isaktiv);

            $checkbox.off("change").on('change', () => {
                const isaktiv = $checkbox.is(":checked");
                loader.show();
                this.socket.emit("autostart-change", isaktiv, (status) => {
                    loader.hide();
                    this.changed(status);
                })
            });

        });

    }

    loadListType () {

        this.socket.emit("blocklist-type-load", (isaktiv) => {
            loader.hide();

            const $checkbox = $("[blocklist-type-checkbox]");

            $checkbox.prop('checked', isaktiv);

            $checkbox.off("change").on('change', () => {
                const iswhite = $checkbox.is(":checked");
                loader.show();
                this.socket.emit("blocklist-type-change", iswhite, (status) => {
                    loader.hide();
                    this.changed(status);
                })
            });

        });

    }

    loadDNSServer () {

        this.socket.emit("dns-server-load", (servers, proxyselected, ipversion, aktivdnsserver) => {

            loader.hide();
            const $selects = $("[dns-server-select]");

            for (const select of $selects) {
                M.FormSelect.getInstance(select).destroy();
            }
            
            $selects.children(":not([leave])").remove();
            
            for (const select of $selects) {
                const $select = $(select);

                if ($select.attr("dns-secondary-server") !== undefined) {
                    $select.children().eq(0).attr("selected", true);
                }
            
                for (const name in servers) {
                    const $opt = $(`<option value="${name}">${servers[name].title}</option>`);

                    const isSecondary = (
                        $select.attr("dns-secondary-server") !== undefined &&
                        servers[name]["server"][ipversion][0] === aktivdnsserver[1] &&
                        typeof aktivdnsserver[1] !== "undefined"
                    );
                    const isProxy = (
                        $select.attr("dns-server-proxy") !== undefined &&
                        name === proxyselected
                    )

                    if ( isProxy || isSecondary ) {
                        $select.children("[selected=true]").attr("selected", false);
                        $opt.attr("selected", true);
                    }

                    $select.append($opt);
                }
                
            }

            $selects.formSelect();

            const $fallback = $("[dns-secondary-server]");
            $fallback.off("change").on("change", () => {

                const $inter = $("[network-interface-select]");
                const inter = $inter.val();

                if (inter) {

                    loader.show();
                    this.socket.emit("system-dns-server-change", $fallback.val(), (status) => {
                        loader.hide();
    
                        if (status) {
                            this.loadSystemDNS();
                        }
                        this.changed(status);
                        
                    });
                    
                } else $inter.parent().children(".dropdown-trigger").click();

            });

            const $proxydns = $("[dns-server-proxy]");
            $proxydns.off("change").on("change", () => {
                const proxydns = $proxydns.val();
                loader.show();
                this.socket.emit("dns-server-proxy-change", proxydns, (status) => {
                    loader.hide();
                });

            });

        });

    }

    addNewDNSServer () {

        const validateIPaddress = (ipaddress) => {  
            if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) return true
            return false  
        }

        $('[dns-server-add-ip-addresse-ipv4]').chips({
            placeholder: 'IP-Adresse v4',
            limit: 2,
            minLength: 7,
            onChipAdd: (first, chip) => {

                const content = $(chip).text().replace("close", "");
    
                if (!validateIPaddress(content)) {
                    $(chip).addClass("red");
                }
    
            }
        });

        $('[dns-server-add-ip-addresse-ipv6]').chips({
            placeholder: 'IP-Adresse v6',
            limit: 2,
            minLength: 1,
            onChipAdd: (first, chip) => {

                const content = $(chip).text().replace("close", "");
    
                if (content.indexOf(":") === -1) {
                    $(chip).addClass("red");
                }
    
            }
        });

        $("[dns-server-add-btn]").off("click").click(()=>{

            const $name = $("[dns-server-add-name]");
            const $ipv4 = $("[dns-server-add-ip-addresse-ipv4]");
            const $ipv6 = $("[dns-server-add-ip-addresse-ipv6]");

            const ipv4chips = M.Chips.getInstance($ipv4[0]).chipsData;
            const ipv6chips = M.Chips.getInstance($ipv6[0]).chipsData;

            const clearChips = (el) => {
                const inst = M.Chips.getInstance(el);
                inst.deleteChip(1);
                inst.deleteChip(0);
            }

            let data = { ipv4: [], ipv6: [] };

            for (const chip of ipv4chips) {
                if (validateIPaddress(chip.tag)) data.ipv4.push(chip.tag);
            }
            for (const chip of ipv6chips) {
                if (chip.tag.indexOf(":") > -1) data.ipv6.push(chip.tag);
            }

            if ($name.val() === "") return $name.focus();
            if (data.ipv4.length === 0) clearChips($ipv4[0]);
            if (data.ipv6.length === 0) clearChips($ipv6[0]);
            
            if (data.ipv4.length === 0 && data.ipv6.length === 0) 
                return $ipv4.find("input").focus();

            loader.show();
            this.socket.emit("dns-server-add-custom", {
                name: $name.val(),
                server: data
            }, (status) => {
                loader.hide();
                this.changed(status);
                if (status) {
                    this.loadDNSServer();
                    clearChips($ipv4[0]);
                    clearChips($ipv6[0]);
                    $name.val("");
                }
            });

            console.log($name.val(), data);

        });

    }

    changed (status) {
        if (status) {
            M.toast({html: 'Erfolgreich geändert.'});
        } else {
            M.toast({html: 'Es ist ein Fehler aufgetreten.'});
        }
    }

}