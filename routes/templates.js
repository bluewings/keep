var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/:id', function(req, res) {
  
  res.render('templates/' + req.params.id);  
  //res.send('respond with a resource');
});

module.exports = router;
