var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var moment = require('moment');
var rule_model = require("./models/rule_model.js");
var instructor_model = require("./models/instructor_model.js");

var code_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");

var passed_deadline = "cannot set a deadline which is already passed ";

var feedback_questions = [];

var student_no_submit = [];
var num_submission = 0;

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
	  	if ((req.session.creating == null) || (req.session.creating == 0) || (req.session.current_site != "instructor")) {
	  		init_all(req, res, 'instructor');
	  	} else {
	  		find_work_names(req, res, 'instructor');
	  	}
	  }
	 });

});


function init_all(req, res, site) {
	req.session.current_site = site;
	req.session.creating = 1;
	req.session.create_work_name = "";
	req.session.create_late_penalty = "";
	req.session.create_num_peers = 0;
	req.session.create_required_files = [];
	req.session.create_repo_path = "";
	req.session.create_folder_name = "";
	req.session.create_num_feedbacks = 0;
	req.session.create_feedback_questions = [];
  	req.session.create_student_submission_deadline = "";
	req.session.create_release_students_code_to_peers = "";
	req.session.create_peer_review_deadline = "";
	req.session.create_release_students_reviews_to_tas = "";
	req.session.create_ta_review_deadline = "";
	req.session.create_release_tas_reviews_to_students = "";
	req.session.create_error_message = "";
	req.session.instruction = "";
	find_work_names(req, res, site);
}

function find_work_names(req, res, site) {
	var work_names = [];
  	rule_model.find({}, function(err, rules) {
  		render(req, res, site, rules);
  });
}
function render(req, res, site, rules) {
	res.render(site, {
	title: site,
	work_name: req.session.create_work_name,
	late_penalty: req.session.create_late_penalty,
	num_peers: req.session.create_num_peers,
	required_files: req.session.create_required_files,
	repo_path: req.session.create_repo_path,
	folder_name: req.session.create_folder_name,
	num_feedbacks: req.session.create_num_feedbacks,
	feedback_questions: req.session.create_feedback_questions,
	error_message: req.session.create_error_message,
	rules : rules,
	instruction : req.session.instruction
	});
}

/*-------------create------------------------*/
router.post('/create_new_work', function(req, res, next) {
	req.session.create_work_name = req.body.work_name;
	req.session.create_late_penalty = req.body.late_penalty;
	req.session.create_num_peers = req.body.num_peers;
	req.session.create_required_files = req.body.required_files.split(',');
	req.session.create_repo_path = req.body.repo_path;
	req.session.create_folder_name = req.body.folder_name;
	req.session.create_num_feedbacks = req.body.num_feedbacks;
	req.session.instruction = req.body.instruction;

	// if the button clicked is set_feedback, refreash the page
	if ("set_feedbacks" in req.body) { // initialize the list
		if (req.session.create_num_feedbacks < req.session.create_feedback_questions.length) {
			var dif = req.session.create_feedback_questions.length - req.session.create_num_feedbacks;
			for (var i=0; i < dif; i++) {
				req.session.create_feedback_questions.pop();
			}
		} else {
			for (var i=0; i < req.session.create_num_feedbacks; i++) {
				if (i >= req.session.create_feedback_questions.length) {
					req.session.create_feedback_questions.push("");
				}
			}
		}
		res.redirect('/instructor');
		return;
	}
	// append the feedback questions into array
	var question = 0;
	for (var key in req.body) {
		if (key.indexOf("question") > -1) {
			req.session.create_feedback_questions[question] = req.body[key];
			question ++;
		}
	}
	var deadline_array = [];
	// if student submission deadline is specified 0
	if (req.body.student_submission_deadline_date != '') {
		req.session.create_student_submission_deadline = req.body.student_submission_deadline_date + ' ' + req.body.student_submission_deadline_time;
		deadline_array.push(req.session.create_student_submission_deadline);
	}
	// if release students code to their peers date is specified 1
	if (req.body.release_students_code_to_peers_date != '') {
		req.session.create_release_students_code_to_peers = req.body.release_students_code_to_peers_date + ' ' + req.body.release_students_code_to_peers_time;
		deadline_array.push(req.session.create_release_students_code_to_peers);
	}
	// if peer review deadline is specified 2
	if (req.body.peer_review_deadline_date != '') {
		req.session.create_peer_review_deadline = req.body.peer_review_deadline_date + ' ' + req.body.peer_review_deadline_time;
		deadline_array.push(req.session.create_peer_review_deadline);
	}
	// if release students reviews to tas date is specified 3
	if (req.body.release_students_reviews_to_tas_date != '') {
		req.session.create_release_students_reviews_to_tas = req.body.release_students_reviews_to_tas_date + ' ' + req.body.release_students_reviews_to_tas_time;
		deadline_array.push(req.session.create_release_students_reviews_to_tas);
	}
	// if TA review daedline is specified 4
	if (req.body.ta_review_deadline_date != '') {
		req.session.create_ta_review_deadline = req.body.ta_review_deadline_date + ' ' + req.body.ta_review_deadline_time;
		deadline_array.push(req.session.create_ta_review_deadline);
	}
	// if release tas reviews to student is specified 5
	if (req.body.release_tas_reviews_to_students_date != '') {
		req.session.create_release_tas_reviews_to_students = req.body.release_tas_reviews_to_students_date + ' ' + req.body.release_tas_reviews_to_students_time;
		deadline_array.push(req.session.create_release_tas_reviews_to_students);
	}
	
	// get local datetime
	var temp_datetime = moment();
	// check all deadlines
	for (var i = 0; i < deadline_array.length; i++) {
		if (deadline_array[i]) {
			// cast to moment object
			deadline_array[i] = moment(deadline_array[i], "YYYY-MM-DD HH:mm");
			// error checking, no deadline should be after temp/current date time
			if (deadline_array[i].isBefore(temp_datetime)) {
				// tell user which deadline is passed
				req.session.create_error_message = passed_deadline + deadline_array[i].format('LLLL'); // long format
				res.redirect('/instructor');
				return;
			}
			// replace temp datetime by latest deadline
			temp_datetime = deadline_array[i];
		}
	}
	// create a new rule
	// unspecified deadlines are empty strings
	var new_rule = new rule_model({
		work_name : req.session.create_work_name,
		late_penalty : req.session.create_late_penalty,
		num_peers : req.session.create_num_peers,
		required_files : req.session.create_required_files,
		repo_path : req.session.create_repo_path,
		folder_name : req.session.create_folder_name,
		num_feedbacks: req.session.create_num_feedbacks,
		feedback_questions: req.session.create_feedback_questions,
		instruction : req.session.instruction,
    	student_submission_deadline : req.session.create_student_submission_deadline,
    	release_to_peers : req.session.create_release_students_code_to_peers,
    	peer_review_deadline : req.session.create_peer_review_deadline,
    	release_to_tas : req.session.create_release_students_reviews_to_tas,
    	ta_review_deadline : req.session.create_ta_review_deadline,
    	release_to_students : req.session.create_release_tas_reviews_to_students,
    	release : 0,
    	release_self_review : 0,
    	release_mark : 0
	});
	loading_code_collection_name = req.body.work_name;
	// write a new document into database
	new_rule.save( function(err) {
		if (err) return console.log(err);
		// refresh this page
		console.log("retrieved time is " + moment(new_rule.student_submission_deadline).format("DD MMM YYYY hh:mm a"));
		req.session.creating = 0;
		res.redirect('/instructor');
	});
});

