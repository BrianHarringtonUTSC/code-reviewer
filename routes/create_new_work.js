var fs = require( 'fs' );
var path = require( 'path' );
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var router = express.Router();

var moment = require('moment');



var code_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");

var rule_model = require("./models/rule_model.js");
var instructor_model = require("./models/instructor_model.js");
var ta_model = require('./models/ta_model.js');

var error_message = '';
var passed_deadline = "cannot set a deadline which is already passed ";


// GET this page
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
	  	if (req.session.current_site != "create_new_work") {
	  		req.session.current_site = "create_new_work";
	  		find_work(req, res, 'create_new_work');
	  	} else {
	  		find_work(req, res, 'create_new_work');
	  	}
	  }
	 });
});
// find work and all its info
function find_work(req, res, site) {
  	rule_model.findOne({ work_name : req.session.work_name }, function(err, rule) {
  	find_tas(req, res, site, rule);
  });
}
// find all of the tas
function find_tas(req, res, site, rule, tas) {
  	ta_model.find({}, function(err, tas) {
  	find_num_of_submission(req, res, site, rule, tas);
  });
}

function find_num_of_submission(req, res, site, rule, tas) {
	mongoose.connection.db.listCollections({name: req.session.work_name})
    .next(function(err, collinfo) {
        if (collinfo) {
            var code_model = mongoose.model(req.session.work_name, code_schema);
            code_model.find({}, function(err, code) {
			    check_student_distributed(req, res, site, rule, tas, code.length);
			});
        } else {
        	check_student_distributed(req, res, site, rule, tas, 0);
        }
    });
}

function check_student_distributed(req, res, site, rule, tas, num_submission) {
	var student_distributed = 0;
	var ta_distributed = 0;
	mongoose.connection.db.listCollections({name: (req.session.work_name + '_reviews')})
    .next(function(err, collinfo) {
        if (collinfo) {
        	var review_model = mongoose.model(req.session.work_name + "_reviews", review_schema);
            review_model.find({}, function(err, review) {
	        	student_distributed = 1;
	        	if (review.length != (num_submission * rule.num_peers)) {
	            	ta_distributed = 1;
	        	}
				render(req, res, site, rule, tas, num_submission, student_distributed, ta_distributed);
			});
        } else {
        	render(req, res, site, rule, tas, num_submission, student_distributed, ta_distributed);
        }
    });
}

// render
function render(req, res, site, rule, tas, num_submission, student_distributed, ta_distributed) {
	res.render(site, {
	title: site,
	num_of_submission_loaded : num_submission,
	student_distributed : student_distributed,
	ta_distributed : ta_distributed,
	tas : tas,
	work_name: rule.work_name,
	late_penalty: rule.late_penalty,
	num_peers: rule.num_peers,
	required_files: rule.required_files,
	repo_path: rule.repo_path,
	folder_name: rule.folder_name,
	num_feedbacks: rule.num_feedbacks,
	feedback_questions: rule.feedback_questions,
	instruction : rule.instruction,
	error_message: rule.error_message,
	loaded : req.session.loaded
	});
}


function save(req, feedback_questions) {
	rule_model.findOneAndUpdate(
		{ work_name: req.body.work_name },
		{ $set: { work_name : req.body.work_name,
		late_penalty : req.body.late_penalty,
		num_peers : req.body.num_peers,
		required_files : req.body.required_files.split(','),
		repo_path : req.body.repo_path,
		folder_name : req.body.folder_name,
		num_feedbacks :req.body.num_feedbacks,
		feedback_questions : feedback_questions,
		instruction : req.body.instruction } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
		}
	);
}
/*-------------create------------------------*/
router.post('/edit', function(req, res, next) {
	student_submission_deadline_date = req.body.student_submission_deadline_date;
	student_submission_deadline_time = req.body.student_submission_deadline_time;

	var feedback_questions = [];
	for (var key in req.body) {
		if (key.indexOf("question") > -1) {
			feedback_questions.push(req.body[key]);
		}
	}

	// if the button clicked is set_feedback, refreash the page
	var num_feedbacks = req.body.num_feedbacks;
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
		save(req, feedback_questions);
		res.redirect('/create_new_work');
		return;
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
	save(req, feedback_questions);
	res.redirect('/create_new_work');
	//console.log("retrieved time is " + moment(new_rule.student_submission_deadline).format("DD MMM YYYY hh:mm a"));
});

/*--------------load_assignment------------------------*/
router.post('/load_assignment', function(req, res, next) {
	rule_model.findOne({ work_name: req.session.work_name }, function(err, rule) {
		if (err) return err;
		var work_name = req.session.work_name;
  		read_file(rule.required_files[0], '', rule.repo_path, rule.folder_name, res, work_name);
  });
});


/*--------------distribution----------------------*/
router.post('/distribute', function(req, res, next) {
	var num = 0; 
	rule_model.findOne({ work_name: req.session.work_name }, function(err, rule) {
  		num = rule.num_peers;
  	});
	var code_model = mongoose.model(req.session.work_name, code_schema);
	var cStream = code_model.find().stream( /*{ transform: JSON.stringify } */);
	var code_array = [];
 	cStream.on('data', function(doc) {
		code_array.push(doc);
	});

	cStream.on('end', function(doc) {
		check_loaded(req, res, code_array, num, req.session.work_name);
		
	});
});

/*--------------distribution--TA------------------*/
router.post('/distribute_ta', function(req, res, next) {
	var tas_need_to_review = [];
	for (var key in req.body) {
		if (key.indexOf("checkbox_") > -1) {
			var ta = req.body[key].split(",");
			for (var i = 0; i < ta[1]; i++) {
				tas_need_to_review.push(ta[0]);
			}
		}
	}
	var code_model = mongoose.model(req.session.work_name, code_schema);
	var cStream = code_model.find().stream();
	var code_array = [];
 	cStream.on('data', function(doc) {
		code_array.push(doc);
	});

	cStream.on('end', function(doc) {
		distribute_ta(res, code_array, tas_need_to_review, req.session.work_name);
	});

});

function distribute_ta(res, code_array, tas_need_to_review, work_name) {
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
	res.redirect('/create_new_work');
}


function read_file(file_name, file_report_name, directory_path, folder_name, res, work_name) {
	var code_model = mongoose.model(work_name, code_schema);
// Loop through all the files in the directory
	fs.readdir( directory_path, function( err, files ) {
	  if( err ) {
	    console.error( "Could not list the directory.", err );
	  } else {
	    files.forEach( function (studentUtorid, index) {
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
              failed_test_cases: [],
              self_assess : 0,
              mark : 0
	          });
	          code.save( function(err) {
	            console.log("added ", code.utorid);
	            if (err) console.log(err);
	          });
	        } else if (err.code == 'ENOENT') {
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

function check_loaded(req, res, code_array, num, work_name) {
	mongoose.connection.db.listCollections({name: work_name})
	.next(function(err, collinfo) {
	    if (collinfo) {
	    	console.log("NOT found!");
	    	pre_distribute(req, res, code_array, num, work_name);
	    } else {
	    	console.log("found!");
	    	res.redirect('/create_new_work');
	    }
	});
}

function pre_distribute(req, res, code_array, num, work_name) {
	mongoose.connection.db.dropCollection(req.session.work_name + "_reviews", function(err, result) {
		distribute(res, code_array, num, work_name);
	});
}

function distribute(res, code_array, num, work_name) {
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
    			if (err) {
    				console.log("duplicates");
    			}
    		});

			code_array[i].review_by.push(code_array[(i + j) % len].utorid);
			code_array[(i + j) % len].to_review.push(code_array[i].utorid);
		}
	}
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
