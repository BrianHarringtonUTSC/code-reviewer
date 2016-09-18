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
var moment = require('moment');
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
	  		check_release(req, res, 'home');
	  	}
	  }
	 });
});

function get_student_utorid(req, res, site) {
	student_model.findOne({ email: req.user.emails[0].value }, function (err, student) {
	  if (err) return err;
	  req.session.self_utorid = student.utorid;
	  req.session.submitted = 1;
	  req.session.release_self = 1;
	  find_all_work(req, res, site);
	 });
}

function check_release(req, res, site) {
	rule_model.find({}, function (err, rules) {
	  if (err) return err;
		res.render(site, {
			title: site,
			rules : rules,
			marks : req.session.marks,
			submitted : req.session.submitted,
			release_self : req.session.release_self
		});
	});
}

function find_all_work(req, res, site) {
	rule_model.find({}, function (err, rules) {
	  if (err) return err;
		get_marks(req, res, site, rules);
	});
}

function get_marks(req, res, site, rules) {
	req.session.marks = {};
	var count = 0;
	for (var i = 0; i < rules.length; i ++) {
	  var code_model = mongoose.model(rules[i].work_name, code_schema);
	  code_model.findOne({ utorid: req.session.self_utorid }, function (err, code) {
		  if (err) return err;
		  console.log(code);
		  if (code != null) {
		  	req.session.marks[rules[count].work_name] = code.mark;
		  }
		  count ++;
		  if (count == rules.length) {
		  	console.log(req.session.marks);
			res.render(site, {
				title: site,
				rules : rules,
				marks : req.session.marks,
				submitted : req.session.submitted,
				release_self : req.session.release_self
			});
		  }
	 });
	}
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
					submitted : req.session.submitted,
					release_self : req.session.release_self
				});
		    }
		});
	}
}


router.post('/go_to_review', function(req, res, next) {
	console.log(req.session.self_utorid);
	for (var key in req.body) {
		req.session.work_name = String(key).substring(0, key.indexOf("_"));
		console.log(req.session.work_name);
		if (key.indexOf("self") > -1) {
			check_submitted(req, res, '/self_review');
		} else if (key.indexOf("peer") > -1) {
			check_submitted(req, res, '/instruction');
		} else {
			check_submitted(req, res, '/review_result');
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
  		if (site.indexOf('self') > -1) {
			check_release_self(req, res, site);
  		} else if (site == '/instruction') {
  			check_deadline(req, res, site);
  		} else {
  			res.redirect(site);
  		}
  	}
  });
}

function check_deadline(req, res, site) {
	var current_time = moment();
	rule_model.findOne({work_name : req.session.work_name}, function (err, rule) {
	  if (err) return err;
	  if (current_time.isBefore(moment(rule.peer_review_deadline, "YYYY-MM-DD HH:mm"))) {
	  	req.session.peer_review_deadline_passed = 0;
	  } else {
	  	req.session.peer_review_deadline_passed = 1;
	  }
	  res.redirect(site);
	});
}

function check_release_self(req, res, site) {
	rule_model.findOne({work_name : req.session.work_name}, function (err, rule) {
	  if (err) return err;
	  if (rule.release_self_review) {
	  	req.session.release_self = 1;
	  	res.redirect(site);
	  } else {
	  	req.session.release_self = 0;
	  	res.redirect('/home');
	  }
	});
}

module.exports = router;


