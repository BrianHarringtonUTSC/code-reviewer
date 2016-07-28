var express = require('express');
var router = express.Router();
var PeerEditing = express();

var fs = require('fs');


var student_model = require('./models/student_model.js');
/* GET users listing. */
router.get('/', function(req, res, next) {
	// user authentication
	if (!req.isAuthenticated()) {
		console.log("Please log in");
    return res.redirect('/');
  }
	student_model.findOne({ email: req.user.emails[0].value }, function (err, student) {
	  if (err) return err;
	  if (student == null) {
	  	res.redirect('/' + req.session.current_site);
	  } else {
	  	req.session.current_site = "instruction";
	  	get_instruction_path(req, res, "instruction");
	  }
	 });
});

var readline = require('readline');
var stream = require('stream');

function get_instruction_path(req, res, site) {
	var rule_model = require("./models/rule_model.js");
	rule_model.findOne({ work_name : req.session.work_name }, function(err, rule) {
		req.session.instruction = rule.instruction;
  	read_file(req, res, site);
  });
}

function read_file(req, res, site) {
	var instream = fs.createReadStream(req.session.instruction);
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);
	var str = ""
	rl.on('line', function(line) {
	  str += line + "\n";
	});

	rl.on('close', function() {
		res.render(site, {
			title: site,
			instruction : str
		});
	});
}
router.post('/go_to_peer_review', function(req, res, next) {
	res.redirect('/peer_review');
});

module.exports = router;
