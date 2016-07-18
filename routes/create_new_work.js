var fs = require( 'fs' );
var path = require( 'path' );
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var router = express.Router();

var moment = require('moment');

var work_name = "";


var code_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");

var code_model = mongoose.model(work_name, code_schema);
var review_model = mongoose.model(work_name + "_reviews", review_schema);
var rule_model = require("./models/rule_model.js");
var ta_model = require('./models/ta_model.js');

var loading_code_collection_name = '';
var distributing_code_collection_name = '';
var distributing_ta_code_collection_name = '';
var error_message = '';
var passed_deadline = "cannot set a deadline which is already passed ";

var work_name = "";
var late_penalty = "";
var num_peers = 0;
var required_files = [];
var repo_path = "";
var folder_name = "";
var student_submission_deadline_date = "";
var student_submission_deadline_time = "";
var num_feedbacks = 0;
var feedback_questions = [];
var tas_need_to_review = [];

var student_no_submit = [];
var num_submission = 0;

// GET this page
router.get('/', function(req, res, next) {
  var ta_model = require('./models/ta_model.js');
  // find all documents in collection tas
	ta_model.find({}, function (err, tas) {
	  if (err) {
	  	console.log(err);
	  }
		res.render('create_new_work', {
			title : 'create new work',
			work_name: work_name,
			late_penalty: late_penalty,
			num_peers: num_peers,
			required_files: required_files,
			repo_path: repo_path,
			folder_name: folder_name,
			num_feedbacks: num_feedbacks,
			feedback_questions: feedback_questions,
			student_no_submit: student_no_submit,
			num_submission: num_submission,
			init_loading_work_name: loading_code_collection_name,
			init_distributing_work_name: distributing_code_collection_name,
			init_distributing_ta_work_name: distributing_ta_code_collection_name,
			error_message: error_message,
			tas: tas
		});
	});
});


/*-------------create------------------------*/
router.post('/create', function(req, res, next) {
	work_name = req.body.work_name;
	late_penalty = req.body.late_penalty;
	num_peers = req.body.num_peers;
	required_files = req.body.required_files.split(',');
	repo_path = req.body.repo_path;
	folder_name = req.body.folder_name;
	student_submission_deadline_date = req.body.student_submission_deadline_date;
	student_submission_deadline_time = req.body.student_submission_deadline_time;

	num_feedbacks = req.body.num_feedbacks;
	// if the button clicked is set_feedback, refreash the page
	if ("set_feedbacks" in req.body) { // initialize the list
		if (num_feedbacks < feedback_questions.length) {
			var dif = feedback_questions.length - num_feedbacks;
			for (var i=0; i < dif; i++) {
				feedback_questions.pop();
			}
		} else {
			for (var i=0; i < num_feedbacks; i++) {
				if (i >= feedback_questions.length) {
					feedback_questions.push("");
				}
			}
		}
		res.redirect('/create_new_work');
		return;
	}
	// append the feedback questions into array
	var question = 0;
	for (var key in req.body) {
		if (key.indexOf("question") > -1) {
			feedback_questions[question] = req.body[key];
			question ++;
		}
	}

	// if student submission deadline is specified 0
	if (req.body.student_submission_deadline_date != '') {
		var student_submission_deadline = req.body.student_submission_deadline_date + ' ' + req.body.student_submission_deadline_time;
	}
	// if release students code to their peers date is specified 1
	if (req.body.release_students_code_to_peers_date != '') {
		var release_students_code_to_peers = req.body.release_students_code_to_peers_date + ' ' + req.body.release_students_code_to_peers_time;
	}
	// if peer review deadline is specified 2
	if (req.body.peer_review_deadline_date != '') {
		var peer_review_deadline = req.body.peer_review_deadline_date + ' ' + req.body.peer_review_deadline_time;
	}
	// if release students reviews to tas date is specified 3
	if (req.body.release_students_reviews_to_tas_date != '') {
		var release_students_reviews_to_tas = req.body.release_students_reviews_to_tas_date + ' ' + req.body.release_students_reviews_to_tas_time;
	}
	// if TA review daedline is specified 4
	if (req.body.ta_review_deadline_date != '') {
		var ta_review_deadline = req.body.ta_review_deadline_date + ' ' + req.body.ta_review_deadline_time;
	}
	// if release tas reviews to student is specified 5
	if (req.body.release_tas_reviews_to_students_date != '') {
		var release_tas_reviews_to_students = req.body.release_tas_reviews_to_students_date + ' ' + req.body.release_tas_reviews_to_students_time;
	}
	var deadline_array = [student_submission_deadline, release_students_code_to_peers, peer_review_deadline, release_students_reviews_to_tas, ta_review_deadline, release_tas_reviews_to_students];
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
				error_message = passed_deadline + deadline_array[i].format('LLLL'); // long format
				res.redirect('/create_new_work');
				return;
			}
			// replace temp datetime by latest deadline
			temp_datetime = deadline_array[i];
		}
	}
	// create a new rule
	// unspecified deadlines are empty strings
	var new_rule = new rule_model({
		work_name : work_name,
		late_penalty : late_penalty,
		num_peers : num_peers,
		required_files : required_files,
		repo_path : repo_path,
		folder_name : folder_name,
		num_feedbacks: num_feedbacks,
		feedback_questions: feedback_questions,
    student_submission_deadline : student_submission_deadline,
    release_to_peers : release_students_code_to_peers,
    peer_review_deadline : peer_review_deadline,
    release_to_tas : release_students_reviews_to_tas,
    ta_review_deadline : ta_review_deadline,
    release_to_students : release_tas_reviews_to_students,
	});
	loading_code_collection_name = req.body.work_name;
	// write a new document into database
	new_rule.save( function(err) {
		if (err) return console.log(err);
		// refresh this page
		console.log("retrieved time is " + moment(new_rule.student_submission_deadline).format("DD MMM YYYY hh:mm a"));
		res.redirect('/create_new_work');
	});
});

