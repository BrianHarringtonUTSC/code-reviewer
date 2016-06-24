var express = require('express');
var router = express.Router();
var PeerEditing = express();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('instruction');
});

router.post('/go_to_peer_review', function(req, res, next) {
	res.redirect('/peer_review');
});

module.exports = router;
