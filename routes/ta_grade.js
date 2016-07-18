var express = require('express');
var router = express.Router();
var PeerEditing = express();
var mongoose = require('mongoose');


var fs = require('fs');

var code_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");

var rule_model = require("./models/rule_model.js");
var ta_model = require('./models/ta_model.js');

var first_time = 1;
/* GET users listing. */

router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
	}
	ta_model.findOne({ email: req.user.emails[0].value }, function (err, ta) {
	  if (err) return err;
	  if (ta == null) {
	  	res.redirect('/' + req.session.current_site);
	  } else {
	  	if (req.session.current_site != "ta_grade") {
	  		init_all(req, res, 'ta_grade');
	  	} else {
	  		get_ta_utorid(req, res, 'ta_grade');
	  	}
	  }
	 });
});

function init_all(req, res, site) {
	req.session.ta_review_display_starting_index = 0;
	req.session.current_site = site;
	req.session.self_utorid = '';
	req.session.review_array = [];
	req.session.feedbacks = [];
  	req.session.highlight_str = '';
  	req.session.peer_number = 1;
  	req.session.peer_sub_number = 1;
  	req.session.num_stars = 0;
  	req.session.mark = 0;
  	req.session.code_path = '';
  	req.session.feedback_questions = [];
  	req.session.student_review_by = [];
  	get_feedback_questions(req, res, site);
}

function get_feedback_questions(req, res, site) {
	rule_model.findOne({ work_name: req.session.work_name }, function (err, rule) {
	  if (err) return err;
	  req.session.feedback_questions = rule.feedback_questions;
	  get_ta_utorid(req, res, site);
	 });
}

function get_ta_utorid(req, res, site) {
	ta_model.findOne({ email: req.user.emails[0].value }, function (err, ta) {
	  if (err) return err;
	  req.session.self_utorid = ta.utorid;
	  if (req.session.review_array.length == 0) {
	  	get_to_reviews(req, res, site);
	  } else {
	  	find_to_review_code_path(req, res, site);
	  }
	 });
}

function get_to_reviews(req, res, site) {
  var code_model = mongoose.model(req.session.work_name, code_schema);
  code_model.find({ ta: req.session.self_utorid }, function(err, code) {
  	var reviews = code; var review_array = [];
  	for (var i = 0; i < reviews.length; i++) {
  		review_array.push(reviews[i].utorid);
  	}
  	req.session.review_array = review_array;
  	find_to_review_code_path(req, res, site);
  });
}

function find_to_review_code_path(req, res, site) {
  var code_model = mongoose.model(req.session.work_name, code_schema);
  code_model.findOne({ utorid: req.session.review_array[req.session.peer_number-1] }, function(err, code) {
  	req.session.code_path = code.code_path;
  	req.session.student_review_by = code.review_by;
  	find_student_review_by(req, res, site);
  });
}

function find_student_review_by(req, res, site) {
  var code_model = mongoose.model(req.session.work_name, code_schema);
  code_model.findOne({ utorid: req.session.review_array[req.session.peer_number-1] }, function(err, code) {
  	var review_by = code.review_by;
  	if (review_by.indexOf(req.session.self_utorid) > -1) {
  		review_by.splice(review_by.indexOf(req.session.self_utorid), 1);
  	}
  	req.session.student_review_by = review_by;
  	find_feedbacks(req, res, site);
  });
}

function find_feedbacks(req, res, site) {
  var review_model = mongoose.model(req.session.work_name + "_reviews", review_schema);
  review_model.findOne({ author: req.session.review_array[req.session.peer_number-1], 
  	    review_by: req.session.student_review_by[req.session.peer_sub_number-1] }, function(err, review) {
  	req.session.feedbacks = review.feedbacks;
  	// init the feedbacks list
  	if (req.session.feedbacks.length == 0) {
		for (var i=0; i < req.session.feedback_questions.length; i++) {
			req.session.feedbacks.push("");
		}
  	}
  	req.session.num_stars = review.num_stars;
  	req.session.highlight_str = review.highlights;
  	req.session.mark = review.mark;
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
			reviews: req.session.review_array,
			peer_num: req.session.peer_number,
			peer_sub_num: req.session.peer_sub_number,
			code: str,
			feedbacks: req.session.feedbacks,
			num_stars: req.session.num_stars,
			mark_num: req.session.mark,
			init_highligts: req.session.highlight_str,
			feedback_questions: req.session.feedback_questions,
			display_index : req.session.ta_review_display_starting_index,
			review_by : req.session.student_review_by
		});
	});
}

