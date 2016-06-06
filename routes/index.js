var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');


var router = express.Router();

mongoose.connect('mongodb://localhost/code_reviewer');

//Here we are configuring express to use body-parser as middle-ware.
router.use(bodyParser.urlencoded( {extended: true} ));

// middleware to use for all requests
router.use(function(req, res, next) {
	console.log('Aaaand here we go...');
	next();
});

// --- Schemas ---
var userSchema = mongoose.Schema({
	username: String,
	password: String
});                    


var User = mongoose.model('students', userSchema);


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
  	title: 'Index page'
  });
});




router.post('/users', function(req, res) {
	res.render('users', {
	  title: 'Users page'
	});
});

console.log("Connection opened.");

// call addNewStudent ?
router.post('/', function(req, res) {
  addNewStudent();
});

// add a new student
var addNewStudent = function(req, res) {
	console.log("running");
	var newStudent = new User({
		username: req.body.username,
		password: req.body.password
	});
	newStudent.save(function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log("the student's name is " + req.body.username);
			console.log("the password is " + req.body.password);
		}
	});
};


module.exports = router;
