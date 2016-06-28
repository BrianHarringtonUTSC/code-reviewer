var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var router = express.Router();


// GET this page
router.get('/', function(req, res, next) {
	res.render('create_new_work', {title : 'create new work'});
});

// create a new work
router.post('/create', function(req, res, next) {
	var rule_model = require('./models/rule_model.js');
	// create a new rule
	var new_rule = new rule_model({
		work_name : req.body.work_name,
		late_penalty : "",
		num_peers : req.body.num_peers,
		required_files : req.body.required_files.split(','),
    student_submission_deadline : new Date(), // TODO convert date object using moment.js
    release_to_peers : new Date(),
    peer_review_deadline : new Date(),
    release_to_tas : new Date(),
    ta_review_deadline : new Date(),
    release_to_students : new Date(),
	});
	// write a new document into database
	new_rule.save( function(err) {
		if (err) return console.log(err);
		// refresh this page
		res.redirect('/create_new_work');
	});
});


module.exports = router;
