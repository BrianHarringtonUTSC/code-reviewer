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
	console.log("aaaaaaaaaaaaaaaaa");
	ta_model.findOne({ email: req.user.emails[0].value }, function (err, ta) {
	  if (err) return err;
	  if (ta == null) {
	  	res.redirect('/' + req.session.current_site);
	  } else {
	  	if (req.session.current_site != "ta_review") {
	  		init_all(req, res, 'ta_review');
	  	} else {
	  		get_ta_utorid(req, res, 'ta_review');
	  	}
	  }
	 });
});

function init_all(req, res, site) {
	req.session.reviewed = {};
	req.session.done_reviewed = 0;
	req.session.is_done = 0;
	req.session.ta_review_display_starting_index = 0;
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
  	if (review.author in req.session.reviewed) {
   		console.log("-----------do nothing");
  		read_file(req, res, site);
  	} else {
  		console.log("--------------init reviewed");
  		get_num_stars_for_all_peers(req, res, site);
  	}
  	
  });
}

function get_num_stars_for_all_peers(req, res, site) {
  var review_model = mongoose.model(req.session.work_name + "_reviews", review_schema);
  var count = 0;
  for (var i = 0; i < req.session.review_array.length; i ++) {
	  review_model.findOne({ author: req.session.review_array[i], review_by: req.session.self_utorid }, function(err, review) {
	  	req.session.reviewed[review.author] = review.num_stars;
	  	if (review.num_stars > 0) {
	  		req.session.done_reviewed ++;
	  	}
	  	count ++;
	  	if (count == req.session.review_array.length) {
	  		read_file(req, res, site);
	  	}
	  });	
  }
  
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
			code: str,
			feedbacks: req.session.feedbacks,
			num_stars: req.session.num_stars,
			init_highligts: req.session.highlight_str,
			feedback_questions: req.session.feedback_questions,
			display_index : req.session.ta_review_display_starting_index,
			reviewed : req.session.reviewed,
			done_reviewed: req.session.done_reviewed,
			is_done : req.session.is_done
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


router.post('/go_to_ta_review', function(req, res, next) {
	var temp_feedback_array = []; 
	for (var key in req.body) {
		if (key.indexOf("feedback") > -1) {
			temp_feedback_array.push(req.body[key]);
		}
	}
	req.session.feedbacks = temp_feedback_array;
	req.session.highlight_str = req.body.highlight_storage;
	req.session.num_stars = parseInt(req.body.star_num);
	if ((req.session.reviewed[req.session.review_array[req.session.peer_number-1]] == 0) 
		&& (req.session.num_stars > 0)) {
		req.session.done_reviewed ++;
	}
	console.log(req.session.done_reviewed);
	req.session.reviewed[req.session.review_array[req.session.peer_number-1]] = req.session.num_stars;



	save(req);
	var i = 1; var found = 0;
	var next = "next_btn";
	var prev = "prev_btn";
	var next_10 = "next_10_btn";
	var prev_10 = "prev_10_btn";
	var not_done = "not_done_btn";
	while ((i <= 10) && (found == 0)) {
		var key = "peer_" + String(i);

		if (key in req.body) {
			req.session.peer_number = req.session.ta_review_display_starting_index + i;
			found = 1;
		} 
		i ++;
  	}

	if (next in req.body) {
		req.session.peer_number ++;
		if (req.session.peer_number > req.session.review_array.length) {
			req.session.peer_number = 1;
		}
	} else if (prev in req.body) {
		req.session.peer_number --;
		if (req.session.peer_number == 0) {
			req.session.peer_number = req.session.review_array.length;
		}
	} else if (next_10 in req.body) {
		req.session.peer_number += 10;
		
		if (req.session.peer_number >= req.session.review_array.length) {
			req.session.peer_number = 1;
		}
		if ((req.session.peer_number >= 10) && (req.session.peer_number % 10 == 0)) {
			req.session.peer_number -= 10;
		}

		req.session.peer_number -= ((req.session.peer_number % 10) - 1);
	} else if (prev_10 in req.body) {
		req.session.peer_number -= 10;
		if (req.session.peer_number <= 0) {
			req.session.peer_number = req.session.review_array.length;
		}
		if ((req.session.peer_number >= 10) && (req.session.peer_number % 10 == 0)) {
			req.session.peer_number -= 10;
		}
		req.session.peer_number -= ((req.session.peer_number % 10) - 1);
	} else if (not_done in req.body) {
		var done_count = 0;
		for (var review in req.session.reviewed) {
			done_count ++;
			if (req.session.reviewed[review] == 0) {
				req.session.peer_number = req.session.review_array.indexOf(review) + 1;
				break;
			}
		}
		if (done_count == req.session.review_array.length) {
			req.session.is_done = 1;
		}
		console.log("----");
		console.log(done_count);
		console.log(req.session.reviewed);
		console.log(req.session.is_done);
	}

	if ((req.session.peer_number >= 10) && (req.session.peer_number % 10 == 0)) {
		req.session.ta_review_display_starting_index = (((req.session.peer_number / 10) - 1) * 10);
	} else {
		req.session.ta_review_display_starting_index = (Math.floor(req.session.peer_number / 10) * 10);
	}
	res.redirect('/ta_review');
});


module.exports = router;

