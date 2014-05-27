var express = require('express');
var router = express.Router();
//var multiparty = require('multiparty');
//var format = require('util').format;

function render(req, res) {

	res.render('index', {
		title: 'Express',
		stylesheets: ['/stylesheets/keep.css'],
		javascripts: ['/javascripts/keep.util.js', '/javascripts/keep.js']
	});
}

router.get('/', function (req, res) {
	res.send('<form method="post" enctype="multipart/form-data">' + '<p>Title: <input type="text" name="title" /></p>' + '<p>Image: <input type="file" name="image" /></p>' + '<p><input type="submit" value="Upload" /></p>' + '</form>');
});

router.post('/', function (req, res, next) {
	//console.log(req);
console.log(req.files);
		res.send(JSON.stringify(req.files));
  /*req.form.on('end', function() {
      
  });*/


	/*var form = new multiparty.Form();
	var image;
	var title;

	form.on('error', next);
	form.on('close', function () {
		res.send(format('\nuploaded %s (%d Kb) as %s', image.filename, image.size / 1024 | 0, title));
	});

	// listen on part event for image file
	form.on('part', function (part) {
		if (!part.filename) return;
		if (part.name !== 'image') return part.resume();
		image = {};
		image.filename = part.filename;
		image.size = 0;
		part.on('data', function (buf) {
			image.size += buf.length;
		});
	});


	// parse the form
	form.parse(req);*/
});

module.exports = router;