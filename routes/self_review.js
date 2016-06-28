var express = require('express');
var mongoose = require('mongoose');
var fs = require('fs');
var router = express.Router();

var submission_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");

// name of this work, TODO: read work name from rule collection
var work_name = "a2";
// define submission model with work name
var new_submission_collection = work_name + "_submission";
var submission_model = mongoose.model(new_submission_collection, submission_schema);
// define review model with work name
var new_review_collection = work_name + "_review";
var review_model = mongoose.model(new_review_collection, review_schema);


// GET users listing.
router.get('/', function(req, res, next) {
  find_student(res, 'self_review');
});


var review_array = [];
var feedback_array = [];
var self_utorid = "luijerr1";
var code_path = "";

// find a student with given utorid
function find_student(res, site) {
  submission_model.findOne({ utorid: self_utorid }, function(err, code) {
  	review_array = code.review_by;
  	code_path = code.code_path;
  	find_feedback(res, site);
  });
}

function find_feedback(res, site) {
  for(var i = 0; i < review_array.length; i++) {
    review_model.findOne({ author: self_utorid, review_by:review_array[i] }, function(err, review) {
  	  feedback_array.push(review.comment);
  	  console.log(feedback_array.length);
  	  if (feedback_array.length == review_array.length) {
  	  	read_file(res, site);
  	  }
    });
  }
  
}

var readline = require('readline');
var stream = require('stream');

function read_file(res, site) {
	console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
	var instream = fs.createReadStream(code_path);
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);
	var str = ""
	rl.on('line', function(line) {
	  str += line + "\n";
	  //console.log(line);
	});

	rl.on('close', function() {
		res.render(site, {
			title: site,
			entries: review_array,
			code: str,
			feedback_entries: feedback_array
		});
	  // do something on finish here
	  //console.log(str);
	  //console.log("finished");
	  //console.log(str_array.length);
	  feedback_array = [];

	});
}

module.exports = router;
