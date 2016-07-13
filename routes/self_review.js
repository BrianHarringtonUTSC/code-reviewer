var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var fs = require('fs');
// import module mongodb
var code_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");

var work_name = 'a2';
var rule_model = require("./models/rule_model.js");
var code_model = mongoose.model(work_name, code_schema);
var review_model = mongoose.model('a2_reviews', review_schema);
var student_model = require('./models/student_model.js');


var num_of_peers = 10;
var peer_number = 1;
var review_array = [];
var feedbacks = [];
var num_of_stars = [];
var highlight_str = "";
//var self_utorid = "luijerr1";
//var self_utorid = "lossevki";
var self_utorid = "";
var code_path = "";
var feedback_questions = [];
var first_time = 1;

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
	  	res.redirect('/instructor')
	  } else {
	  	if (first_time) {
	  		first_time = 0;
	  		get_feedback_questions(req, res, 'peer_review');
	  	} else {
	  		get_student_utorid(req, res, 'peer_review');
	  	}
	  }
	 });

});

router.post('/go_to_self_review', function(req, res, next) {
	console.log(req.body);
	for (var i = 1; i <= num_of_peers; i++) {
	  var key = "peer_" + String(i);
	  if (key in req.body) {
	    peer_number = i;
	  }
	}
	res.redirect('/self_review');
});

function get_feedback_questions(req, res, site) {
	rule_model.findOne({ work_name: work_name }, function (err, rule) {
	  if (err) return err;
	  feedback_questions = rule.feedback_questions;
	  get_student_utorid(req, res, site);
	 });
}

function get_student_utorid(req, res, site) {
	student_model.findOne({ email: req.user.emails[0].value }, function (err, student) {
	  if (err) return err;
	  self_utorid = student.utorid;
	  find_student_code(res, site);
	 });
}

function find_student_code(res, site) {
  code_model.findOne({ utorid: self_utorid }, function(err, code) {
  	review_array = code.review_by;
  	code_path = code.code_path;
  	find_feedback(res, site);
  });
}

function find_feedback(res, site) {
  review_model.findOne({ author: self_utorid, review_by:review_array[peer_number-1] }, function(err, review) {
	  feedbacks= review.feedbacks;
	  num_of_stars = review.num_stars;
	  highlight_str = review.highlights;
	  read_file(res, site);
  });
  
}

var readline = require('readline');
var stream = require('stream');

function read_file(res, site) {
	var instream = fs.createReadStream(code_path);
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);
	var str = ""
	rl.on('line', function(line) {
	  str += line + "\n";
	  //console.log(line);
	});

	rl.on('close', function() {
		res.render(site, {
			title: site,
			entries: review_array,
			code: str,
			peer_num: peer_number,
			feedbacks: feedbacks,
			number_of_stars: num_of_stars,
			init_highligts: highlight_str,
			feedback_questions: feedback_questions
		});
	  // do something on finish here
	  //console.log(str);
	  //console.log("finished");
	  //console.log(str_array.length);
	});
}

module.exports = router;
