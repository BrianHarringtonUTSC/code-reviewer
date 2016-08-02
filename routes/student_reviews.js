var express = require('express');
var router = express.Router();
var PeerEditing = express();
var mongoose = require('mongoose');


var fs = require('fs');

var code_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");
var instructor_model = require("./models/instructor_model.js");
var rule_model = require("./models/rule_model.js");
var student_model = require('./models/student_model.js');


/* GET users listing. */

router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
	}
	instructor_model.findOne({ email: req.user.emails[0].value }, function (err, instructor) {
	  if (err) return err;
	  if (instructor == null) {
	  	res.redirect('/' + req.session.current_site);
	  } else {
	  	if (req.session.current_site != "student_reviews") {
	  		init_all(req, res, 'student_reviews');
	  	} else {
	  		check_student_utorid(req, res, 'student_reviews');
	  	}
	  }
	 });
});

router.post('/go_to_index', function(req, res, next) {
	res.redirect('/');
});


function init_all(req, res, site) {
	req.session.submitted = 1;
	req.session.current_site = site;
	req.session.self_or_peer = null; // 0 = self, 1 = peer
	req.session.num_stars = 0;
	req.session.review_array = [];
	req.session.self_utorid = '';
	req.session.code_path = '';
	req.session.feedbacks = [];
	req.session.highlight_str = '';
	req.session.empty = 1;
	req.session.feedback_questions = [];
	req.session.peer_number = 0;
	check_student_utorid(req, res, site);
}


function check_student_utorid(req, res, site) {
	student_model.findOne({ utorid: req.session.self_utorid }, function (err, student) {
	  if (err) return err;
	  if (student == null) {
	  	req.session.empty = 1;
	  	req.session.self_or_peer = null;
	  	console.log("-----------2 utorid not found");
	  	res.render(site, {
				title: site,
				init_highligts: req.session.highlight_str,
				utorid: req.session.self_utorid,
				is_empty: req.session.empty,
				s_or_p: req.session.self_or_peer,
				submitted : req.session.submitted 
			});
	  } else {
	  	req.session.empty = 0;
	  	console.log("-----------2 utorid found");
	  	console.log(req.session.self_utorid);
	  	console.log(req.session.work_name);
	  	check_submitted(req, res, site);
	  }
	 });
}

function check_submitted(req, res, site) {
	var code_model = mongoose.model(req.session.work_name, code_schema);
  	code_model.findOne({ utorid: req.session.self_utorid }, function(err, code) {
  	if (code == null) {
  		req.session.submitted = 0;
  		req.session.self_or_peer = null;
		res.render(site, {
			title: site,
			init_highligts: req.session.highlight_str,
			utorid: req.session.self_utorid,
			is_empty: req.session.empty,
			s_or_p: req.session.self_or_peer,
			submitted : req.session.submitted 
		});
  	} else {
  		req.session.submitted = 1;
  		get_feedback_questions(req, res, site);
  	}

  });
}

function get_feedback_questions(req, res, site) {
	rule_model.findOne({ work_name: req.session.work_name }, function (err, rule) {
	  if (err) return err;
	  console.log(rule);
	  req.session.feedback_questions = rule.feedback_questions;
	  find_student_code(req, res, site);
	 });
}

function find_student_code(req, res, site){
	var code_model = mongoose.model(req.session.work_name, code_schema);
  code_model.findOne({ utorid: req.session.self_utorid }, function(err, code) {
	  if (req.session.self_or_peer == 1) {
	  	console.log("-----------3");
  		req.session.review_array = code.to_review;
  		find_to_review_code_path(req, res, site);
  	} else {
  		req.session.review_array = code.review_by;
  		req.session.code_path = code.code_path;
  		find_feedbacks_self(req, res, site);
  	}
  });
}

function find_to_review_code_path(req, res, site) {
	var code_model = mongoose.model(req.session.work_name, code_schema);
  code_model.findOne({ utorid: req.session.review_array[req.session.peer_number-1] }, function(err, code) {
  	req.session.code_path = code.code_path;
  	find_feedbacks_peer(req, res, site);
  });
}

function find_feedbacks_peer(req, res, site) {
	var review_model = mongoose.model(req.session.work_name + '_reviews', review_schema);
  review_model.findOne({ author: req.session.review_array[req.session.peer_number-1], review_by: req.session.self_utorid }, function(err, review) {
  	req.session.feedbacks = review.feedbacks;
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

function find_feedbacks_self(req, res, site) {
	var review_model = mongoose.model(req.session.work_name + '_reviews', review_schema);
  review_model.findOne({ author: req.session.self_utorid, review_by:req.session.review_array[req.session.peer_number-1] }, function(err, review) {
	  req.session.feedbacks= review.feedbacks;
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
			utorid: req.session.self_utorid,
			s_or_p: req.session.self_or_peer ,
			is_empty: req.session.empty,
			feedback_questions: req.session.feedback_questions,
			submitted : req.session.submitted
		});
	});
}

function init_page(req, res, site) {
	res.render(site, {
		title: site,
		init_highligts: req.session.highlight_str,
		utorid: req.session.self_utorid,
		is_empty: req.session.empty
	});

}

function save(req) {
	var review_model = mongoose.model(req.session.work_name + '_reviews', review_schema);
	if (req.session.self_or_peer  == 1) {
		review_model.findOneAndUpdate(
			{ author: req.session.review_array[req.session.peer_number-1],
			  review_by: req.session.self_utorid},
			{ $set: {feedbacks: req.session.feedbacks,
			num_stars: req.session.num_stars,
			highlights: req.session.highlight_str } },
			{ new: true},
			function(err, doc) {
				if (err) console.log(err);
				console.log(doc);
			}
		);
	} else {
		review_model.findOneAndUpdate(
			{ author: req.session.self_utorid,
			  review_by: req.session.review_array[req.session.peer_number-1]},
			{ $set: {feedbacks: req.session.feedbacks,
			num_stars: req.session.num_stars,
			highlights: req.session.highlight_str } },
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
	if (req.session.empty == 0) {
		console.log('-----------------noooooo');
		var temp_feedback_array = [];
		for (var key in req.body) {
			if (key.indexOf("feedback") > -1) {
				temp_feedback_array.push(req.body[key]);
			}
		}
		console.log(req.body.highlight_storage);
		req.session.feedbacks = temp_feedback_array;
		req.session.highlight_str = req.body.highlight_storage;
		req.session.num_stars = parseInt(req.body.star_num);
		save(req);
	} 
	req.session.self_utorid = req.body.student_utorid;

	console.log(req.body);
	for (var i = 1; i <= req.session.review_array.length; i++) {
  	var key = "peer_" + String(i);
  	if (key in req.body) {
    	req.session.peer_number = i;
  	}
	}
	if ("peer_btn" in req.body) {
		req.session.peer_number = 1;
		req.session.self_or_peer  = 1;
	} else if ("self_btn" in req.body) {
		req.session.peer_number = 1;
		req.session.self_or_peer  = 0;
	}


	res.redirect('/student_reviews');
});


module.exports = router;