/*--------------load_assignment------------------------*/
router.post('/load_assignment', function(req, res, next) {
	var file_name = '';
	var file_report_name = '';
	var directory_path = '';
	rule_model.findOne({ work_name: req.body.loading_work_name }, function(err, rule) {
		if (err) return err;
		work_name = rule.work_name;
  	file_name = rule.required_files[0];
  	//file_report_name = rule
  	directory_path = rule.repo_path;
  	read_file(file_name, file_report_name, directory_path, rule.folder_name, res);
  });
	distributing_code_collection_name = req.body.loading_work_name;
	distributing_ta_code_collection_name = req.body.loading_work_name;
});


var code_array = [];
var num = 3;
/*--------------distribution----------------------*/
router.post('/distribute', function(req, res, next) {
	rule_model.findOne({ work_name: req.body.distributing_work_name }, function(err, rule) {
  	num = rule.num_peers;
  	work_name = rule.work_name;
  });
	var code_model = mongoose.model(work_name, code_schema);
	var cStream = code_model.find().stream( /*{ transform: JSON.stringify } */);
	code_array = [];
 	cStream.on('data', function(doc) {
		code_array.push(doc);
	});

	cStream.on('end', function(doc) {
		distribute(res);
	});
});
var ta_dict = new Array();
/*--------------distribution--TA------------------*/
router.post('/distribute_ta', function(req, res, next) {
	rule_model.findOne({ work_name: req.body.distributing_ta_work_name }, function(err, rule) {
  	work_name = rule.work_name;
  });
	for (var key in req.body) {
		if (key.indexOf("checkbox_") > -1) {
			var ta = req.body[key].split(",");
			for (var i = 0; i < ta[1]; i++) {
				ta_dict[ta[0]] = [];
				tas_need_to_review.push(ta[0]);
			}
		}
	}
	console.log("-------");
	console.log(work_name);
	console.log(tas_need_to_review);
	var code_model = mongoose.model(work_name, code_schema);
	var cStream = code_model.find().stream();
	code_array = [];
 	cStream.on('data', function(doc) {
		code_array.push(doc);
	});

	cStream.on('end', function(doc) {
		distribute_ta(res);
	});

});

