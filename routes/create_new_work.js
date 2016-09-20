var fs = require( 'fs' );
var path = require( 'path' );
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var router = express.Router();




var moment = require('moment');



var code_schema = require("./models/submission_schema.js");
var review_schema = require("./models/review_schema.js");

var rule_model = require("./models/rule_model.js");
var instructor_model = require("./models/instructor_model.js");
var ta_model = require('./models/ta_model.js');

var error_message = '';
var passed_deadline = "cannot set a deadline which is already passed ";


// GET this page
router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
	}
	instructor_model.findOne({ email: req.user.emails[0].value }, function (err, instructor) {
	  if (err) return err;
	  if (instructor == null) {
	  	res.redirect('/' + req.session.current_site);
	  } else {
	  	if (req.session.current_site != "create_new_work") {
	  		req.session.current_site = "create_new_work";
	  		find_work(req, res, 'create_new_work');
	  	} else {
	  		find_work(req, res, 'create_new_work');
	  	}
	  }
	 });
});
// find work and all its info
function find_work(req, res, site) {
  	rule_model.findOne({ work_name : req.session.work_name }, function(err, rule) {
  		req.session.rule = rule;
  		find_tas(req, res, site);
  });
}
// find all of the tas
function find_tas(req, res, site) {
  	ta_model.find({}, function(err, tas) {
  		req.session.tas = tas;
  		find_num_of_submission(req, res, site, tas);
  });
}

function find_num_of_submission(req, res, site) {
	mongoose.connection.db.listCollections({name: req.session.work_name})
    .next(function(err, collinfo) {
        if (collinfo) {
            var code_model = mongoose.model(req.session.work_name, code_schema);
            code_model.find({}, function(err, code) {
            	req.session.num_submission = code.length;
            	render(req, res, site)
			});
        } else {
            req.session.num_submission = 0;
            render(req, res, site)
        }
    });
}

// render
function render(req, res, site) {
	res.render(site, {
	title: site,
	num_of_submission_loaded : req.session.num_submission,
	tas : req.session.tas,
	work_name: req.session.rule.work_name,
	late_penalty: req.session.rule.late_penalty,
	num_peers: req.session.rule.num_peers,
	required_files: req.session.rule.required_files,
	repo_path: req.session.rule.repo_path,
	folder_name: req.session.rule.folder_name,
	num_feedbacks: req.session.rule.num_feedbacks,
	feedback_questions: req.session.rule.feedback_questions,
	instruction : req.session.rule.instruction,
	peer_review_deadline : req.session.rule.peer_review_deadline,
	error_message: req.session.rule.error_message,
	loaded : req.session.rule.loaded,
	distributed : req.session.rule.distributed,
	ta_distributed : req.session.rule.ta_distributed,
	no_ta_selected : req.session.no_ta_selected,
	ta_selected : req.session.rule.ta_selected
	});
}


function save(req, feedback_questions) {
	rule_model.findOneAndUpdate(
		{ work_name: req.body.work_name },
		{ $set: { work_name : req.body.work_name,
		late_penalty : req.body.late_penalty,
		num_peers : req.body.num_peers,
		required_files : req.body.required_files.split(','),
		repo_path : req.body.repo_path,
		folder_name : req.body.folder_name,
		num_feedbacks :req.body.num_feedbacks,
		feedback_questions : feedback_questions,
		instruction : req.body.instruction,
		peer_review_deadline : req.body.peer_review_deadline_date + ' ' + req.body.peer_review_deadline_time } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
		}
	);
}
/*-------------create------------------------*/
router.post('/edit', function(req, res, next) {
	var feedback_questions = [];
	for (var key in req.body) {
		if (key.indexOf("question") > -1) {
			feedback_questions.push(req.body[key]);
		}
	}

	// if the button clicked is set_feedback, refreash the page
	var num_feedbacks = req.body.num_feedbacks;
	if ("set_feedbacks" in req.body) { // initialize the list
		if (num_feedbacks < feedback_questions.length) {
			var dif = feedback_questions.length - num_feedbacks;
			for (var i=0; i < dif; i++) {
				feedback_questions.pop();
			}
		} else {
			for (var i=0; i < num_feedbacks; i++) {
				if (i >= feedback_questions.length) {
					feedback_questions.push("");
				}
			}
		}
		save(req, feedback_questions);
		res.redirect('/create_new_work');
		return;
	}
	save(req, feedback_questions);
	res.redirect('/create_new_work');
});

