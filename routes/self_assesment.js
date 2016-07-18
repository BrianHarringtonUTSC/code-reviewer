var express = require('express');
var router = express.Router();

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
	  	req.session.current_site = "self_assesment";
	  	res.render('self_assesment');
	  }
	 });
});

router.post('/go_to_home', function(req, res, next) {
  res.redirect('/home');
});
module.exports = router;
