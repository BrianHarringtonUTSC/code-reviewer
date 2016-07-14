var mongoose = require('mongoose');

// define studentSchema
var instructor_schema = new mongoose.Schema({
    first_name : String,
    last_name : String,
    email : {
    		type: String,
    		unique: true, // avoid duplicates
    		requied: true // primary key
    },
    is_active : Boolean // true == active, false == inactive
});

// link collection instructors and instructor_shcema
module.exports = mongoose.model('instructors', instructor_schema);
