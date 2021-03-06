var express = require('express');
var mongoose = require('mongoose');
var lineReader = require('line-reader');
var fs = require('fs');
var multer = require('multer');


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
    req.session.current_site = 'create_students';
  } else { // if it is found

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
          res.render('create_students', {students : students, num_students : num_students});
        });
      });

    }
  });

});




// load students info via a csv file
router.post('/load', upload.single('rosters'), function(req, res, next) {
  // check if an instructor uploaded rosters file
  var rosters_file = temp_folder + req.file.filename;
	var counter = 0; // count the number of lines
	var num_new_students = 0; // count the number of newly added students
  var fields, first_name_index, last_name_index, utorid_index, student_number_index, email_index;
  var student_model = require('./models/student_model.js');
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
    } else {
        var values = line.split(',');
        // create a new student
        var new_student = new student_model({
            first_name : values[first_name_index],
            last_name : values[last_name_index],
            utorid : values[utorid_index],
            student_number : values[student_number_index],
            email : values[email_index],
            is_active : true
        });
        // write a new student into database
        new_student.save(function (err) {
            if (err) {
            	console.log(err);
            } else {
            	num_new_students++;
            }
        });
    }
    counter++;
    // reach EOF
    if (last) {
      console.log(num_new_students + ' new students are added');
      // delete this file from temp folder
      fs.unlinkSync(rosters_file);
      res.redirect('/create_students');
    }
  });
});

router.post('/unload_all_students', function(req, res, next) {
  var student_model = require('./models/student_model.js');
  student_model.remove({}, function(err) {
    console.log("student collection is dropped");
    res.redirect('/create_students');
  });
});

module.exports = router;
