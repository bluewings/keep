(function () {

    'use strict';

    phantom.outputEncoding = 'utf8';

    var fs = require('fs');

    var capture;

    var TIMEOUT = 10000,
        DATA_PATH = fs.workingDirectory + '/data/',
        SNAPSHOT_FILE = DATA_PATH + 'snapshot.txt',
        IMG_FILE = DATA_PATH + 'YMDHIS_capture.jpg',
        LOG_FILE = DATA_PATH + 'YMDHIS_log.json',
        CHANGE_FILE = DATA_PATH + 'YMDHIS_change.json';

    function ymdhis(date) {

        var y = '' + date.getFullYear(),
            m = date.getMonth() + 1,
            d = date.getDate(),
            h = date.getHours(),
            i = date.getMinutes(),
            s = date.getSeconds();

        m = (m < 10 ? '0' : '') + m;
        d = (d < 10 ? '0' : '') + d;
        h = (h < 10 ? '0' : '') + h;
        i = (i < 10 ? '0' : '') + i;
        s = (s < 10 ? '0' : '') + s;

        return y + m + d + h + i + s;
    }

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
            }
            phantom.exit(returnValue);
        },
        run: function (args) {

            var that = this,
                options = that._options,
                hasChanged = false,
                snapshot,
                page;

            var YMDHIS = ymdhis(new Date());

            try {
                snapshot = JSON.parse(fs.read(SNAPSHOT_FILE));
            } catch (err) {
                snapshot = {};
            }

            page = that._page = require('webpage').create();

            page.settings.localToRemoteUrlAccessEnabled = 'true';
            page.settings.userAgent = options.userAgent;
            page.viewportSize = options.viewportSize;

            page.open(options.url, function (status) {

                var retObj, key;

                if (status !== 'success') {

                    that.quit(1, 'Failed to open url "' + options.url + '"');

                } else {

                    try {

                        retObj = page.evaluate(function (options) {

                            var container;

                            // scale the whole body
                            document.body.style.backgroundColor = '#fff';
                            document.body.style.webkitTransform = "scale(2)";
                            document.body.style.webkitTransformOrigin = "0% 0%";

                            // fix the body width that overflows out of the viewport
                            document.body.style.width = options.viewportSize.width + 'px';
                            //document.body.style.width = '50%';

                            // set default font
                            document.body.style.fontFamily = "나눔고딕";

                            container = document.querySelector(options.container);
                            if (!container) {
                                container = document.body;
                            }

                            return container.getBoundingClientRect();

                        }, options);

                    } catch (err) {

                        this.quit(1, err);
                    }

                    page.clipRect = {
                        top: retObj.top,
                        left: retObj.left,
                        width: retObj.width,
                        height: retObj.height
                    };

                    setTimeout(function () {

                        var articles = {}, changes = {}, msg = [];

                        articles = page.evaluate(function () {

                            var result = [],
                                articles = {},
                                matches, inx, each;

                            function getArticle(el) {

                                var ret, link;

                                link = el.querySelector('a');

                                ret = {
                                    bounding: el.getBoundingClientRect(),
                                    text: el.innerText.replace(/^\s*/, '').replace(/\s*$/, ''),
                                    link: link && link.href ? link.href : ''
                                };

                                return ret;
                            }

                            // 텍스트 기사들
                            matches = document.querySelectorAll('.flick-panel:first-child .txtlst_l');
                            if (matches) {
                                for (inx = 0; inx < matches.length; inx++) {
                                    each = getArticle(matches[inx]);
                                    articles[each.link] = each;
                                }
                            }

                            // 사진 기사들
                            matches = document.querySelectorAll('.flick-panel:first-child .thmblst_l');
                            if (matches) {
                                for (inx = 0; inx < matches.length; inx++) {
                                    each = getArticle(matches[inx]);
                                    articles[each.link] = each;
                                }
                            }

                            return articles;
                        });

                        for (key in articles) {
                            if (articles.hasOwnProperty(key) && !snapshot[key]) {
                                articles[key]._isNew = 1;
                                changes[key] = articles[key];
                                hasChanged = true;
                            }
                        }

                        if (hasChanged) {

                            fs.write(SNAPSHOT_FILE, JSON.stringify(articles));

                            fs.write(LOG_FILE.replace(/YMDHIS/g, YMDHIS), JSON.stringify(articles));

                            fs.write(CHANGE_FILE.replace(/YMDHIS/g, YMDHIS), JSON.stringify(changes));

                            page.render(options.output.filepath.replace(/YMDHIS/g, YMDHIS), {
                                format: options.output.format,
                                quality: options.output.quality
                            });
                        }

                        //msg.push('Your request completed successfully.');
                        /*
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
                        */

                        that.quit(0, msg.join("\n"));

                    }, 1000);
                }
            });
        }
    };

    capture._options = {
        url: 'http://m.naver.com/',
        userAgent: 'Mozilla/5.0 (Linux; U; Android 4.0; en-us; GT-I9300 Build/IMM76D) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
        viewportSize: {
            width: 768,
            height: 1024
        },
        container: 'body',
        output: {
            filepath: IMG_FILE,
            format: 'jpg',
            quality: 80
        },
        rurl: ''
    };

    // for safety
    capture._timeout = setTimeout(function () {

        capture.quit(1);

    }, TIMEOUT);

    console.log(fs.workingDirectory);

    // execute
    capture.run(phantom.args);

})();