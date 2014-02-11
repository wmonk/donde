'use strict';

/* Controllers */

var projectTurkey = angular.module('projectTurkey', []);

projectTurkey.factory('SOC', ['$http', function ($http) {
  return {
    get: function(url) {
      return $http.get(url);
    }
  };
}]);

projectTurkey.controller('dataInput', ['$scope', 'SOC', function($scope, SOC){

  $scope.users = [
    {
      'age': 0,
      'jobTitle' : '',
      'jobCode': 0,
      'gender': 1
    },
    {
      'age': 0,
      'jobTitle' : '',
      'jobCode': 0,
      'gender': 1
    }
  ];

  $scope.jobCodesTemp = [];

  $scope.writing = 0;

  $scope.getSoc0 = function() {
    SOC.get('http://api.lmiforall.org.uk/api/v1/soc/search?q=' + $scope.users[0].jobTitle)
    .success(function(data) {
      console.log(data);
      $scope.jobCodesTemp[0] = data;
    });
  };
  $scope.getSoc1 = function() {
    SOC.get('http://api.lmiforall.org.uk/api/v1/soc/search?q=' + $scope.users[1].jobTitle)
    .success(function(data) {
      console.log(data);
      $scope.jobCodesTemp[1] = data;
    });
  };

}]);