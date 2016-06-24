var express = require('express');
var mongoose = require('mongoose');

var router = express.Router();

// GET this page. */
router.get('/', function(req, res, next) {
  // loop through students collection
  var student_model = require('./models/student_model.js');
  // find all documents in collection students
	student_model.find({}, function (err, students) {
	  if (err) return err;
	  res.render('students', {students : students});
	});
});


module.exports = router;
