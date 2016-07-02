var express = require('express');
var mongoose = require('mongoose');
var lineReader = require('line-reader');
var router = express.Router();

// GET this page.
router.get('/', function(req, res, next) {
  // loop through tas collection
  var ta_model = require('./models/ta_model.js');
  // find all documents in collection tas
	ta_model.find({}, function (err, tas) {
	  if (err) {
	  	console.log(err);
	  }
	  var num_tas = ta_model.count({});
	  ta_model.count({}, function(err, num_tas) {
	  	// TODO: remove nesetd if
		  if (err) {
		  	console.log(err);
		  }
	  	console.log("the number of tas is " + num_tas);
	  	res.render('tas', {tas : tas, num_tas : num_tas});
	  });
	});
});


// load tas info via a csv file
router.post('/load', function(req, res, next) {
  // check if an instructor uploaded rosters file
  var rosters_file = req.body.rosters;
	var counter = 0; // count the number of lines
	var num_new_tas = 0; // count the number of newly added tas
  var fields, first_name_index, last_name_index, utorid_index, student_number_index, email_index;
  var ta_model = require('./models/ta_model.js');
  lineReader.eachLine(rosters_file, function(line, last) {
    if (counter == 0) {
        // find index of each filed
        fields = line.split(',');
        first_name_index = fields.indexOf("First Name");
        last_name_index = fields.indexOf("Last Name");
        utorid_index = fields.indexOf("UTORiD");
        student_number_index = fields.indexOf("Student Number");
        email_index = fields.indexOf("Email");
    } else {
        var values = line.split(',');
        // create a new ta
        var new_ta = new ta_model({
            first_name : values[first_name_index],
            last_name : values[last_name_index],
            utorid : values[utorid_index],
            student_number : values[student_number_index],
            email : values[email_index],
            is_active : true
        });
        // write a new ta into database
        new_ta.save(function (err) {
            if (err) {
            	console.log(err);
            } else {
            	num_new_tas++;
            }
        });
    }
    counter++;
    // reach EOF
    if (last) {
      console.log(num_new_tas + ' new tas are added');
      res.redirect('/tas');
    }
  });
});

module.exports = router;
