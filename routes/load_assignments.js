var fs = require( 'fs' );
var path = require( 'path' );
var process = require( "process" );
var mongoose = require('mongoose');
var mongodb = require('mongodb');

var courseName = 'csca08'; // by convention, courseName == name of its database
mongoose.connect('mongodb://localhost/' + courseName);



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



var directoryPath = "../a2/";
var collectionName = 'a2'; // name of this work in general
var primaryWorkCodeName = 'regex_functions.py';
var primaryWorkReportName = 'a2-report.txt';


var Code = mongoose.model(collectionName, codeSchema);


// Loop through all the files in the directory
fs.readdir( directoryPath, function( err, files ) {
    if( err ) {
        console.error( "Could not list the directory.", err );
    } else {
        files.forEach( function (studentUtorid, index) {
            // update students collection
            var newCodePath = directoryPath + studentUtorid + '/a2/' + primaryWorkCodeName;
            var newReportPath = directoryPath + studentUtorid + '/a2/' + primaryWorkReportName;
            fs.stat(newCodePath, function(err, stat) {
                if (err == null) {
                    //console.log('file exists');
                    // update code(a2) collection
                    // update primary
                    var code = new Code({
                        name: primaryWorkCodeName,
                        utorid: studentUtorid,
                        review_by: [],
                        to_review: [],
                        ta: "",
                        code_path: newCodePath,
                        report_path: newReportPath,
                        failed_test_cases: []
                    });
                    code.save( function(err) {
                        console.log("added ", code.utorid);
                        if (err) console.log(err);
                    });
                } else if (err.code == 'ENOENT') {
                    console.log("file doesn't exist. the utorid is ", studentUtorid);
                } else {
                    console.log('some other error', err.code);
                }
            });
        });
    }
});



console.log('finished');
