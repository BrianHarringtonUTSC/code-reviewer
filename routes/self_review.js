var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var fs = require('fs');
// import module mongodb
var code_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");

var code_model = mongoose.model('a2', code_schema);
var review_model = mongoose.model('a2_reviews', review_schema);

var num_of_peers = 10;
var peer_number = 1;
var review_array = [];
var feedback_array = [];
var num_of_stars = [];
var highlight_str = "";
//var self_utorid = "luijerr1";
//var self_utorid = "lossevki";
var self_utorid = "yujonat6";
var code_path = "";

/* GET users listing. */
router.get('/', function(req, res, next) {
  find_student(res, 'self_review');
});

router.post('/go_to_self_review', function(req, res, next) {
	console.log(req.body);
	for (var i = 1; i <= num_of_peers; i++) {
	  var key = "peer_" + String(i);
	  if (key in req.body) {
	    peer_number = i;
	  }
	}
	res.redirect('/self_review');
});



function find_student(res, site) {
  code_model.findOne({ utorid: self_utorid }, function(err, code) {
  	review_array = code.review_by;
  	code_path = code.code_path;
  	find_feedback(res, site);
  });
}

function find_feedback(res, site) {
  review_model.findOne({ author: self_utorid, review_by:review_array[peer_number-1] }, function(err, review) {
	  feedback_array = review.feedbacks;
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
	  //console.log(line);
	});

	rl.on('close', function() {
		res.render(site, {
			title: site,
			entries: review_array,
			code: str,
			peer_num: peer_number,
			feedback: feedback_array,
			number_of_stars: num_of_stars,
			init_highligts: highlight_str
		});
	  // do something on finish here
	  //console.log(str);
	  //console.log("finished");
	  //console.log(str_array.length);
	});
}

module.exports = router;
