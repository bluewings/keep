var express = require('express');
var router = express.Router();
var childProcess = require('child_process'),
    phantomjs = require('phantomjs'),
    path = require('path');
var SUCCESS = 200;
var ERROR = 500;

function render(req, res) {

	res.render('index', {
		title: 'Express',
		stylesheets: ['/stylesheets/keep.css'],
		javascripts: [
			'http://cdnjs.cloudflare.com/ajax/libs/masonry/2.1.08/jquery.masonry.min.js',

			'/javascripts/keep.util.js', '/javascripts/keep.js'
		]
	});
}

/* GET home page. */
router.get('/', function (req, res) {
	render(req, res);
});
router.get('/home', function (req, res) {
	render(req, res);
});
router.get('/about', function (req, res) {
	render(req, res);
});
router.get('/share/:id', function (req, res) {
	render(req, res);
});


router.get('/link/:url', function (req, res) {


	// phantom
	//router.get('/misc/capture/:url', function (req, res) {

		var childArgs, paths, key, output = new Date().getTime() + '_' + parseInt(Math.random() * 9999, 10) + '.jpg';

		paths = {
			capturejs: path.join(__dirname, './../sbin/capture.js'),
			tmpImg: path.join(__dirname, './../public/_tmp/' + output)
		};
		childArgs = [paths.capturejs];
		childArgs.push('url=' + req.params.url);
		childArgs.push('output=' + paths.tmpImg);
		for (key in req.query) {
			if (req.query.hasOwnProperty(key)) {
				childArgs.push(key + '=' + req.query[key] + '');
			}
		}

		childProcess.execFile(phantomjs.path, childArgs, function (err, stdout, stderr) {

			var result = {};

			try {
				stdout = JSON.parse(stdout);
				result = {
					url: req.params.url,
					title: stdout.title,
					note: stdout.desc,
					image: stdout.thumb

				};
			} catch(ignore) {



			}



			res.jsonp({
				code: err ? ERROR : SUCCESS,
				message: err ? stderr : 'ok',
				result: result

				/* {
					url: '/_tmp/' + output,
					done: childArgs,
					err: err,
					stdout: stdout,
					stderr: stderr
				}*/
			});
		});
	//});
});


router.get('/share/notes/:id', function (req, res) {

	var fs = require("fs"),
		path = require('path'),
		filepath = path.join(__dirname, '..', 'public', 'shares', 'notes.' + req.params.id + '.json');

	fs.readFile(filepath, 'utf8', function (err, data) {
		if (err) {
			res.jsonp({
				code: 500,
				message: err
			});
		} else {
			res.jsonp({
				code: 200,
				message: 'ok',
				result: {
					notes: JSON.parse(data)
				}
			});
		}
	});
});

router.post('/share/notes', function (req, res) {

	var fs = require("fs"),
		path = require('path'),
		id = (parseInt(Math.random() * 900000000 + 100000000, 10)).toString(36).substr(0, 5),
		filename, jsonData;

	if (req.body && req.body.notes) {

		filename = path.join(__dirname, '..', 'public', 'shares', 'notes.' + id + '.json');

		fs.writeFile(filename, JSON.stringify(req.body.notes), function (err) {

			if (err) {
				res.jsonp({
					code: 500,
					message: err
				});
			} else {
				res.jsonp({
					code: 200,
					message: 'ok',
					result: {
						id: id
					}
				});
			}
		});
	} else {
		res.jsonp({
			code: 500,
			message: 'notes were not found.'
		});
	}
});

module.exports = router;