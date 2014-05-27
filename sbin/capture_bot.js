'use strict';

//phantom.outputEncoding = 'utf8';

var capture;

var fs = require('fs');
//system = require('system');

var mongodb = require('mongodb');
var monk = require('../node_modules/monk');
var db = monk('localhost:27017/news-archive');

var childProcess = require('child_process'),
    phantomjs = require('phantomjs'),
    path = require('path');

var COLLECTION = 'target';

for (var key in db) {
    //if (db.hasOwnProperty(key)) {
    //console.log(key);
    //}
}

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

var jobs = [];
db.get(COLLECTION).find({
    viewport: '768,1024',
    name: '다음 실급검'
}, {}, function (err, docs) {

    jobs = docs;

    //console.log(docs);
    doJobs();

    db.close();
});

function doJobs() {

    var job = jobs.shift();
    //console.log(jobs);


    if (job) {

    var childArgs, paths, key, output = new Date().getTime() + '_' + parseInt(Math.random() * 9999, 10) + '.jpg';

    paths = {
        capturejs: path.join(__dirname, './../sbin/capture.js'),
        tmpImg: path.join(__dirname, './../public/archive/' + job._id + '/' + ymdhis(new Date()) +'.jpg')
    };

		childArgs = [paths.capturejs];
    childArgs.push('url=' + job.url);
    childArgs.push('output=' + paths.tmpImg);
    childArgs.push('selector=' + (job.selector ? job.selector : 'body'));
    childArgs.push('viewport=' + (job.viewport ? job.viewport : '768,1024'));
    childArgs.push('inspect=' + (job.inspect ? job.inspect : ''));
   childProcess.execFile(phantomjs.path, childArgs, function (err, stdout, stderr) {

        console.log(job);
console.log('>>>>>>>>>>>> stdout');
        console.log(stdout);
        console.log('>>>>>>>>>>>> stderr');
        console.log(stderr);

console.log('>>> JOBS DONE');
        setTimeout(function () {
            doJobs();
        }, 1);


   });
 

    //childArgs.push('output=' + paths.tmpImg);		

    } else {
        console.log('fin');
    }


}


//phantom.exit(0);