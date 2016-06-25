var express = require('express');
var mongoose = require('mongoose');
var lineReader = require('line-reader');
var router = express.Router();


// GET this page.
router.get('/', function(req, res, next) {
  // loop through students collection
  var student_model = require('./models/student_model.js');
  // find all documents in collection students
	student_model.find({}, function (err, students) {
	  if (err) {
	  	console.log(err);
	  }
	  var num_students = student_model.count({});
	  student_model.count({}, function(err, num_students) {
	  	// TODO: remove nesetd if
		  if (err) {
		  	console.log(err);
		  }
	  	console.log("the number of students is " + num_students);
	  	res.render('students', {students : students, num_students : num_students});
	  });
	});
});

// load students info via a csv file
router.post('/load', function(req, res, next) {
	
	// var counter = 0; // count the number of lines
	// var num_new_students = 0; // count the number of newly added students
 //  var fields, first_name_index, last_name_index, utorid_index, student_number_index, email_index;
 //  var student_model = require('./models/student_model.js');
  var csv_file = "./simple.csv"; // path to a csv file
  console.log("--------------before------------");
  // loop through a given csv file\
  lineReader.eachLine(csv_file, function(line, last) {
    console.log("running in simple");
    console.log(line);
  });
  console.log("--------after------------");
  res.redirect('/students');
  // lineReader.eachLine(csv_file, function(line, last) {
  // 	console.log("running" + counter);
  // 	if (err) {
  // 		console.log(err);
  // 	}
  //   if (counter == 0) {
  //       // find index of each filed
  //       fields = line.split(',');
  //       first_name_index = fields.indexOf("First Name");
  //       last_name_index = fields.indexOf("Last Name");
  //       utorid_index = fields.indexOf("UTORiD");
  //       student_number_index = fields.indexOf("Student Number");
  //       email_index = fields.indexOf("Email");
  //   } else {
  //       var values = line.split(',');
  //       // create a new student
  //       var new_student = new student_model({
  //           first_name : values[first_name_index],
  //           last_name : values[last_name_index],
  //           utorid : values[utorid_index],
  //           student_number : values[student_number_index],
  //           email : values[email_index],
  //           is_active : true
  //       });
  //       // write a new student into database
  //       new_student.save(function (err) {
  //           if (err) {
  //           	console.log(err);
  //           } else {
  //           	num_new_students++;
  //           }
  //       });
  //   }
  //   counter++;
  //   console.log("running2");
  //   // reach EOF
  //   if (last) {
  //     console.log(num_new_students + ' new students are added');
  //     res.redirect('/students');
  //   }
  // });
});

module.exports = router;
