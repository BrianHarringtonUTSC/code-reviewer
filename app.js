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

// load environment variables
dotenv.load();
// load passport
var strategy = require('./setup-passport');
// connect to the database
mongoose.connect('mongodb://localhost/csca08');


var routes = require('./routes/index');
// require routes
var self_review = require('./routes/self_review');
var instruction = require('./routes/instruction');
var peer_review = require('./routes/peer_review');
var self_assesment = require('./routes/self_assesment');
var students = require('./routes/students');
var instructor = require('./routes/instructor');
var create_new_work = require('./routes/create_new_work');
var home = require('./routes/home');
var tas = require('./routes/tas');


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
app.use(session({ secret: process.env.AUTH0_CLIENT_SECRET, resave: true,  saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/self_review', self_review);
app.use('/instruction', instruction);
app.use('/peer_review', peer_review);
app.use('/self_assesment', self_assesment);
app.use('/students', students);
app.use('/instructor', instructor);
app.use('/create_new_work', create_new_work);
app.use('/home', home);
app.use('/tas', tas);


// Auth0 callback handler
app.get('/callback',
  passport.authenticate('auth0', { failureRedirect: '/', successRedirect: 'instructor' }),
  function(req, res) {
    if (!req.user) {
      throw new Error('user null');
    }
    res.redirect("/instruction");
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
