var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('self_assesment');
});

router.post('/go_to_home', function(req, res, next) {
  res.redirect('/home');
});

console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
module.exports = router;