function save(req) {
	var review_model = mongoose.model(req.session.work_name + "_reviews", review_schema);
	review_model.findOneAndUpdate(
		{ author: req.session.review_array[req.session.peer_number-1],
		  review_by: req.session.student_review_by[req.session.peer_sub_number-1]},
		{ $set: { mark: req.session.mark } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
		}
	);
}

router.post('/go_to_ta_grade', function(req, res, next) {
	var temp_feedback_array = [];
	for (var key in req.body) {
		if (key.indexOf("feedback") > -1) {
			temp_feedback_array.push(req.body[key]);
		}
	}
	console.log(req.session.mark);
	req.session.mark = req.body.mark_num;
	console.log(req.session.mark);
	save(req);
	// find peer num
	var i = 1; var found = 0;
	while ((i <= 10) && (found == 0)) {
		var key = "peer_" + String(i);
		if (key in req.body) {
			req.session.peer_number = req.session.ta_review_display_starting_index + i;
			found = 1;
		} 
		i ++;
  	}
  	// find sub peer num
  	var i = 1; var found = 0;
  	while ((i <= req.session.student_review_by.length) && (found == 0)) {
		var key = "peer_sub_" + String(i);
		if (key in req.body) {
			req.session.peer_sub_number = i;
			found = 1;
		} 
		i ++;		
  	}
	var next = "next_btn";
	var prev = "prev_btn";
	var next_10 = "next_10_btn";
	var prev_10 = "prev_10_btn";
	var next_sub = "next_sub_btn";
	var prev_sub = "prev_sub_btn";
  	if (next_sub in req.body) {
  		req.session.peer_sub_number ++;
  		if (req.session.peer_sub_number > req.session.student_review_by.length) {
			req.session.peer_sub_number = 1;
		}
  	} else if (prev_sub in req.body) {
  		req.session.peer_sub_number --;
		if (req.session.peer_sub_number == 0) {
			req.session.peer_sub_number = req.session.student_review_by.length;
		}
  	} else if (next in req.body) {
		req.session.peer_number ++;
		req.session.peer_sub_number = 1;
		if (req.session.peer_number > req.session.review_array.length) {
			req.session.peer_number = 1;
		}
	} else if (prev in req.body) {
		req.session.peer_number --;
		req.session.peer_sub_number = 1;
		if (req.session.peer_number == 0) {
			req.session.peer_number = req.session.review_array.length;
		}
	} else if (next_10 in req.body) {
		req.session.peer_number += 10;
		req.session.peer_sub_number = 1;
		req.session.peer_number -= ((req.session.peer_number % 10) - 1);
		if (req.session.peer_number > req.session.review_array.length) {
			req.session.peer_number = 1;
		}
	} else if (prev_10 in req.body) {
		req.session.peer_number -= 10;
		req.session.peer_sub_number = 1;
		if (req.session.peer_number < 0) {
			req.session.peer_number = req.session.review_array.length - ((req.session.review_array.length % 10) - 1);
		}
		req.session.peer_number -= ((req.session.peer_number % 10) - 1);
	}

	if ((req.session.peer_number >= 10) && (req.session.peer_number % 10 == 0)) {
		req.session.ta_review_display_starting_index = (((req.session.peer_number / 10) - 1) * 10);
	} else {
		req.session.ta_review_display_starting_index = (Math.floor(req.session.peer_number / 10) * 10);
	}
	
	res.redirect('/ta_grade');
});


module.exports = router;

