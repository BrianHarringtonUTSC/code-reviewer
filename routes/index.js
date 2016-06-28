var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
var router = express.Router();
var fs = require('fs');

//Here we are configuring express to use body-parser as middle-ware.
router.use(bodyParser.urlencoded( {extended: true} ));

// middleware to use for all requests
router.use(function(req, res, next) {
	console.log('\nAaaand here we go...');
	next();
});



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/go_to_home', function(req, res, next) {
	console.log("bbb");
	res.redirect('/home');
});

router.post('/go_to_instructor', function(req, res, next) {
	res.redirect('/instructor');
});

router.get('/login_student', function(req, res, next) {
	console.log(req.query);
	res.send({"status": 200});
});

router.get('/assignments/names', function(req, res, next) {
	console.log(req.query);
	res.send({"assignments": ["Assignment 1", "Assignment 2", "Excercise 3"]});
});


module.exports = router;


