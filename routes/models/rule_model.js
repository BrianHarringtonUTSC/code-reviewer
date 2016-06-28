var mongoose = require('mongoose');

// define rule schema
var rule_schema = new mongoose.Schema({
    work_name : String,
    late_penalty : String,
    num_peers : {
        type: Number,
        max: 7
    },
    required_files : [String], // an array of string
    student_submission_deadline : Date,
    release_to_peers : Date,
    peer_review_deadline : Date,
    release_to_tas : Date,
    ta_review_deadline : Date,
    release_to_students : Date,
    code_repo_path : String,
    instruction_path : String
});

module.exports = mongoose.model('rules', rule_schema);
