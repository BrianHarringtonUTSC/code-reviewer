// imoprt required node_module
var mongoose = require('mongoose');


// define studentSchema
var reviewSchema = new mongoose.Schema({
	author: String,
	review_by: String,
	comment: Array,
	high_light: Array
});

module.exports = mongoose.model('a2_reviews', reviewSchema);