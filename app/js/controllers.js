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

projectTurkey.service('appData', function(){
  // this.users = [
  //   {
  //     'age': 0,
  //     'jobTitle' : '',
  //     'jobCode': 0,
  //     'gender': 1
  //   },
  //   {
  //     'age': 0,
  //     'jobTitle' : '',
  //     'jobCode': 0,
  //     'gender': 1
  //   }
  // ];
  this.users = [
    {
      'age': 23,
      'jobTitle' : '',
      'jobCode': 3421,
      'gender': 1
    },
    {
      'age': 22,
      'jobTitle' : '',
      'jobCode': 2472,
      'gender': 2
    }
  ];
  this.metrics = {
      'wages': 0,
      'prospects': 0,
      'education': 0
    };
})

projectTurkey.controller('dataInput', ['$scope', 'SOC', 'appData', function($scope, SOC, appData){

  $scope.users = appData.users;
  $scope.jobCodesTemp = [];
  $scope.writing = 0;

  $scope.getSoc0 = function() {
    SOC.get('http://api.lmiforall.org.uk/api/v1/soc/search?q=' + $scope.users[0].jobTitle)
    .success(function(data) {
      $scope.jobCodesTemp[0] = data;
    });
  };
  $scope.getSoc1 = function() {
    SOC.get('http://api.lmiforall.org.uk/api/v1/soc/search?q=' + $scope.users[1].jobTitle)
    .success(function(data) {
      $scope.jobCodesTemp[1] = data;
    });
  };

}]);

projectTurkey.controller('usa', ['$scope', 'SOC', 'appData', function($scope, SOC, appData){
  $scope.users = appData.users;
  $scope.metrics = appData.metrics;

  $scope.maxTokens = 14;
  $scope.tokensUsed = 0;
  $scope.maxWages = 15;
  $scope.maxProspects = 15;
  $scope.maxEducation = 15;
  $scope.limitTokens = function(){
    $scope.maxWages = (parseInt($scope.maxTokens) - parseInt($scope.tokensUsed)) + parseInt($scope.metrics.wages);
    $scope.maxProspects = (parseInt($scope.maxTokens) - parseInt($scope.tokensUsed)) + parseInt($scope.metrics.prospects);
    $scope.maxEducation = (parseInt($scope.maxTokens) - parseInt($scope.tokensUsed)) + parseInt($scope.metrics.education);
    $scope.tokensUsed = parseInt($scope.metrics.wages) + parseInt($scope.metrics.prospects) + parseInt($scope.metrics.education);
  }
}])

projectTurkey.controller('calculateDeets', ['$scope', 'SOC', 'appData', function($scope, SOC, appData){

  $scope.users = appData.users;

  $scope.wages = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];

  $scope.prospects = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];

  $scope.getWages = function(){
    $scope.getWagesFor0();
    $scope.getWagesFor1();
    $scope.getProspectsFor0();
    $scope.getProspectsFor1();
  }

  $scope.getWagesFor0 = function() {
    SOC.get('http://api.lmiforall.org.uk/api/v1/ashe/estimatePay?soc=' + $scope.users[0].jobCode + '&coarse=true&filter=gender:' + $scope.users[0].gender + '&breakdown=region')
      .success(function(data){
        angular.forEach(data.series[0].breakdown, function(e, i){
          $scope.wages[0][e.region] = e.estpay;
        });
      })
      .error(function(data){
        console.error("Error:", data);
      });
  };

  $scope.getWagesFor1 = function(){
    SOC.get('http://api.lmiforall.org.uk/api/v1/ashe/estimatePay?soc=' + $scope.users[1].jobCode + '&coarse=true&filter=gender:' + $scope.users[1].gender + '&breakdown=region')
      .success(function(data){
        angular.forEach(data.series[0].breakdown, function(e, i){
          $scope.wages[1][e.region] = e.estpay;
        });
      })
      .error(function(data){
        console.error("Error:", data);
      });
  };

  $scope.getProspectsFor0 = function(){
    SOC.get('http://api.lmiforall.org.uk/api/v1/wf/predict/breakdown/region?soc=' + $scope.users[1].jobCode + '&maxYear=2015')
      .success(function(data){
        angular.forEach(data.predictedEmployment[0].breakdown, function(e, i){
          $scope.prospects[0][e.code] = e.employment;
        });
      })
      .error(function(data){
        console.error("Error:", data);
      });
  };

  $scope.getProspectsFor1 = function(){
    SOC.get('http://api.lmiforall.org.uk/api/v1/wf/predict/breakdown/region?soc=' + $scope.users[1].jobCode + '&maxYear=2015')
      .success(function(data){
        angular.forEach(data.predictedEmployment[0].breakdown, function(e, i){
          $scope.prospects[1][e.code] = e.employment;
        });
      })
      .error(function(data){
        console.error("Error:", data);
      });
  };

}]);

