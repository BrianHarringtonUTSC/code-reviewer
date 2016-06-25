var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');



/* GET users listing. */
router.get('/', function(req, res, next) {
  // loop through collection rules
  var rule_model = require('./models/rule_model.js');
  // find all documents in collection rules
	rule_model.find({}, function (err, rules) {
	  if (err) return err;
	  res.render('instructor', { 
	  	title : 'instructor',
	  	rules : rules
	  });
	});
});

module.exports = router;
