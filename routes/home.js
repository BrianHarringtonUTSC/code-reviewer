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
	console.log("ccc");
  res.render('home');
});

router.post('/go_to_instruction', function(req, res, next) {
	res.redirect('/instruction');
});


router.post('/go_to_self_review', function(req, res, next) {
	res.redirect('/self_review');
});



console.log("Connection opened.");
/*
io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' }); // Send data to client

  // wait for the event raised by the client
  socket.on('my other event', function (data) {  
    console.log(data);
  });
});
*/
module.exports = router;


