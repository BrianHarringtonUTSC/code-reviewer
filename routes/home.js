var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var router = express.Router();


var student_model = require('./models/student_model.js');


/* GET home page. */
router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
  }
  // find user by email
	student_model.findOne({ email: req.user.emails[0].value }, function (err, student) {
		// error checking
	  if (err) return err;
	  // this student is not registered in this class
	  if (student == null) {
	  	console.log("this student is not registered in this class");
	  	res.redirect('/');
	  } else {
	  	// loop through collection rules
  		var rule_model = require('./models/rule_model.js');
	  	// find all documents in collection rules
	  	rule_model.find({}, function(err, rules) {
	  		if (err) return err;
	  		res.render('home', {
	  			title : 'home',
	  			rules : rules
	  		});
	  	});
	  }
	 });
});

// go to corresponding submission page
router.post('/go_to_submission', function(req, res, next) {
	// write the name of clicked button into into flash message
	// req.flash('submission_name', req.body['redirect_to_submission']);
	req.session.submission_name = req.body['redirect_to_submission'];
	res.redirect('/submission');
});


console.log("Connection opened.");

module.exports = router;


