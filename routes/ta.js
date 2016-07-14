var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
var router = express.Router();
var fs = require('fs');

//var io = require('socket.io').listen(80); // initiate socket.io server


//Here we are configuring express to use body-parser as middle-ware.
router.use(bodyParser.urlencoded( {extended: true} ));

/* GET home page. */
router.get('/', function(req, res, next) {
	// user authentication
	res.render('ta');
});

module.exports = router;


