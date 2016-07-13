var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
var router = express.Router();
var fs = require('fs');

//var io = require('socket.io').listen(80); // initiate socket.io server

var student_model = require('./models/student_model.js');
//Here we are configuring express to use body-parser as middle-ware.
router.use(bodyParser.urlencoded( {extended: true} ));

/* GET home page. */
router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
  }
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
	req.flash('submission_name', "blhaaaaaa");
	res.redirect('/submission');
});

router.post('/go_to_instruction', function(req, res, next) {
	console.log("-------33333333333------");
	res.redirect('/instruction');
});


router.post('/go_to_self_review', function(req, res, next) {
	res.redirect('/self_review');
});



console.log("Connection opened.");
/*
io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' }); // Send data to client

  // wait for the event raised by the client
  socket.on('my other event', function (data) {  
    console.log(data);
  });
});
*/
module.exports = router;


