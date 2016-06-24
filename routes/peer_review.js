var express = require('express');
var router = express.Router();
var PeerEditing = express();

var fs = require('fs');

var code_model = require("./models/code_model.js");
var review_model = require("./models/review_model.js");

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

var review_array = [];
var self_utorid = 'luqian3';
var code_path = '';
var feedbacks = [];

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
  	feedbacks = review.comment;
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
			feedback: feedbacks
		});
	});
}

router.post('/save', function(req, res, next) {
	var feedback_array = [];
	feedback_array.push(req.body.feedback);
	review_model.findOneAndUpdate(
		{ author: review_array[peer_number-1],
		  review_by: self_utorid},
		{ $set: {comment: feedback_array } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
			console.log(doc);
		}
	);
	console.log(feedback_array);
	is_saved = 1;
	res.redirect('/peer_review');
});

router.post('/go_to_peer_review_1', function(req, res, next) {
		//window.alert("not save yet");
		peer_number = 1;
		is_saved = 0;
		res.redirect('/peer_review');	
});

router.post('/go_to_peer_review_2', function(req, res, next) {
		//window.alert("not save yet");
		peer_number = 2;
		is_saved = 0;
		res.redirect('/peer_review');	
});

router.post('/go_to_peer_review_3', function(req, res, next) {
		//window.alert("not save yet");
		peer_number = 3;
		is_saved = 0;
		res.redirect('/peer_review');	
});


module.exports = router;