router.post('/go_to_create_new_work', function(req, res, next) {
	for (var key in req.body) {
		req.session.work_name = key;
		if (key.indexOf("check_") > -1) {
			req.session.work_name = key.slice(6, key.length);
			res.redirect('/student_reviews');
		} else if (key.indexOf("unrelease_self") > -1) {
			req.session.work_name = key.slice(15, key.length);
			release_or_unrelease_self(req, res, '/instructor', 0);
		} else if (key.indexOf("release_self") > -1) {
			req.session.work_name = key.slice(13, key.length);
			release_or_unrelease_self(req, res, '/instructor', 1);
		} else if (key.indexOf("unrelease_mark") > -1) {
			req.session.work_name = key.slice(15, key.length);
			release_or_unrelease_mark(req, res, '/instructor', 0);
		} else if (key.indexOf("release_mark") > -1) {
			req.session.work_name = key.slice(13, key.length);
			release_or_unrelease_mark(req, res, '/instructor', 1);
		} else if (key.indexOf("unrelease_") > -1) {
			req.session.work_name = key.slice(10, key.length);
			release_or_unrelease(req, res, '/instructor', 0);
		} else if (key.indexOf("release_") > -1) {
			req.session.work_name = key.slice(8, key.length);
			release_or_unrelease(req, res, '/instructor', 1);
	    } else {
	    	console.log("-----------else");
			res.redirect('/create_new_work');

		}
	}

});

function release_or_unrelease_self(req, res, site, bool) {
	rule_model.findOneAndUpdate(
		{ work_name: req.session.work_name },
		{ $set: { release_self_review : bool } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
			res.redirect(site);
		}
	);
}

function release_or_unrelease_mark(req, res, site, bool) {
	rule_model.findOneAndUpdate(
		{ work_name: req.session.work_name },
		{ $set: { release_mark : bool } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
			if (bool == 1) {
				get_overall_mark(req, res, site);
			} else {
				res.redirect(site);
			}
		}
	);
}

function release_or_unrelease(req, res, site, bool) {
	rule_model.findOneAndUpdate(
		{ work_name: req.session.work_name },
		{ $set: { release : bool } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
			res.redirect(site);
		}
	);
}


function get_overall_mark(req, res, site) {
  var marks = {};
  var review_model = mongoose.model(req.session.work_name + "_reviews", review_schema);
  review_model.find({}, function(err, reviews) {
  	for (var i = 0; i < reviews.length; i ++) {
  		if (!(reviews[i].review_by in marks)) {
  			marks[reviews[i].review_by] = 0;
  		}
		marks[reviews[i].review_by] += reviews[i].mark;
  	}
  	update_overall_mark(req, res, site, marks)
  	
  });
}

function update_overall_mark(req, res, site, marks) {
  var code_model = mongoose.model(req.session.work_name, code_schema);
  for (var utorid in marks) {
  	code_model.findOneAndUpdate(
		{ utorid: utorid },
		{ $set: { mark: marks[utorid] } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
		}
	);
  }
	res.redirect(site);
}

module.exports = router;