/*--------------load_assignment------------------------*/
router.post('/load_assignment', function(req, res, next) {
	rule_model.findOne({ work_name: req.session.work_name }, function(err, rule) {
		if (err) return err;
  		drop_code_collection(req, res, 'l');
  });
});


/*--------------distribution----------------------*/
router.post('/distribute', function(req, res, next) {
	mongoose.connection.db.listCollections({name: req.session.work_name})
	.next(function(err, collinfo) {
	    if (collinfo) {
	    	drop_code_collection(req, res, 'd');
	    } else {
	    	console.log("Not found!");
	    	res.redirect('/create_new_work');
	    }
	});
});

/*--------------distribution--TA------------------*/
router.post('/distribute_ta', function(req, res, next) {
	req.session.ta_selected = [];
	var tas_need_to_review = [];
	for (var key in req.body) {
		if (key.indexOf("checkbox_") > -1) {
			var ta = req.body[key].split(",");
			req.session.ta_selected.push(ta[0]);
			for (var i = 0; i < ta[1]; i++) {
				tas_need_to_review.push(ta[0]);
			}
		}
	}
	if (tas_need_to_review.length == 0) {
		req.session.no_ta_selected = 1;
		res.redirect('/create_new_work');
		return;
	} else {
		req.session.no_ta_selected = 0;
	}
	var code_model = mongoose.model(req.session.work_name, code_schema);
	var cStream = code_model.find().stream();
	req.session.code_array = [];
 	cStream.on('data', function(doc) {
		req.session.code_array.push(doc);
	});

	cStream.on('end', function(doc) {
		shuffle_array_for_ta(req, res, tas_need_to_review, req.session.work_name);
	});

});

function shuffle_array_for_ta(req, res, tas_need_to_review, work_name) {
  var currentIndex = req.session.code_array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = req.session.code_array[currentIndex];
    req.session.code_array[currentIndex] = req.session.code_array[randomIndex];
    req.session.code_array[randomIndex] = temporaryValue;
  }
  distribute_ta(req, res, tas_need_to_review);
}

function distribute_ta(req, res, tas_need_to_review) {
	update_rule(req, res, 'T');
	var code_model = mongoose.model(req.session.work_name, code_schema);
	var reviews_per_weight = Math.floor(req.session.code_array.length / tas_need_to_review.length);
	var code = 0;
	var review_model = mongoose.model(req.session.work_name + "_reviews", review_schema);
	for (var i = 0; i < tas_need_to_review.length; i ++) {
		for (var j = 0; j < reviews_per_weight; j ++) {
			// create reviews
  		var new_review = new review_model({
  			author: req.session.code_array[code].utorid,
  			review_by: tas_need_to_review[i],
  			feedbacks: [],
  			high_light: [],
  			num_stars: 0,
  			mark : 0

  		});
      // avoid duplicates
  		new_review.save(function (err) {
  			if (err) {
  				console.log("duplicates");
  			}
  		});
			req.session.code_array[code].review_by.push(tas_need_to_review[i]);
			req.session.code_array[code].ta = tas_need_to_review[i];
			code ++;
		}
	}
	// distribute remainders
	var j = 0;
	while (code < req.session.code_array.length) {
		var ta_utorid = tas_need_to_review[j];
		// create reviews
		var new_review = new review_model({
			author: req.session.code_array[code].utorid,
			review_by: ta_utorid,
			feedbacks: [],
			high_light: [],
			num_stars: 0, 
			mark : 0

		});
    // avoid duplicates
		new_review.save(function (err) {
			if (err) {
				console.log("duplicates");
			}
		});

		req.session.code_array[code].review_by.push(ta_utorid);
		req.session.code_array[code].ta = tas_need_to_review[i];
		code ++;
		j ++;
	}
	// update both ta and code collection
	for (var i = 0; i < req.session.code_array.length; i ++) {
		code_model.findOneAndUpdate( 
			{ _id: req.session.code_array[i]._id}, 
			{ $set: { review_by: req.session.code_array[i].review_by,
			          ta : req.session.code_array[i].ta } }, 
			{ new: true},
			function(err, doc) {
		    	if (err) console.log(err);
			});
	}
	res.redirect('/create_new_work');
}


