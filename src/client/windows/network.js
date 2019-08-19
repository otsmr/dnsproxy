"use strict";
const execSync = require('child_process').execSync;

class PowerShell {

    psAdmin (befehl) {
        return this.ps(`Start-Process powershell -WindowStyle Minimized -Verb runAs -ArgumentList \\\"${befehl}\\\"`);
    }

    ps (befehl) {
        try {
            return execSync(`powershell.exe "${befehl}"`).toString();
        } catch (error) {
            return false;
        }
    }

    getPSJson(befehl, params = [], expants = []) {

        befehl = `get-` + befehl;

        for (const expant of expants) {
            params.push(`@{ Name = '${expant}'; Expression = { $output = @(); foreach($Route in $_.${expant}) { $output += $Route.NextHop; } $output; } }`);
        }
        if (params.length > 0) {
            befehl += ` | Select-Object -Property ${params.join(", ")}`
            befehl += ` | ConvertTo-Json`
        }
        
        try {
            return JSON.parse(this.ps(befehl));
        } catch (error) {
            return false;
        }

    }

}

class NetworkUtility extends PowerShell{

    constructor (profile = {}) {
        super();
        this.alias = profile.alias;
        this.index = profile.index;
    }

    get bindings() {

        const json = this.getPSJson("NetAdapterBinding", [
            "name",
            "ComponentID",
            "Enabled",
            "DisplayName"
        ]);

        let res = {};

        for (const item of json) {
            if (!res[item.name]) {
                res[item.name] = {};
            }
            res[item.name][item.ComponentID] = {
                enabled: item.Enabled,
                displayName: item.DisplayName,
            }
        }

        if (this.alias) return res[this.alias];

        return res;
    }

    get defaultGateway() {

        const confs = this.getPSJson("NetIPConfiguration", [
            "InterfaceAlias",
        ], [
            "IPv4DefaultGateway",
            "IPv6DefaultGateway",
        ]);

        let res = {};

        for (const conf of confs) {
            let ipv4 = conf["IPv4DefaultGateway"]
            if (typeof ipv4 !== "string") ipv4 = "";
            let ipv6 = conf["IPv6DefaultGateway"]
            if (typeof ipv6 !== "string") ipv6 = "";
            
            res[conf.InterfaceAlias] = {
                ipv4,
                ipv6
            };
        }

        if (this.alias) return res[this.alias];
            
        return res;

    }

    get dnsserver () {

        let json = this.getPSJson("DnsClientServerAddress", [
            "InterfaceAlias",
            "ServerAddresses",
            "AddressFamily"
        ]);

        let res = {};

        for (const item of json) {
            if (!res[item.InterfaceAlias]) {
                res[item.InterfaceAlias] = {};
            }
            let prot = "ipv6";
            if (item.AddressFamily === 2) {
                prot = "ipv4";
            } 
            res[item.InterfaceAlias][prot] = item.ServerAddresses;
        }

        if (this.alias) return res[this.alias];

        return res;
    }

    get ipaddress () {

        const json = this.getPSJson("netipaddress", [
            "ipaddress",
            "interfacealias",
            "addressfamily"
        ]);

        let res = [];

        for (const item of json) {

            if (!res[item.interfacealias]) {
                res[item.interfacealias] = {
                    ipv4: [],
                    ipv6: []
                }
            }
            let prot = "ipv6";
            if (item.AddressFamily === 2) {
                prot = "ipv4";
            }
            res[item.interfacealias][prot].push(item.ipaddress);

        }

        if (this.alias) return res[this.alias];

        return res;

    }

    changeDNSServer (address, validate = false) {

        if (!this.alias) return;

        if (typeof address !== "object") {
            address = [address];
        }

        let befehl = "";
        for (const ip of address) {
            if (befehl !== "") befehl += ",";
            befehl += `'${ip}'`;
        }
        this.psAdmin(`Set-DnsClientServerAddress -InterfaceIndex ${this.index} -ServerAddresses ${befehl}`);

        if (validate){
            console.log("Validate", address[0], this.usedDNSServer.address);
            this.sleep();
            if (address[0] === this.usedDNSServer.address) {
                return true;
            }
            return false;
        }

        return true;

    }

