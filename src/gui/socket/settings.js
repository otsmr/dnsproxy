"use strict";
const client = require("../../client/client");
const config = require("../../core/config");

module.exports = (socket) => {

    socket.on('system-dns-server-check', (call) => {

        call(client.adapter.dnsserver, client.ipversion);

    })
    .on("system-dns-server-change", (fallback, call) => {

        let address = config.data.network.localhost[client.ipversion];

        if (fallback ) {
            if (fallback === "no") {
                config.data.fallback = false;
            } else {
                console.log(fallback);
                let fallbackdns = config.data.dnsserver[fallback].server;
                address.push(fallbackdns[client.ipversion]);
                config.data.fallback = fallbackdns;
            }
            config.save();
        } else {
            if (config.data.fallback) {
                address.push(config.data.fallback[client.ipversion]);
            }
        }
        
        call(client.adapter.changeDNSServer(address, true));

    })
    .on("network-interface-load", (call) => {

        call(
            client.network.netadapter,
            client.adapter.alias
        );
        
    })
    .on("network-interface-change", (select, call) => {

        try {

            config.data.network.adapter = select;
            config.save();
            call(true);
            
        } catch (error) {
            console.log(error);
            call(false);
        }
        
    })
    .on("autostart-load", (call) => {

        let autostart = false;
        try {
            autostart = config.data.autostart;
        } catch (error) {
            console.log(error);
        }
        call(autostart);
        
    })
    .on("autostart-change", (autostart, call) => {

        try {

            config.data.autostart = autostart;
            config.save();
            client.system.setStartUp(autostart);
            call(true);
            
        } catch (error) {
            call(false);
        }
        
    })
    .on("dns-server-load", (call) => {

        try {

            if (!config.data.dnsserver["default"].server) {

                const defaultGateway = client.adapter.defaultGateway;
                const address = defaultGateway[client.ipversion];
                config.data.dnsserver["default"] = {
                    title: `Standard (${address})`,
                    server: {
                        ipv4: [defaultGateway.ipv4],
                        ipv6: [defaultGateway.ipv6]
                    }
                }
                config.save();

            }

            const ipv = client.ipversion;
            const server = client.adapter.dnsserver[ipv];

            call(
                config.data.dnsserver,
                config.data.proxy.server,
                ipv,
                server
            );
            
        } catch (error) {
            console.log(error);
            call(false);
        }
        
    })
    .on("dns-server-proxy-change", (proxydns, call) => {

        try {
            config.data.proxy.server = proxydns;
            config.save();
            call(true);
        } catch (error) {
            call(false);
        }

    })
    .on("dns-server-add-custom", (json, call) => {

        try {

            const id = "custom" + Math.floor((Math.random() * 100000) + 1000);
            config.data.dnsserver[id] = {
                server: json.server,
                title: json.name
            }
            config.save();
            if (config.data.dnsserver[id]) {
                return call(true);
            } 
            call(false);

        } catch (error) {
            call(false);
        }

    })
    .on("blocklist-type-load", (call) => {

        let blocklisttype = "black";
        try {
            blocklisttype = config.data.blocklisttype;
        } catch (error) {
            console.log(error);
        }

        if (blocklisttype === "black") call(false);
        else call(true); 
        
    })
    .on("blocklist-type-change", (iswhite, call) => {

        try {

            config.data.blocklisttype = (iswhite) ? "white" : "black";
            config.save();
            call(true);
            
        } catch (error) {
            call(false);
        }
        
    })

    .on("network-version-load", (call) => {
        call(client.ipversion);
    })

    .on("network-version-change", (ipv, call) => {

        try {

            config.data.network.ipversion = ipv;
            config.save();

            if (ipv === "ipv6") {
                client.adapter.enableIPv6();
            } else {
                client.adapter.disableIPv6();
            }

            call(true);
            
        } catch (error) {
            console.log(error);
            call(false);
        }

    })

    .on("dns-config-reset", (call) => {

        client.adapter.resetDNSServer();
        client.adapter.enableIPv6();

        call(true);

    })

}