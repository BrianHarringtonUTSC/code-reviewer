var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var fs = require('fs');

var code_schema = require("./models/submission_schema.js");
var student_model = require('./models/student_model.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
  }
	student_model.findOne({ email: req.user.emails[0].value }, function (err, student) {
	  if (err) return err;
	  if (student == null) {
	  	res.redirect('/' + req.session.current_site);
	  } else {
	  	req.session.current_site = "self_assesment";
	  	find_student_code(req, res, 'self_assesment');
	  }
	 });
});

function find_student_code(req, res, site) {
	var code_model = mongoose.model(req.session.work_name, code_schema);
  code_model.findOne({ utorid: req.session.self_utorid }, function(err, code) {
  	req.session.code_path = code.code_path;
  	req.session.self_assess = code.self_assess;
  	console.log("------------------");
  	console.log(req.session.self_assess);
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
	  //console.log(line);
	});

	rl.on('close', function() {
		res.render(site, {
			title: site,
			code: str,
			number_of_stars: req.session.self_assess
		});
	});
}

function save(req) {
	console.log(req.session.self_assess);
	var code_model = mongoose.model(req.session.work_name, code_schema);
	code_model.findOneAndUpdate(
		{ utorid: req.session.self_utorid},
		{ $set: { self_assess : req.session.self_assess } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
			console.log("saved");
		}
	);
}

router.post('/go_to_home', function(req, res, next) {
	console.log("--------------star num");
	console.log(req.body);
	req.session.self_assess = req.body.star_num;
	save(req);
	res.redirect('/home');
});
module.exports = router;
