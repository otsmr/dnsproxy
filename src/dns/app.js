'use strict';

const DNSServer = require("./server");
const List      = require("../core/list");
const config    = require("../core/config");

const listBlack      = new List("black");
const listRegexBlack = new List("regexblack");
const listWhite      = new List("white");
const listRegexWhite = new List("regexwhite");

const notifier = require('node-notifier');

new DNSServer({

	inBlockList: (domain) => {

		if (listWhite.inList(domain)) return false;
		if (listRegexWhite.inList(domain)) return false;
		if (listBlack.inList(domain)) return "black";
		if (listRegexBlack.inList(domain)) return "regexblack";
		if (config.data.blocklisttype === "white") return "settings";
		
		return false;
		
	},
	afterRequest: (data) => {

		const notify = config.data.notify[data.domain];

		if (notify && notify !== "disabled") {
 
			let message = `Gerade wurde der Domain ${data.domain} abgefragt.`;
			if (data.block) message += ` Er wurde durch die Liste "${data.block}" geblockt.`;

			let sound = false;
			if ( notify === "enableSound") sound = true;
 
			notifier.notify({
				title: `DNSProxy: ${data.domain}`,
				message, sound, wait: true
			});

		}

	}

});