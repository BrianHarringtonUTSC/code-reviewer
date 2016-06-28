'use strict';
// angular front-end(not in use)
angular.module('myApp', [])
    .service('apiRouteService', ['$http', function($http) {
        this.get = function(url, parameter) {
            return $http({
                method: 'GET',
                url: 'http://localhost:3000/' + url,
                headers: {"Content-Type" : "application/json"},
                params: parameter
            })
        }
    }])
    .controller('mainController', ['$scope', 'apiRouteService', '$timeout',
        function ($scope, apiRouteService, $timeout) {
        $scope.loginPage = true;
        $scope.review = function(type) {
            $scope.reviewType = "other";
            $scope.reviewSelection = false;
            $scope.reviewSection = true;
        }
        $scope.selectAssignment = function(assignmentName) {
            $scope.assignmentsPage = false;
            $scope.reviewSelection = true;
            $scope.currentAssignment = assignmentName;
        }
        $scope.login =  function (username, password) {

            $scope.loginPage = false;
        	//call api, do stuff
        	console.log("Logging in as user: " + username + " password: " + password);
        	//send request to api to log in.
            apiRouteService.get('login_student', {
                "username" : username, 
                "password" : password
            }).then(function (data) {
                $scope.username  = username;
                $scope.password  = password;
                console.log("You are now logged in.");
                return apiRouteService.get('assignments/names',{});
            }).then(function(data) {
                // /assignment takes nothing, returns all assignments in data.assignments
                console.log(data);
                $scope.assignmentsPage = true;
                $timeout(function() {
                    $scope.assignments =  data.data.assignments;
                });
            });
            //something         
        };
        $scope.mouseOverExample = function() {
            console.log("MOUSED OVER");
        }
        console.log("started.");
    }])
    .controller('reviewController', ['$scope', 'apiRouteService', '$timeout',
        function ($scope, apiRouteService, $timeout) {

        }]);