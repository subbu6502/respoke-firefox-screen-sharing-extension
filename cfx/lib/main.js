/*
 * Copyright 2015, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The MIT License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */

'use strict';

var pageMod = require('sdk/page-mod');
var data = require("sdk/self").data;
var prefs = require("sdk/preferences/service");

// allowedUris can only have 1 wildcard, unlike Chrome
var allowedUris = ['https://respoke.github.io/*', 'https://1660a8b4.ngrok.com/*'];
var allowedDomains = ['respoke.github.io', '*.ngrok.com'];

// used for including the content script into specific loaded tabs after installation
// this needs improving so we can use regular expressions etc
var allowedSpecificUris = ['https://1660a8b4.ngrok.com/', 'https://respoke.github.io'];

var allowedDomainsPref = 'media.getusermedia.screensharing.allowed_domains';
var enableScreensharingPref = 'media.getusermedia.screensharing.enabled';

exports.main = function (options, callbacks) {

    if (options.loadReason !== 'startup') {
        //add the domains!
        prefs.set(enableScreensharingPref, true);
        var domains = prefs.get(allowedDomainsPref).split(',');

        allowedDomains.forEach(function (domain) {
            if (domains.indexOf(domain) === -1) {
                //add the domain into the allowedDomains
                domains.push(domain);
            }
        });

        prefs.set(allowedDomainsPref, domains.join(','));

    }

    pageMod.PageMod({
        include: allowedUris,
        contentScriptFile: data.url('./content.js'),
        contentScriptWhen: 'end'
    });

    //load the script into any tabs that are already active
    var tabs = require("sdk/tabs");
    for (let tab of tabs) {
         //this needs tidying up long term
        if (allowedSpecificUris.indexOf(tab.url) !== -1) {
            tab.attach({
                contentScriptFile: data.url('./content.js'),
            });
        }
    }

};

exports.onUnload = function(reason){
    if (reason !== 'shutdown') {

        //remove the domains we've set
        var domains = prefs.get(allowedDomainsPref).split(',');

        //remove the domains in allowedDomains from domains
        domains = domains.filter(function(domain) {
            return allowedDomains.indexOf(domain) === -1;
        });

        prefs.set(allowedDomainsPref, domains.join(','));

    }
}