    sleep (n = 1) { // in secons
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n*1000);
    }

    get usedDNSServer () {

        const nslookup = execSync('nslookup localhost 2>nul | find "Address:"')
            .toString()
            .replace("Address: ", "")
            .replace(/ /g, "")
            .replace(/\n/g, "")
            .replace(/\r/g, "");
        
        return {
            address: nslookup,
            isIPv6: (nslookup.indexOf(":") > -1) ? true : false
        }

    }

    disableIPv6 (inter = this.alias) {
        return this.psAdmin(`Disable-NetAdapterBinding -Name '${inter}' -ComponentID ms_tcpip6 -PassThru`);
    }

    enableIPv6 (inter = this.alias) {
        return this.psAdmin(`Enable-NetAdapterBinding -Name '${inter}' -ComponentID ms_tcpip6 -PassThru`);
    }

    resetDNSServer (inter = this.index) {
        return this.psAdmin(`Set-DnsClientServerAddress -InterfaceIndex ${inter} -ResetServerAddresses`);
    }

}

class Network extends NetworkUtility{

    constructor () {
        super();
    }

    get activeProfiles() {

        const profiles = this.getPSJson("netConnectionProfile", [
            "name",
            "InterfaceAlias",
            "InterfaceIndex"
        ]);

        if (!profiles) return {}

        let res = {};

        if (profiles.name) {
            res[profiles.InterfaceAlias] = profiles;
        } else {
            for (const profile of profiles) {
                res[profile.InterfaceAlias] = profile;
            }
        }

        return res;

    }

    get netadapter () {
        return this.getPSJson("netadapter", [
            "name",
            "interfacedescription",
            "status",
            "macaddress",
            "linkspeed"
        ]);
    }

    get ipconfig() {

        let adapters = this.netadapter;
        let adapterBinding = this.adapterBinding;
        const dnsserver = this.dnsserver;
        const profiles = this.activeProfiles;
        const defaultGateways = this.defaultGateway;
        const ipaddress = this.ipaddress;

        let res = [];
        for (let adapter of adapters) {
            try {

                const binding = adapterBinding[adapter.name];
                const dns = dnsserver[adapter.name];
                const defaultGateway = defaultGateways[adapter.name];
                const ip = ipaddress[adapter.name];

                let apt = {
                    name: adapter.name,
                    desc: adapter.interfacedescription,
                    mac: adapter.MacAddress,
                    speed: adapter.LinkSpeed,
                    select: false,
                    running: (adapter.Status === "Up") ? true : false,
                    tcp: {
                        ipv4: binding["ms_tcpip"].enabled,
                        ipv6: binding["ms_tcpip6"].enabled
                    },
                    dnsserver: dns
                };

                if (defaultGateway) {
                    apt.defaultGateway = defaultGateway;
                }
                if (ip) {
                    apt.ipaddress = ip;
                }

                if (profiles[adapter.name]) {
                    apt.select = true;
                    apt.connectWith = profiles[adapter.name].name;
                }

                res.push(apt);
            } catch (error) {
                console.log(error);
            }
        }
        return res;

    }

    get activeAdapter () {

        const adapters = this.activeProfiles;
        if (Object.keys(adapters).length === 1) {
            const profile = adapters[Object.keys(adapters)[0]];
            return new Adapter({
                name: profile.name,
                alias: profile.InterfaceAlias,
                index: profile.InterfaceIndex
            });
        } else {
            return false;
        }

    }

    getAdapter (alias) {

        const adapters = this.activeProfiles;
        const profile = adapters[alias];
        if (profile) {
            return new Adapter({
                name: profile.name,
                alias: profile.InterfaceAlias,
                index: profile.InterfaceIndex
            });
        } 
        return false;

    }

    clearDNSCache () {
        return execSync("ipconfig /flushdns").toString();;
    }

}

class Adapter extends NetworkUtility {

    constructor (profile) {
        super(profile);
    }

    toString (){
        return this.alias;
    }

}

module.exports = Network;