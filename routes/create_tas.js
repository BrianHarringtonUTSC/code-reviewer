var express = require('express');
var mongoose = require('mongoose');
var lineReader = require('line-reader');
var multer = require('multer');
var fs = require('fs');
var router = express.Router();

// temp destination for multer
var temp_folder = './temp/';
var upload = multer({ dest: temp_folder });
var instructor_model = require("./models/instructor_model.js");

// GET this page.
router.get('/', function(req, res, next) {
  // user authentication
  if (!req.isAuthenticated()) {
    console.log("Please log in");
    return res.redirect('/');
  }
  instructor_model.findOne({ email: req.user.emails[0].value }, function (err, instructor) {
  if (err) return err;
  // instructor is not found
  if (instructor == null) {
    res.redirect('/' + req.session.current_site);
  } else { // if it is found
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
  	  	res.render('create_tas', {tas : tas, num_tas : num_tas});
  	  });
  	});
    }
  });

});


// load tas info via a csv file
router.post('/load', upload.single('rosters'), function(req, res, next) {
  // check if an instructor uploaded rosters file
  console.log(req.file);
  var rosters_file = temp_folder + req.file.filename;
	var counter = 0; // count the number of lines
	var num_new_tas = 0; // count the number of newly added tas
  var fields, first_name_index, last_name_index, utorid_index, student_number_index, email_index, weight_index;
  var ta_model = require('./models/ta_model.js');
  console.log(rosters_file);
  lineReader.eachLine(rosters_file, function(line, last) {
    if (counter == 0) {

        // find index of each filed
        fields = line.split(',');
        first_name_index = fields.indexOf("First Name");
        last_name_index = fields.indexOf("Last Name");
        utorid_index = fields.indexOf("UTORiD");
        student_number_index = fields.indexOf("Student Number");
        email_index = fields.indexOf("Email");
        weight_index = fields.indexOf("Weight");
    } else {
        var values = line.split(',');
        // create a new ta
        var new_ta = new ta_model({
            first_name : values[first_name_index],
            last_name : values[last_name_index],
            utorid : values[utorid_index],
            student_number : values[student_number_index],
            email : values[email_index],
            to_review : [],
            to_grade : [],
            weight : values[weight_index],
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
      fs.unlinkSync(rosters_file);
      res.redirect('/create_tas');
    }
  });
});

module.exports = router;
