var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
var router = express.Router();
var fs = require('fs');

//var io = require('socket.io').listen(80); // initiate socket.io server

var student_model = require('./models/student_model.js');
var rule_model = require("./models/rule_model.js");
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
	  if (err) return err;
	  if (student == null) {
	  	res.redirect('/' + req.session.current_site);
	  } else {
	  	req.session.current_site = "home";
	  	find_submission(req, res, 'home');
	  }
	 });
});

function find_submission(req, res, site) {
	rule_model.find({}, function (err, rule) {
	  if (err) return err;
	  var rules = rule; work_list = [];
	  for (var i = 0; i < rules.length; i ++) {
	  	work_list.push(rules[i].work_name);
	  }
	  res.render(site, {
			title: site,
			work_list: work_list
		});
	 });

}

router.post('/go_to_instruction', function(req, res, next) {
	console.log("-------33333333333------");
	res.redirect('/instruction');
});


router.post('/go_to_self_review', function(req, res, next) {
	for (var key in req.body) {
		req.session.work_name = key;	
		if (req.body[key] == "self") {
			console.log("=============================");
			console.log(req.session);
			res.redirect('/self_review');
		} else {
			res.redirect('/instruction');
		}
	}
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


