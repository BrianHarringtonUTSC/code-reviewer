var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var dotenv  = require('dotenv');
var log4js = require('log4js');

log4js.configure('config/log4js_config.json');

var strategy = require('./setup-passport');
// load environment variables
dotenv.load();


// connect to the database
mongoose.connect('mongodb://localhost/csca08');


var routes = require('./routes/index');

// require routes
var self_review = require('./routes/self_review');
var instruction = require('./routes/instruction');
var peer_review = require('./routes/peer_review');
var self_assesment = require('./routes/self_assesment');

var instructor = require('./routes/instructor');
var create_new_work = require('./routes/create_new_work');
var home = require('./routes/home');
var student_reviews = require('./routes/student_reviews');
var create_tas = require('./routes/create_tas');
var create_students = require('./routes/create_students');
var ta = require('./routes/ta');
var ta_review = require('./routes/ta_review');
var ta_grade = require('./routes/ta_grade');
var review_result = require('./routes/review_result');


var app = express();

//--------------------------------------------------------------------------------------------------------------
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use('/static', express.static('/public'));
app.use(session({ secret: process.env.AUTH0_CLIENT_SECRET, resave: true,  saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


app.use('/', routes);
/* checking authentications without adding the lines below into every routes
app.all('*', function(req, res, next) {
  // user authentication
  if (!req.isAuthenticated()) {
    console.log("Please log in");
    return res.redirect('/');
  }
  next();
});*/
app.use('/self_review', self_review);
app.use('/instruction', instruction);
app.use('/peer_review', peer_review);
app.use('/self_assesment', self_assesment);

app.use('/instructor', instructor);
app.use('/create_new_work', create_new_work);
app.use('/student_reviews', student_reviews);
app.use('/home', home);
app.use('/create_students', create_students);
app.use('/create_tas', create_tas);
app.use('/ta', ta);
app.use('/ta_review', ta_review);
app.use('/ta_grade', ta_grade);
app.use('/review_result', review_result);

// Auth0 callback handler
app.get('/callback', 
  passport.authenticate('auth0', { failureRedirect: '/', successRedirect: '/' }),
  function(req, res) {
    if (!req.user) {
      throw new Error('user null');
    }
  });




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;