var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
var router = express.Router();
var fs = require('fs');

//var io = require('socket.io').listen(80); // initiate socket.io server
var ta_model = require('./models/ta_model.js');

var work_list = [];
var rule_model = require("./models/rule_model.js");
//Here we are configuring express to use body-parser as middle-ware.
router.use(bodyParser.urlencoded( {extended: true} ));

/* GET home page. */
router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
	}
	ta_model.findOne({ email: req.user.emails[0].value }, function (err, ta) {
	  if (err) return err;
	  if (ta == null) {
	  	res.redirect('/' + req.session.current_site);
	  } else {
	  	req.session.current_site = "ta";
	  	find_submission(req, res, 'ta');
	  }
	 });
	// user authentication
});

function find_submission(req, res, site) {
	rule_model.find({}, function (err, rule) {
	  if (err) return err;
	  var rules = rule; work_list = [];
	  for (var i = 0; i < rules.length; i ++) {
	  	work_list.push(rules[i].work_name);
	  }
	  res.render(site, {
			title: site,
			work_list: work_list
		});
	 });

}
router.post('/go_to_ta_review_or_grade', function(req, res, next) {
	for (var key in req.body) {
		req.session.work_name = key;	
		if (req.body[key] == "review") {
			res.redirect('/ta_review');
		} else {
			res.redirect('/ta_grade');
		}
	}
});

module.exports = router;


