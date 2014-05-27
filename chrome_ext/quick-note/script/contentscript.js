(function () {

    'use strict';

    var $ = jQuery;

    function initialize() {

        var script = document.createElement('SCRIPT');

        script.type = 'text/javascript';
        script.src = 'http://10.64.51.102:2000/javascripts/web-clipper-inject.js';

        $(document.body).append(script);
    }

    $(document).ready(function () {

        initialize();

    });

})();