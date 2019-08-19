"use strict";

const dns       = require('native-dns');
const async     = require('async');
const config    = require("../core/config");
const log       = require("../core/log");

const server    = dns.createServer();

module.exports = class {

    constructor (config) {

        this.config = config;

        server.on('error', (err) => console.error(err.stack));
        server.on('socketError', (err) => console.error(err));

        server.serve(53);

        server.on('request', (req, res) => {
            this.request(req, res);
        });

    }

    proxy (question, response, cb) {

        let server = { address: "1.1.1.1", port: "53", type: "udp" }

        try {
            const c = config.data;
            server.address = c.dnsserver[c.proxy.server].server[c.network.ipversion][0];
        } catch (error) { }

        log.info("dnsserver", `Proxy "${question.name}" durch "${server.address}"`);

        const request = dns.Request({
            question: question,
            server: server,
            timeout: 1000
        });
    
        request.on('timeout', () => {
            log.info("dnsserver", `Timeout bei der Anforderung keine Weiterleitung für "${question.name}"`);
        });
    
        request.on('message', (err, msg) => {
            msg.answer.forEach(a => {
                response.answer.push(a);
            });
        });
    
        request.on('end', cb);
        request.send();    

    }

    block (domain) {
        return { 
            "records": [{
                "type": "A",
                "address": "0.0.0.0",
                "ttl": 300,
                "name": domain
            }],
            "domain": domain
        }
    }

    request (request, response) {

        let f = [];

        request.question.forEach(question => {

            let block = false;

            if (this.config.inBlockList)
                block = this.config.inBlockList(question.name);
            
            if (block) {

                this.block(question.name).records.forEach(record => {
                    response.answer.push({
                        ...dns[record.type](record),
                        block
                    });
                });

                log.info("dnsserver", `Anfrage "${question.name}" wurde durch die Liste "${block}" geblockt`)

            } else f.push(cb => this.proxy(question, response, cb));
            
        });

        async.parallel(f, () => {
            for (const res of response.answer) {
                const data = {
                    domain: res.name,
                    block: res.block || false,
                    address: res.address || res.data
                }
                log.save("dnsquery", data);
                if (this.config.afterRequest) {
                    this.config.afterRequest(data);
                }
            }
            response.send();
        });
    
    }

}