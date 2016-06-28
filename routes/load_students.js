var mongoose = require('mongoose');
var lineReader = require('line-reader');


var csv_file = "../simple.csv"; // path to a csv file
var counter = 0;
var fields, first_name_index, last_name_index, utorid_index, student_number_index, email_index;
var student_model = require('./models/student_model.js');

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
        var new_student = new student_model({
            first_name : values[first_name_index],
            last_name : values[last_name_index],
            utorid : values[utorid_index],
            student_number : values[student_number_index],
            email : values[email_index],
            is_active : true
        });
        console.log(new_student.first_name);
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
