var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
var router = express.Router();
var fs = require('fs');

//var io = require('socket.io').listen(80); // initiate socket.io server
var code_schema = require("./models/submission_schema.js");
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
	  	if (req.session.current_site != "home") {
	  		req.session.current_site = "home";
	  		get_student_utorid(req, res, 'home');
	  	} else {
	  		find_submission(req, res, 'home');
	  	}
	  }
	 });
});

function get_student_utorid(req, res, site) {
	student_model.findOne({ email: req.user.emails[0].value }, function (err, student) {
	  if (err) return err;
	  req.session.self_utorid = student.utorid;
	  req.session.submitted = 1;
	  find_submission(req, res, site);
	 });
}

function find_submission(req, res, site) {
	rule_model.find({}, function (err, rule) {
	  if (err) return err;
	  var work_list = [];
	  for (var i = 0; i < rule.length; i ++) {
	  	work_list.push(rule[i].work_name);
	  }
	  check_loaded(req, res, site, work_list);
	});

}

function check_loaded(req, res, site, work_list) {
	var loaded_work = []; var counter = 0;
	for (var i = 0; i < work_list.length; i ++) {
		mongoose.connection.db.listCollections({name: work_list[i]})
		.next(function(err, collinfo) {
			counter ++;
		    if (collinfo) {
		        loaded_work.push(work_list[counter-1]);
		    } 
		    if (counter == work_list.length) {
				res.render(site, {
					title: site,
					work_list: loaded_work,
					submitted : req.session.submitted
				});
		    }
		});
	}
}


router.post('/go_to_review', function(req, res, next) {
	console.log(req.session.self_utorid);
	for (var key in req.body) {
		req.session.work_name = key;	
		if (req.body[key] == "self") {
			check_submitted(req, res, '/self_review');
		} else {
			check_submitted(req, res, '/instruction');
		}
	}
});


function check_submitted(req, res, site) {
	var code_model = mongoose.model(req.session.work_name, code_schema);
  	code_model.findOne({ utorid: req.session.self_utorid }, function(err, code) {
  	if (code == null) {
  		req.session.submitted = 0;
  		res.redirect('/home');
  	} else {
  		res.redirect(site);
  	}

  });
}

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


