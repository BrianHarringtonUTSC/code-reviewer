var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');



// get instructor home page
router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
  }
  var instructor_model = require('./models/instructor_model.js');
	instructor_model.findOne({ email: req.user.emails[0].value }, function (err, instructor) {
		// error checking
	  if (err) return err;
	  // this student is not registered in this class
	  if (instructor == null) {
	  	console.log("You are not in the instructors list");
	  	res.redirect('/');
	  } else { // this instructor is registered in this class
	  	// loop through collection rules
		  var rule_model = require('./models/rule_model.js');
		  // find all documents in collection rules
			rule_model.find({}, function (err, rules) {
			  if (err) return err;
			  res.render('instructor', { 
			  	title : 'instructor',
			  	rules : rules
			  });
			});
	  }
	});
});


module.exports = router;
