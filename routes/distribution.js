var mongoose = require('mongoose');

var courseName = 'csca08'; // by convention, courseName == name of its database
mongoose.connect('mongodb://localhost/' + courseName);

// schemas
var codeSchema = new mongoose.Schema({
    name: String, // name of this file
    utorid: String, // utorid of the student
    review_by: Array,
    to_review: Array,
    ta: String,
    code_path: String, // file path to the actual code
    report_path: String, // file path to the report.txt
    failed_test_cases: Array, // [String] or [Number]
});

var reviewSchema= new mongoose.Schema({
	author: String,
	review_by: String,
	comment: Array,
	high_light: Array
});

var collectionName = 'a2'; // name of this work in general

var Code = mongoose.model(collectionName, codeSchema);
var Review = mongoose.model('a2_reviews', reviewSchema);

// loop through code(a2) collection
var cStream = Code.find().stream( /*{ transform: JSON.stringify } */);

var code_array = [];

cStream.on('data', function(doc) {
	code_array.push(doc);
});

cStream.on('end', function(doc) {
	distribute(code_array);
});


var num = 3;

function distribute(code_array) {
	var len = code_array.length;
	for (var i = 0; i < len; i ++) {
		for (var j = 1; j <= num; j ++) {
    		var new_review = new Review({
    			author: code_array[i].utorid,
    			review_by: code_array[(i + j) % len].utorid,
    			comment: [],
    			high_light: []
    		});
            // avoid duplicates
    		new_review.save(function (err) {
                //console.log('--------------',new_review);
    			if (err) {
    				console.log("duplicates");
    			}
    		});

			code_array[i].review_by.push(code_array[(i + j) % len].utorid);
			code_array[(i + j) % len].to_review.push(code_array[i].utorid);
		}
	}
	// update the actual collection
	for (var i = 0; i < len; i ++) {
		Code.findOneAndUpdate( 
			{ _id: code_array[i]._id}, 
			{ $set: { review_by: code_array[i].review_by,
			          to_review: code_array[i].to_review } }, 
			{ new: true},
			function(err, doc) {
		    	if (err) console.log(err);
			});
	}
}
