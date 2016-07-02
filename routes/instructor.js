var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');



/* GET users listing. */
router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
  }
  var user_email = req.user.emails[0].value;
  // verify if they are registered in this class
  var student_model = require('./models/student_model.js');
  student_model.findOne({Email: user_email}, function(err, student) {
  	if (err) {
  		console.log(err);
  		return;
  	} 
  	// students are not in this class cannot log in
  	// TODO add flash messages, so users know what to do
  	else if (student === null) {
  		console.log("You're not in this class.");
  		// res.redirect('/');
  		// return;
  	// the student is found, do something
  	} else {
  		console.log('the student is found' + student.email);
  	}
  });
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
});

module.exports = router;
