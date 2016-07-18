var express = require('express');
var router = express.Router();
var PeerEditing = express();


var student_model = require('./models/student_model.js');
/* GET users listing. */
router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
  }
	student_model.findOne({ email: req.user.emails[0].value }, function (err, student) {
	  if (err) return err;
	  if (student == null) {
	  	res.redirect('/' + req.session.current_site);
	  } else {
	  	req.session.current_site = "instruction";
	  	res.render('instruction');
	  }
	 });
});

router.post('/go_to_peer_review', function(req, res, next) {
	res.redirect('/peer_review');
});

module.exports = router;
