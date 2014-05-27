'use strict';

phantom.outputEncoding = 'utf8';

var capture;

var fs = require('fs'),
    system = require('system');

var TIMEOUT = 10000;

capture = {
    _timeout: null,
    _page: null,
    _options: {},
    _ts: new Date(),
    quit: function (returnValue, message) {

        clearTimeout(this._timeout);

        if (this._page) {
            this._page.close();
        }
        if (message) {
            console.log((returnValue == 1 ? '[ERR] ' : '[INFO] ') + message);
            if (returnValue == 1) {
                system.stderr.writeLine(message);
            }
        }
        phantom.exit(returnValue);
    },
    setOptions: function (args) {

        var that = this,
            options = that._options,
            matches, tmp;

        if (args.length > 0) {

            args.forEach(function (arg) {

                if (arg == '--help') {
                    console.log('do you need a help?');
                    that.quit(0);
                }

                matches = arg.match(/^(.+?)=(.*)$/);
                if (matches && matches.length == 3) {
                    switch (matches[1].replace(/\-/g, '').toLowerCase()) {
                    case 'url':
                        options.url = matches[2];
                        break;
                    default:
                        break;
                    }
                }
            });
        }
    },
    run: function (args) {

        var that = this,
            options = that._options,
            page;

        that.setOptions(args);

        if (!options.url || options.url.search(/^http(s){0,1}:\/\//) == -1) {
            this.quit(1, 'Invalid URL : "' + options.url + '"');
        }

        page = that._page = require('webpage').create();

        page.settings.localToRemoteUrlAccessEnabled = 'true';
        //page.settings.userAgent = options.userAgent;
        //page.viewportSize = options.viewportSize;

        page.open(options.url, function (status) {

            var retObj;

            //console.log(options.url);

            if (status !== 'success') {

                that.quit(1, 'Failed to open url "' + options.url + '"');

            } else {

                try {

                    retObj = page.evaluate(function (options) {

                        var container, targets = [];


                        function getInfo(elem, selectors) {

                            var search;

                            do {
                                search = document.querySelector(selectors.shift());
                            } while (!search && selectors.length > 0);

                            if (search && search.getAttribute('content')) {
                                return search.getAttribute('content');
                            } else if (search) {
                                return search.innerText;
                            }
                            return '';
                        }

                        return {
                            title: getInfo(document, ['meta[property="og:title"]', 'meta[property="twitter:title"]', 'title']),
                            desc: getInfo(document, ['meta[property="og:description"]', 'meta[property="twitter:description"]', 'p']),
                            thumb: getInfo(document, ['meta[property="og:image"]', 'meta[property="twitter:image:src"]', 'meta[property="twitter:image"]', 'image'])
                        };

                    }, options);

                } catch (err) {

                    this.quit(1, err);
                }


                    //system.stdout.writeLine(JSON.stringify([1, 2, 3]));
                    system.stdout.writeLine(JSON.stringify(retObj));

                    //fs.write('aaa.txt', JSON.stringify(retObj));

                    that.quit(0);                

                //console.log(JSON.stringify(retObj));

                page.clipRect = {
                    top: retObj.rect.top,
                    left: retObj.rect.left,
                    width: retObj.rect.width,
                    height: retObj.rect.height
                };



                setTimeout(function () {

                    var filename = options.output.filepath,
                        msg = [],
                        now = new Date(),
                        y = '' + now.getFullYear(),
                        m = now.getMonth() + 1,
                        d = now.getDate(),
                        h = now.getHours(),
                        i = now.getMinutes(),
                        s = now.getSeconds(),
                        rand = parseInt(Math.random() * 10000000 + 10000000, 10).toString(36).substr(0, 5);

                    m = (m < 10 ? '0' : '') + m;
                    d = (d < 10 ? '0' : '') + d;
                    h = (h < 10 ? '0' : '') + h;
                    i = (i < 10 ? '0' : '') + i;
                    s = (s < 10 ? '0' : '') + s;

                    filename = filename.replace(/YYYYMMDD/g, y + m + d).replace(/HHMMSS/g, h + i + s).replace(/RANDOM/g, rand);

                    page.render(filename, {
                        format: options.output.format,
                        quality: options.output.quality
                    });

                    //console.log('[success] [output:' + fs.workingDirectory + '/' + filename + ']');

                    msg.push(JSON.stringify(retObj.targets));

                    msg.push('Your request completed successfully.');
                    msg.push('- request');
                    msg.push('&nbsp;&nbsp;. url: ' + options.url);
                    msg.push('&nbsp;&nbsp;. selector: ' + options.container);
                    msg.push('&nbsp;&nbsp;. userAgent: ' + options.userAgent);
                    msg.push('&nbsp;&nbsp;. viewport: ' + options.viewportSize.width + 'x' + options.viewportSize.height);
                    msg.push('&nbsp;&nbsp;. format: ' + options.output.format);
                    if (options.output.format == 'jpg') {
                        msg.push('&nbsp;&nbsp;. quality: ' + options.output.quality);
                    }
                    msg.push('- results');
                    msg.push('&nbsp;&nbsp;. output: ' + fs.workingDirectory + '/' + filename);
                    msg.push('&nbsp;&nbsp;. elapsed: ' + (new Date() - that._ts) + 'ms');
                    msg.push('&nbsp;&nbsp;. resultSize: ' + retObj.width + 'x' + retObj.height);


                    system.stdout.writeLine(JSON.stringify([1, 2, 3]));
                    system.stdout.writeLine(JSON.stringify(retObj.targets));

                    //fs.write('aaa.txt', JSON.stringify(retObj));

                    that.quit(0, msg.join("\n"));

                }, 1000);
            }
        });
    }
};

capture._options = {
    url: 'http://news.naver.com/main/election2014/news/read.nhn?mid=hot&sid1=162&cid=975081&iid=993370&oid=001&aid=0006925860&ptype=011'
};

// for safety
capture._timeout = setTimeout(function () {

    capture.quit(1);

}, TIMEOUT);

// execute
capture.run(phantom.args);