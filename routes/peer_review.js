var express = require('express');
var router = express.Router();
var PeerEditing = express();

var fs = require('fs');

var code_model = require("./models/code_model.js");
var review_model = require("./models/review_model.js");

var num_of_peers = 10;
var peer_number = 1;
var is_saved = 0;
/* GET users listing. */

router.get('/', function(req, res, next) {
  find_student_code(res, 'peer_review');
});

router.post('/go_to_self_assesment', function(req, res, next) {
	console.log(req.body.testing);
	res.redirect('/self_assesment');
});

router.post('/go_to_index', function(req, res, next) {
	res.redirect('/');
});

var num_of_stars = 0;
var review_array = [];
var self_utorid = 'luqian3';
var code_path = '';
var feedbacks_array = [];
var highlight_str = '';

function find_student_code(res, site){
  code_model.findOne({ utorid: self_utorid }, function(err, code) {
  	review_array = code.to_review;
  	find_to_review_code_path(res, site);
  });
}

function find_to_review_code_path(res, site) {
  code_model.findOne({ utorid: review_array[peer_number-1] }, function(err, code) {
  	code_path = code.code_path;
  	find_feedbacks(res, site);
  });
}

function find_feedbacks(res, site) {
  review_model.findOne({ author: review_array[peer_number-1], review_by: self_utorid }, function(err, review) {
  	feedbacks_array = review.feedbacks;
  	num_of_stars = review.num_stars;
  	highlight_str = review.highlights;
  	console.log("---------");
  	console.log(review);
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
			feedback: feedbacks_array,
			number_of_stars: num_of_stars,
			init_highligts: highlight_str
		});
	});
}

function save() {
	review_model.findOneAndUpdate(
		{ author: review_array[peer_number-1],
		  review_by: self_utorid},
		{ $set: {feedbacks: feedbacks_array,
		num_stars: num_of_stars,
		highlights: highlight_str } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
			console.log(doc);
		}
	);
}

router.post('/go_to_peer_review', function(req, res, next) {
	var temp_feedback_array = [];
	temp_feedback_array.push(req.body.feedback1);
	temp_feedback_array.push(req.body.feedback2);
	console.log(req.body.highlight_storage);
	feedbacks_array = temp_feedback_array;
	highlight_str = req.body.highlight_storage;
	num_of_stars = req.body.star_num;

	save();
	console.log(req.body);
	for (var i = 1; i <= num_of_peers; i++) {
  	var key = "peer_" + String(i);
  	if (key in req.body) {
    	peer_number = i;
  	}
	}


	res.redirect('/peer_review');
});


module.exports = router;

