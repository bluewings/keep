/*jslint browser: true, regexp: true, unparam: true, indent: 4 */
/*global jQuery: true */
(function () {

    'use strict';

    var $ = jQuery;

    var app = angular.module('keep.util', []);

    app.service('GlobalStorage', ['$q',
        function ($q) {

            var DEFAULT_URL = 'http://bluewings.github.io/globalStorage.html',
                DEFAULT_ORIGIN = 'http://bluewings.github.io';



            var iframe, callback = {},
                resolves = [],
                listener = {},
                myId = parseInt(Math.random() * 1000000, 10);


            var ignoreChanges = {

            };

            function bootstrap() {

                var deferred = $q.defer();

                if (iframe && iframe.ready) {
                    deferred.resolve(iframe);
                } else {
                    resolves.push(deferred);
                    if (!iframe) {
                        iframe = document.createElement('iframe');
                        iframe.frameBorder = 0;
                        iframe.width = 0;
                        iframe.height = 0;
                        iframe.style.display = 'none';
                        iframe.onload = function () {
                            var each;
                            iframe.ready = true;
                            while (each = resolves.shift()) {
                                each.resolve(iframe);
                            }
                        };
                        iframe.src = DEFAULT_URL;
                        document.body.appendChild(iframe);
                    }
                }
                return deferred.promise;
            }

            $(window).bind('message', function (event) {

                var data, inx, owner;

                try {
                    data = JSON.parse(event.originalEvent.data);
                    data.value = JSON.parse(data.value);
                    if (data.value && data.value._owner) {
                        owner = data.value && data.value._owner;
                        delete data.value._owner;
                    }
                } catch (ignore) {
                    // noop
                }
                if (data) {
                    if (data._key && callback[data._key]) {
                        callback[data._key](data);
                        delete callback[data._key];
                    } else if (data._type) {
                        if (owner !== myId && listener[data._type]) {
                            for (inx = 0; inx < listener[data._type].length; inx++) {
                                listener[data._type][inx](data.key, data.value);
                            }
                        }
                    }
                }
            });

            function postMessage(message, userCallback) {

                bootstrap().then(function (ifrm) {

                    var key = 'cb' + parseInt(Math.random() * 100000, 10);
                    callback[key] = userCallback;
                    message._key = key;
                    message._origin = location.origin;
                    if (message.value) {
                        message.value = JSON.parse(JSON.stringify(message.value));
                        message.value._owner = myId;
                    }
                    ifrm.contentWindow.postMessage(angular.toJson(message), DEFAULT_ORIGIN);
                });
            }

            function setData(scope, path, value) {

                var chunk, key;

                if (!path) {
                    return scope;
                }
                chunk = path.split('.');
                key = chunk.shift();
                if (scope && scope[key]) {
                    if (chunk.length === 0) {
                        scope[key] = value;
                        return true;
                    }
                    return setData(scope[key], chunk.join('.'), value);
                }
                return scope;
            }

            bootstrap();

            return {
                get: function (key) {

                    var deferred = $q.defer();
                    postMessage({
                        method: 'get',
                        key: key
                    }, function (data) {
                        deferred.resolve(data.result);
                    });
                    return deferred.promise;
                },
                set: function (key, value) {

                    var deferred = $q.defer();
                    postMessage({
                        method: 'set',
                        key: key,
                        value: value
                    }, function (data) {
                        deferred.resolve(data.result);
                    });
                    return deferred.promise;
                },
                on: function (type, callback) {

                    if (!listener[type]) {
                        listener[type] = [];
                    }
                    listener[type].push(callback);
                },
                sync: function (scope, localVar, archiveKey) {

                    var deferred = $q.defer(),
                        that = this,
                        skip = true;

                    scope.$watch(localVar, function (newValue, oldValue) {

                        if (!skip) {
                            that.set(archiveKey, newValue);
                        }
                        skip = false;
                    }, true);

                    that.get(archiveKey).then(function (data) {



                        setData(scope, localVar, data);
                        deferred.resolve(data);
                    });

                    function handleCacheChanges(type, key, value) {

                        if (key === archiveKey) {
                            scope.$apply(function () {
                                switch (type) {
                                case 'create':
                                case 'modify':

                                    skip = true;
                                    setData(scope, localVar, value);
                                    break;
                                case 'remove':
                                    skip = true;
                                    setData(scope, localVar, {
                                        asideOpen: false,
                                        listType: 'tile'
                                    });
                                    break;
                                default:
                                    break;
                                }
                            });
                        }
                    }
                    that.on('create', function (key, value) {
                        handleCacheChanges('create', key, value);
                    });
                    that.on('modify', function (key, value) {
                        handleCacheChanges('modify', key, value);
                    });
                    that.on('remove', function (key, value) {
                        handleCacheChanges('remove', key, value);
                    });
                    return deferred.promise;
                }
            };
        }
    ]);


}());