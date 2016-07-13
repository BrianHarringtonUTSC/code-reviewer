var express = require('express');
var router = express.Router();
var PeerEditing = express();
var mongoose = require('mongoose');


var fs = require('fs');

var code_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");

var work_name = 'a2';
var rule_model = require("./models/rule_model.js");
var code_model = mongoose.model(work_name, code_schema);
var review_model = mongoose.model('a2_reviews', review_schema);
var student_model = require('./models/student_model.js');

var num_of_peers = 10;
var peer_number = 1;
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

router.post('/go_to_self_assesment', function(req, res, next) {
	console.log(req.body.testing);
	res.redirect('/self_assesment');
});

router.post('/go_to_index', function(req, res, next) {
	res.redirect('/');
});

var num_of_stars = 0;
var review_array = [];
var self_utorid = '';
var code_path = '';
var feedbacks = [];
var highlight_str = '';
var feedback_questions = [];

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

function find_student_code(res, site){
  code_model.findOne({ utorid: self_utorid }, function(err, code) {
  	review_array = code.to_review;
  	find_to_review_code_path(res, site);
  });
}

function find_to_review_code_path(res, site) {
  code_model.findOne({ utorid: review_array[peer_number-1] }, function(err, code) {
  	code_path = code.code_path;
  	find_feedbacks(res, site);
  });
}

function find_feedbacks(res, site) {
  review_model.findOne({ author: review_array[peer_number-1], review_by: self_utorid }, function(err, review) {
  	feedbacks = review.feedbacks;
  	// init the feedbacks list
  	if (feedbacks.length == 0) {
		for (var i=0; i < feedback_questions.length; i++) {
			feedbacks.push("");
		}
  	}
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
	});

	rl.on('close', function() {
		res.render(site, {
			title: site,
			entries: review_array,
			peer_num: peer_number,
			code: str,
			feedbacks: feedbacks,
			number_of_stars: num_of_stars,
			init_highligts: highlight_str,
			feedback_questions: feedback_questions
		});
	});
}

function save() {
	review_model.findOneAndUpdate(
		{ author: review_array[peer_number-1],
		  review_by: self_utorid},
		{ $set: {feedbacks: feedbacks,
		num_stars: num_of_stars,
		highlights: highlight_str } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
			console.log(doc);
		}
	);
}

router.post('/go_to_peer_review', function(req, res, next) {
	var temp_feedback_array = [];
	for (var key in req.body) {
		if (key.indexOf("feedback") > -1) {
			temp_feedback_array.push(req.body[key]);
		}
	}
	console.log(req.body.highlight_storage);
	feedbacks = temp_feedback_array;
	highlight_str = req.body.highlight_storage;
	num_of_stars = req.body.star_num;

	save();
	console.log(req.body);
	for (var i = 1; i <= num_of_peers; i++) {
  	var key = "peer_" + String(i);
  	if (key in req.body) {
    	peer_number = i;
  	}
	}


	res.redirect('/peer_review');
});


module.exports = router;

