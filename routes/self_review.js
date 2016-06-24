var express = require('express');
var router = express.Router();

var fs = require('fs');
// import module mongodb
var code_model = require("./models/code_model.js");
var review_model = require("./models/review_model.js");

/* GET users listing. */
router.get('/', function(req, res, next) {
  find_student(res, 'self_review');
});

var review_array = [];
var feedback_array = [];
var self_utorid = "lossevki";
var code_path = "";

function find_student(res, site) {
  code_model.findOne({ utorid: self_utorid }, function(err, code) {
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
