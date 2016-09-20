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
var ta_model = require("./models/ta_model.js");

var code_schema = require("./models/submission_schema.js");

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
	  	if (req.session.current_site != "ta") {
	  		init_all(req, res, 'ta');
	  	} else {
	  		get_ta_utorid(req, res, 'ta');
	  	}
	  }
	 });
	// user authentication
});

function init_all(req, res, site) {
	req.session.current_site = "ta";
	req.session.self_utorid = "";
	req.session.assigned = 1;
	get_ta_utorid(req, res, site);
}

function get_ta_utorid(req, res, site) {
	ta_model.findOne({ email: req.user.emails[0].value }, function (err, ta) {
	  if (err) return err;
	  req.session.self_utorid = ta.utorid;
	  check_release(req, res, site);
	 });
}

function check_release(req, res, site) {
	rule_model.find({}, function (err, rules) {
	  if (err) return err;
		res.render(site, {
			title: site,
			rules : rules,
			assigned : req.session.assigned
		});
	});
}


function find_submission(req, res, site) {
	rule_model.find({}, function (err, rule) {
	  if (err) return err;
	  var rules = rule; work_list = [];
	  for (var i = 0; i < rules.length; i ++) {
	  	work_list.push(rules[i].work_name);
	  }
	  check_loaded(req, res, site, work_list);
	 });

}
function check_loaded(req, res, site, work_list) {
	var loaded_work = []; var counter = 0;
	for (var i = 0; i < work_list.length; i ++) {
		mongoose.connection.db.listCollections({name: work_list[i]})
		.next(function(err, collinfo) {
			counter ++;
		    if (collinfo) {
		        loaded_work.push(work_list[counter-1]);
		    } 
		    if (counter == work_list.length) {
				check_distribution(req, res, site, loaded_work);
		    }
		});
	}
}

/*
* check if the TA has been assign to review or grade 
*/
function check_distribution(req, res, site) {
  var code_model = mongoose.model(req.session.work_name, code_schema);
  code_model.findOne({ ta: req.session.self_utorid }, function(err, code) {
  	if (code == null) {
  		req.session.assigned = 0;
  		res.redirect("/ta");
  	} else {
  		req.session.assigned = 1;
  		res.redirect(site);
  	}
  });
}
router.post('/go_to_ta_review_or_grade', function(req, res, next) {
	for (var key in req.body) {
		req.session.work_name = String(key).substring(0, key.indexOf("_"));	
		if (key.indexOf("review") > -1) {
			check_distribution(req, res, '/ta_review');
		} else {
			check_distribution(req, res, '/ta_grade');
		}
	}
});

module.exports = router;


