var express = require('express');
var router = express.Router();
var PeerEditing = express();
var mongoose = require('mongoose');


var fs = require('fs');

var code_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");

var rule_model = require("./models/rule_model.js");
var student_model = require('./models/student_model.js');

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
	  	res.redirect('/' + req.session.current_site);
	  } else {
	  	if (req.session.current_site != "peer_review") {
	  		init_all(req, res, 'peer_review');
	  	} else {
	  		get_student_utorid(req, res, 'peer_review');
	  	}
	  }
	 });

});


router.post('/go_to_self_assesment', function(req, res, next) {
	res.redirect('/self_assesment');
});

router.post('/go_to_index', function(req, res, next) {
	res.redirect('/');
});


function init_all(req, res, site) {
	req.session.current_site = site;
	req.session.self_utorid = '';
	req.session.review_array = [];
	req.session.feedbacks = [];
  	req.session.highlight_str = '';
  	req.session.peer_number = 1;
  	req.session.num_stars = 0;
  	req.session.code_path = '';
  	req.session.feedback_questions = [];
  	get_feedback_questions(req, res, site);

}

function get_feedback_questions(req, res, site) {

	rule_model.findOne({ work_name: req.session.work_name }, function (err, rule) {
	  if (err) return err;
	  req.session.feedback_questions = rule.feedback_questions;
	  get_student_utorid(req, res, site);
	 });
}

function get_student_utorid(req, res, site) {
	student_model.findOne({ email: req.user.emails[0].value }, function (err, student) {
	  if (err) return err;
	  req.session.self_utorid = student.utorid;
	  find_student_code(req, res, site);
	 });
}

function find_student_code(req, res, site){
	var code_model = mongoose.model(req.session.work_name, code_schema);
  code_model.findOne({ utorid: req.session.self_utorid }, function(err, code) {
  	req.session.review_array = code.to_review;
  	find_to_review_code_path(req, res, site);
  });
}

function find_to_review_code_path(req, res, site) {
	var code_model = mongoose.model(req.session.work_name, code_schema);
  code_model.findOne({ utorid: req.session.review_array[req.session.peer_number-1] }, function(err, code) {
  	req.session.code_path = code.code_path;
  	find_feedbacks(req, res, site);
  });
}

function find_feedbacks(req, res, site) {
	 var review_model = mongoose.model(req.session.work_name + "_reviews", review_schema);
  review_model.findOne({ author: req.session.review_array[req.session.peer_number-1], review_by: req.session.self_utorid }, function(err, review) {
  	req.session.feedbacks = review.feedbacks;
  	// init the feedbacks list
  	if (req.session.feedbacks.length == 0) {
		for (var i=0; i < req.session.feedback_questions.length; i++) {
			req.session.feedbacks.push("");
		}
  	}
  	req.session.num_stars = review.num_stars;
  	req.session.highlight_str = review.highlights;
  	read_file(req, res, site);
  });
}

var readline = require('readline');
var stream = require('stream');

function read_file(req, res, site) {
	var instream = fs.createReadStream(req.session.code_path);
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);
	var str = ""
	rl.on('line', function(line) {
	  str += line + "\n";
	});

	rl.on('close', function() {
		res.render(site, {
			title: site,
			entries: req.session.review_array,
			peer_num: req.session.peer_number,
			code: str,
			feedbacks: req.session.feedbacks,
			number_of_stars: req.session.num_stars,
			init_highligts: req.session.highlight_str,
			feedback_questions: req.session.feedback_questions
		});
	});
}

function save(req) {
	 var review_model = mongoose.model(req.session.work_name + "_reviews", review_schema);
	review_model.findOneAndUpdate(
		{ author: req.session.review_array[req.session.peer_number-1],
		  review_by: req.session.self_utorid},
		{ $set: {feedbacks: req.session.feedbacks,
		num_stars: req.session.num_stars,
		highlights: req.session.highlight_str } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
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
	req.session.feedbacks = temp_feedback_array;
	req.session.highlight_str = req.body.highlight_storage;
	req.session.num_stars = req.body.star_num;

	save(req);
	for (var i = 1; i <= req.session.review_array.length; i++) {
  	var key = "peer_" + String(i);
  	if (key in req.body) {
    	req.session.peer_number = i;
  	}
	}


	res.redirect('/peer_review');
});


module.exports = router;

