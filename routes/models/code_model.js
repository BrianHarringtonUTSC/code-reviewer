var mongoose = require('mongoose');

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
                              // TODO, collection name must be specified later
module.exports = mongoose.model('a2', codeSchema);
//TODO, how to exoprt two schemas