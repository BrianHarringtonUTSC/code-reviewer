var mongoose = require('mongoose');

// define rule schema
var rule_schema = new mongoose.Schema({
    work_name : String,
    late_penalty : String,
    num_peers : {
        type: Number,
        max: 7
    },
    required_files : [String],
    repo_path : String,
    num_feedbacks : {
        type: Number,
        max: 20
    },
    feedback_questions: [String],
    student_submission_deadline : mongoose.Schema.Types.Mixed,
    release_to_peers : Date,
    peer_review_deadline : Date,
    release_to_tas : Date,
    ta_review_deadline : Date,
    release_to_students : Date
});

module.exports = mongoose.model('rules', rule_schema);