function distribute_ta(res) {
	var code_model = mongoose.model(work_name, code_schema);
	var reviews_per_weight = Math.floor(code_array.length / tas_need_to_review.length);
	var code = 0;
	var review_model = mongoose.model(work_name + "_reviews", review_schema);
	for (var i = 0; i < tas_need_to_review.length; i ++) {
		for (var j = 0; j < reviews_per_weight; j ++) {
			// create reviews
  		var new_review = new review_model({
  			author: code_array[code].utorid,
  			review_by: tas_need_to_review[i],
  			feedbacks: [],
  			high_light: [],
  			num_stars: 0

  		});
      // avoid duplicates
  		new_review.save(function (err) {
  			if (err) {
  				console.log("duplicates");
  			}
  		});
			//ta_dict[tas_need_to_review[i]].push(code_array[code].utorid);
			code_array[code].review_by.push(tas_need_to_review[i]);
			code_array[code].ta = tas_need_to_review[i];
			code ++;
		}
	}
	// distribute remainders
	var j = 0;
	while (code < code_array.length) {
		var ta_utorid = tas_need_to_review[j];
		// create reviews
		var new_review = new review_model({
			author: code_array[code].utorid,
			review_by: ta_utorid,
			feedbacks: [],
			high_light: [],
			num_stars: 0

		});
    // avoid duplicates
		new_review.save(function (err) {
			if (err) {
				console.log("duplicates");
			}
		});

		//ta_dict[ta_utorid].push(code_array[code].utorid);
		code_array[code].review_by.push(ta_utorid);
		code_array[code].ta = tas_need_to_review[i];
		code ++;
		j ++;
	}
	// update both ta and code collection
	for (var i = 0; i < code_array.length; i ++) {
		code_model.findOneAndUpdate( 
			{ _id: code_array[i]._id}, 
			{ $set: { review_by: code_array[i].review_by,
			          ta : code_array[i].ta } }, 
			{ new: true},
			function(err, doc) {
		    	if (err) console.log(err);
			});
	}
	/*
	for (var ta_utorid in ta_dict) {
		ta_model.findOneAndUpdate( 
			{ utorid: ta_utorid}, 
			{ $set: { to_review: ta_dict[ta_utorid]} }, 
			{ new: true},
			function(err, doc) {
		    	if (err) console.log(err);
			});
	}
	for (ta in ta_dict) {
		console.log(ta_dict[ta].length);
	}
	*/
	res.redirect('/create_new_work');
}

var count = 0;
function read_file(file_name, file_report_name, directory_path, folder_name, res) {
	var code_model = mongoose.model(work_name, code_schema);
// Loop through all the files in the directory
	fs.readdir( directory_path, function( err, files ) {
	  if( err ) {
	    console.error( "Could not list the directory.", err );
	  } else {
	    files.forEach( function (studentUtorid, index) {
	    	count ++;
	      // update students collection
	      var newCodePath = directory_path + '/' + studentUtorid + '/' + folder_name + '/' + file_name;
	      var newReportPath = '';
	      fs.stat(newCodePath, function(err, stat) {
	        if (err == null) {
	          var code = new code_model({
              name: file_name,
              utorid: studentUtorid,
              review_by: [],
              to_review: [],
              ta: "",
              code_path: newCodePath,
              report_path: newReportPath,
              failed_test_cases: []
	          });
	          code.save( function(err) {
	          	num_submission ++;
	            console.log("added ", code.utorid);
	            if (err) console.log(err);
	          });
	        } else if (err.code == 'ENOENT') {
	          student_no_submit.push(studentUtorid);
	          console.log("file doesn't exist. the utorid is ", studentUtorid);
	        } else {
	          console.log('some other error', err.code);
	        }
	      });
	    });
	  }
	});
	res.redirect('/create_new_work');
}

function distribute(res) {
	var code_model = mongoose.model(work_name, code_schema);
	var review_model = mongoose.model(work_name + "_reviews", review_schema);
	var len = code_array.length;
	for (var i = 0; i < len; i ++) {
		for (var j = 1; j <= num; j ++) {
    		var new_review = new review_model({
    			author: code_array[i].utorid,
    			review_by: code_array[(i + j) % len].utorid,
    			feedbacks: [],
    			high_light: [],
    			num_stars: 0

    		});
            // avoid duplicates
    		new_review.save(function (err) {
                //console.log('--------------',new_review);
    			if (err) {
    				console.log("duplicates");
    			}
    		});

			code_array[i].review_by.push(code_array[(i + j) % len].utorid);
			code_array[(i + j) % len].to_review.push(code_array[i].utorid);
		}
	}
	console.log(code_array[5]);
	// update the actual collection
	for (var i = 0; i < len; i ++) {
		code_model.findOneAndUpdate( 
			{ _id: code_array[i]._id}, 
			{ $set: { review_by: code_array[i].review_by,
			          to_review: code_array[i].to_review } }, 
			{ new: true},
			function(err, doc) {
		    	if (err) console.log(err);
			});
	}
	res.redirect('/create_new_work');
}


module.exports = router;
