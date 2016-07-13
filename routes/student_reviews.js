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
var is_saved = 0;
/* GET users listing. */

router.get('/', function(req, res, next) {
	console.log("-----------1");
	check_student_utorid(res, 'student_reviews');
});

router.post('/go_to_index', function(req, res, next) {
	res.redirect('/');
});
var self_or_peer = null; // 0 = self, 1 = peer
var num_of_stars = 0;
var review_array = [];
var self_utorid = '';
var code_path = '';
var feedbacks = [];
var highlight_str = '';
var empty = 1;
var feedback_questions = [];

function check_student_utorid(res, site) {
	student_model.findOne({ utorid: self_utorid }, function (err, student) {
	  if (err) return err;
	  if (student == null) {
	  	empty = 1;
	  	self_or_peer = null;
	  	console.log("-----------2 utorid not found");
	  	res.render(site, {
				title: site,
				init_highligts: highlight_str,
				utorid: self_utorid,
				is_empty: empty,
				s_or_p: self_or_peer
			});
	  } else {
	  	empty = 0;
	  	console.log("-----------2 utorid found");
	  	get_feedback_questions(res, site);
	  }
	 });
}

function get_feedback_questions(res, site) {
	rule_model.findOne({ work_name: work_name }, function (err, rule) {
	  if (err) return err;
	  feedback_questions = rule.feedback_questions;
	  find_student_code(res, site);
	 });
}

function find_student_code(res, site){
  code_model.findOne({ utorid: self_utorid }, function(err, code) {
	  if (self_or_peer == 1) {
	  	console.log("-----------3");
  		review_array = code.to_review;
  		find_to_review_code_path(res, site);
  	} else {
  		review_array = code.review_by;
  		code_path = code.code_path;
  		find_feedbacks_self(res, site);
  	}
  });
}

function find_to_review_code_path(res, site) {
  code_model.findOne({ utorid: review_array[peer_number-1] }, function(err, code) {
  	code_path = code.code_path;
  	find_feedbacks_peer(res, site);
  });
}

function find_feedbacks_peer(res, site) {
  review_model.findOne({ author: review_array[peer_number-1], review_by: self_utorid }, function(err, review) {
  	feedbacks = review.feedbacks;
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

function find_feedbacks_self(res, site) {
  review_model.findOne({ author: self_utorid, review_by:review_array[peer_number-1] }, function(err, review) {
	  feedbacks= review.feedbacks;
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
			utorid: self_utorid,
			s_or_p: self_or_peer,
			is_empty: empty,
			feedback_questions: feedback_questions
		});
	});
}

function init_page(res, site) {
	res.render(site, {
		title: site,
		init_highligts: highlight_str,
		utorid: self_utorid,
		is_empty: empty
	});

}

function save() {
	if (self_or_peer == 1) {
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
	} else {
		review_model.findOneAndUpdate(
			{ author: self_utorid,
			  review_by: review_array[peer_number-1]},
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
}

router.post('/go_to_student_reviews', function(req, res, next) {
	console.log('--------------------post');
	if (empty == 0) {
		console.log('-----------------noooooo');
		var temp_feedback_array = [];
		for (var key in req.body) {
			if (key.indexOf("feedback") > -1) {
				temp_feedback_array.push(req.body[key]);
			}
		}
		console.log(req.body.highlight_storage);
		feedbacks = temp_feedback_array;
		highlight_str = req.body.highlight_storage;
		num_of_stars = parseInt(req.body.star_num);
		save();
	} 
	self_utorid = req.body.student_utorid;

	console.log(req.body);
	for (var i = 1; i <= num_of_peers; i++) {
  	var key = "peer_" + String(i);
  	if (key in req.body) {
    	peer_number = i;
  	}
	}
	if ("peer_btn" in req.body) {
		self_or_peer = 1;
	} else if ("self_btn" in req.body) {
		self_or_peer = 0;
	}


	res.redirect('/student_reviews');
});


module.exports = router;

