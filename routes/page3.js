var express = require('express');
var router = express.Router();

/* GET users listing. */
router.post('/page3', function(req, res) {
	res.render('page3', {
	  title: 'The 3rd page'
	});
});

module.exports = router;
