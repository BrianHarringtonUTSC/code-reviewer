var mongoose = require('mongoose');
var lineReader = require('line-reader');

var courseName = 'csca08'; // by convention, courseName == name of its database
mongoose.connect('mongodb://localhost/' + courseName);

var csv_file = "../roster-4.csv"; // path to a csv file

// define student schema
var studentSchema = new mongoose.Schema({
    first_name : String,
    last_name : String,
    utorid : {
        type: String, // data type
        required: true,
        unique: true // avoid duplicates
    },
    student_number : String,
    email : String,
    is_active : Boolean // true == active, false == inactive
});

var Student = mongoose.model('students', studentSchema);
var csv_file = "../roster-4.csv"; // path to a csv file
var counter = 0;
var fields, first_name_index, last_name_index, utorid_index, student_number_index, email_index;

lineReader.eachLine(csv_file, function(line, last) {
    if (counter == 0) {
        // find index of each filed
        fields = line.split(',');
        first_name_index = fields.indexOf("First Name");
        last_name_index = fields.indexOf("Last Name");
        utorid_index = fields.indexOf("UTORiD");
        student_number_index = fields.indexOf("Student Number");
        email_index = fields.indexOf("Email");
    } else {
        var values = line.split(',');
        // create a new student
        var new_student = new Student({
            first_name : values[first_name_index],
            last_name : values[last_name_index],
            utorid : values[utorid_index],
            student_number : values[student_number_index],
            email : values[email_index],
            is_active : true
        });
        // write new student into database
        new_student.save(function (err) {
            if (err) console.log(err);
        });
    }
    counter++;
    // do whatever you want with line...
    if(last){
        console.log('im the last');
    }
});