function read_file(req, res, mode) {
	var code_model = mongoose.model(req.session.work_name, code_schema);
	// Loop through all the files in the directory
	fs.readdir( req.session.rule.repo_path, function( err, files ) {
	  if( err ) {
	    console.error( "Could not list the directory.", err );
	  } else {
	  	update_rule(req, res, 'L');
	  	var count = 0; 
	    files.forEach( function (studentUtorid, index) {
	      // update students collection
	      var newCodePath = req.session.rule.repo_path + '/' + studentUtorid + '/' + req.session.rule.folder_name + '/' + req.session.rule.required_files[0];
	      var newReportPath = '';
	      fs.stat(newCodePath, function(err, stat) {
	        if (err == null) {
	          var code = new code_model({
              name: req.session.rule.required_files[0],
              utorid: studentUtorid,
              review_by: [],
              to_review: [],
              ta: "",
              code_path: newCodePath,
              report_path: newReportPath,
              failed_test_cases: [],
              self_assess : 0,
              mark : 0
	          });
	          code.save( function(err) {
	            //console.log("added ", code.utorid);
	            if (err) console.log(err);
	            count ++;
	            if (count == req.session.num_submission && (mode == 'd')) {
	            	//console.log('----------------------------------');
	            	find_code_array(req, res);
	            }
	          });
	        } else if (err.code == 'ENOENT') {
	          //console.log("file doesn't exist. the utorid is ", studentUtorid);
	        } else {
	          console.log('some other error', err.code);
	        }
	      });
	    });
	  }
	});
    if (mode == 'l') {
	    res.redirect('/create_new_work');
    } 

}

/*
* update the the boolean in rule_model, keep track of if the work is 
* loaded, distributed, or ta_distributed
*/
function update_rule(req, res, mode) {
	if (mode == 'L') {
		rule_model.findOneAndUpdate(
		{ work_name: req.session.work_name },
		{ $set: { loaded : 1,
				  ta_distributed : 0,
		          distributed : 0,
		          ta_selected : [] } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
		});
	} else if (mode == 'D') {
		rule_model.findOneAndUpdate(
		{ work_name: req.session.work_name },
		{ $set: { distributed : 1 } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
		});
	} else if (mode == 'T'){
		rule_model.findOneAndUpdate(
		{ work_name: req.session.work_name },
		{ $set: { ta_distributed : 1,
		          ta_selected : req.session.ta_selected } },
		{ new: true},
		function(err, doc) {
			if (err) console.log(err);
		});
	} 

}

/*
* drop the code collection and recreate the collection again
*/
function drop_code_collection(req, res, mode) {
	mongoose.connection.db.dropCollection(req.session.work_name, function(err, result) {
		read_file(req, res, mode);
	});
}

/*
* find the find every code enties as a array
*/
function find_code_array(req, res) {
	var code_model = mongoose.model(req.session.work_name, code_schema);
	var cStream = code_model.find().stream( /*{ transform: JSON.stringify } */);
	req.session.code_array = [];
 	cStream.on('data', function(doc) {
		req.session.code_array.push(doc);
	});

	cStream.on('end', function(doc) {
		pre_distribute(req, res);
	});
}

function pre_distribute(req, res) {
	mongoose.connection.db.dropCollection(req.session.work_name + "_reviews", function(err, result) {
		shuffle_array(req, res);
	});
}

function shuffle_array(req, res) {
  var currentIndex = req.session.code_array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = req.session.code_array[currentIndex];
    req.session.code_array[currentIndex] = req.session.code_array[randomIndex];
    req.session.code_array[randomIndex] = temporaryValue;
  }
  distribute(req, res);
}

function distribute(req, res) {
	update_rule(req, res, 'D');
	var code_model = mongoose.model(req.session.work_name, code_schema);
	var review_model = mongoose.model(req.session.work_name + "_reviews", review_schema);
	var len = req.session.code_array.length;
	for (var i = 0; i < len; i ++) {
		for (var j = 1; j <= req.session.rule.num_peers; j ++) {
    		var new_review = new review_model({
    			author: req.session.code_array[i].utorid,
    			review_by: req.session.code_array[(i + j) % len].utorid,
    			feedbacks: [],
    			high_light: [],
    			num_stars: 0, 
    			mark : 0

    		});
            // avoid duplicates
    		new_review.save(function (err) {
    			if (err) {
    				console.log("duplicates");
    			}
    		});

			req.session.code_array[i].review_by.push(req.session.code_array[(i + j) % len].utorid);
			req.session.code_array[(i + j) % len].to_review.push(req.session.code_array[i].utorid);
		}
	}
	// update the actual collection
	for (var i = 0; i < len; i ++) {
		code_model.findOneAndUpdate( 
			{ utorid: req.session.code_array[i].utorid}, 
			{ $set: { review_by: req.session.code_array[i].review_by,
			          to_review: req.session.code_array[i].to_review } }, 
			{ new: true},
			function(err, doc) {
		    	if (err) console.log(err);
			});
	}
	res.redirect('/create_new_work');
}


module.exports = router;
