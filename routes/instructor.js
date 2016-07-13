var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var rule_model = require('./models/rule_model.js');


var rules_array = [];
/* GET users listing. */
router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
  }
  // find all documents in collection rules
	rule_model.find({}, function (err, rules) {
		rules_array = rules;
	  if (err) return err;
	  res.render('instructor', { 
	  	title : 'instructor',
	  	rules : rules
	  });
	});
});


router.post('/drop_one_submission', function(req, res, next) {
	var work_name = '';
	for (var i = 0; i < rules_array.length; i++) {
		var btn_name = "btn_drop_" + String(i);
		if (btn_name in req.body) {
			name = rules_array[i].work_name;
		}
	}
	console.log('work_name is ' + work_name);
	rule_model.findOneAndRemove({work_name: work_name}, function(err, rule) {
		if (err) return err;
		console.log(rule.work_name + " is removed");
		res.redirect('/instructor');
	});
});

module.exports = router;
