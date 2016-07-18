var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
var router = express.Router();
var fs = require('fs');


var student_model = require('./models/student_model.js');
var ta_model = require('./models/ta_model.js');

//Here we are configuring express to use body-parser as middle-ware.
router.use(bodyParser.urlencoded( {extended: true} ));

// middleware to use for all requests
router.use(function(req, res, next) {
	console.log('\nAaaand here we go...');
	next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
	// user authentication
	if (req.isAuthenticated()) {
		verify_student(req, res);
  } else {
  	 res.render('index');
  }
});

function verify_student(req, res) {
	student_model.findOne({ email: req.user.emails[0].value }, function (err, student) {
	  if (err) return err;
	  if (student == null) {
	  	verify_ta(req, res);
	  } else {
	  	return res.redirect('/home');
	  }
	 });
}

function verify_ta(req, res) {
	ta_model.findOne({ email: req.user.emails[0].value }, function (err, ta) {
	  if (err) return err;
	  if (ta == null) {
	  	verify_instructor(req, res);
	  } else {
	  	return res.redirect('/ta');
	  }
	 });
}

function verify_instructor(req, res) {
	if (req.user.emails[0].value == "vincent.tse@mail.utoronto.ca"){
  	return res.redirect('/instructor');
  	}
}

router.post('/logout', function(req, res, next) {
  req.session.destroy( function(err) {
    if (err) return err;
    res.redirect('/');
  });
});


module.exports = router;


