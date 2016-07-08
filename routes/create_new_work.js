var fs = require( 'fs' );
var path = require( 'path' );
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var router = express.Router();

var moment = require('moment');



var code_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");

var code_model = mongoose.model('a2', code_schema);
var review_model = mongoose.model('a2_reviews', review_schema);
var rule_model = require("./models/rule_model.js");

var loading_code_collection_name = '';
var distributing_code_collection_name = '';
var error_message = '';
var passed_deadline = "cannot set a deadline which is already passed";

// GET this page
router.get('/', function(req, res, next) {
	res.render('create_new_work', {
		title : 'create new work',
		init_loading_work_name: loading_code_collection_name,
		init_distributing_work_name: distributing_code_collection_name,
		error_message: error_message
	});
});

/*-------------create------------------------*/
router.post('/create', function(req, res, next) {
	var rule_model = require('./models/rule_model.js');
	// if student submission deadline is specified
	if (req.body.student_submission_deadline_date != '') {
		// set student submission deadline
		var student_submission_deadline = req.body.student_submission_deadline_date + ' ' + req.body.student_submission_deadline_time;
		var student_submission_deadline = moment(student_submission_deadline, "YYYY-MM-DD HH:mm");
		//console.log("student submission deadline is " + moment(student_submission_deadline).format('LLLL'));
		console.log("student submission deadline is " + moment(student_submission_deadline));
		// error checking
		if (student_submission_deadline.isBefore(moment())) {
			error_message = passed_deadline;
			res.redirect('/create_new_work');
			return;
		}
	} else {
		console.log("no student submission deadline specified");
	}

	// TODO: check all input time

	// create a new rule
	var new_rule = new rule_model({
		work_name : req.body.work_name,
		late_penalty : "",
		num_peers : req.body.num_peers,
		required_files : req.body.required_files.split(','),
		repo_path : req.body.code_path,
    student_submission_deadline : student_submission_deadline , // TODO convert date object using moment.js
    release_to_peers : new Date(),
    peer_review_deadline : new Date(),
    release_to_tas : new Date(),
    ta_review_deadline : new Date(),
    release_to_students : new Date(),
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
  	file_name = rule.required_files[0];
  	//file_report_name = rule
  	directory_path = rule.repo_path;
  	read_file(file_name, file_report_name, directory_path, res);
  });
	distributing_code_collection_name = req.body.loading_work_name;
});


var code_array = [];
var num = 3;
/*--------------distribution----------------------*/
router.post('/distribute', function(req, res, next) {
	rule_model.findOne({ work_name: req.body.distributing_work_name }, function(err, rule) {
  	num = rule.num_peers;
  });

	var cStream = code_model.find().stream( /*{ transform: JSON.stringify } */);
 	cStream.on('data', function(doc) {
		code_array.push(doc);
	});

	cStream.on('end', function(doc) {
		distribute(code_array, res);
	});
});

function read_file(file_name, file_report_name, directory_path, res) {
	console.log("------------");
	console.log(file_name);
	console.log(file_report_name);
	console.log(directory_path);
// Loop through all the files in the directory
	fs.readdir( directory_path, function( err, files ) {
	  if( err ) {
	    console.error( "Could not list the directory.", err );
	  } else {
	    files.forEach( function (studentUtorid, index) {
	      // update students collection
	      var newCodePath = directory_path + '/' + studentUtorid + '/' + 'a2' + '/' + file_name;
	      var newReportPath = directory_path + '/' + studentUtorid + '/' + 'a2' + '/' + 'a2-report.txt';
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

function distribute(code_array, res) {
	var len = code_array.length;
	for (var i = 0; i < len; i ++) {
		for (var j = 1; j <= num; j ++) {
    		var new_review = new review_model({
    			author: code_array[i].utorid,
    			review_by: code_array[(i + j) % len].utorid,
    			feedback: [],
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
