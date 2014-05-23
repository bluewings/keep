var express = require('express');
var router = express.Router();

function render(req, res) {

	res.render('index', {
		title: 'Express',
		stylesheets: ['/stylesheets/keep.css'],
		javascripts: ['/javascripts/keep.util.js', '/javascripts/keep.js']
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