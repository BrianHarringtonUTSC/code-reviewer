var express = require('express');
var router = express.Router();

/* GET users listing. */
router.post('/users', function(req, res) {
	res.render('users', {
	  title: 'Users page'
	});
});

module.exports = router;
