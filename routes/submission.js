var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();



// get this page
router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
  }
  var student_model = require('./models/student_model.js');
	student_model.findOne({ email: req.user.emails[0].value }, function (err, student) {
		// error checking
	  if (err) return err;
	  // this student is not registered in this class
	  if (student == null) {
	  	console.log("this student is not registered in this class");
	  	res.redirect('/');
	  } else { // this student is registered in this class
	  	console.log("req.session is ");
	  	console.log(req.session['submission_name']);
	  	return;
	  	//var submission_name = req.flash('submission_name');
	  	// redirect to home page if no submission name is specified
	  	if (submission_name.length == 0) {
	  		console.log("please specify a submission name");
	  		res.redirect('/home');
	  	} else {
	  		// pop out submission name from length 1 array
	  		var submission_name = submission_name.pop();
	  		console.log("the submission name is " + submission_name);
	  		// write submission name to flash message for future use
	  		//req.flash('submission_name', submission_name);
	  		res.render('submission', {
	  			title : 'submission',
	  			submission_name : submission_name
	  		});
	  	}
	  }
	 });
});


router.post('/go_to_instruction', function(req, res, next) {
	req.flash('submission_name', submission_name);
	res.redirect('/instruction');
});


router.post('/go_to_self_review', function(req, res, next) {
	req.flash('submission_name', submission_name);
	res.redirect('/self_review');
});




module.exports = router;