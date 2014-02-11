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


projectTurkey.controller('calculateDeets', ['$scope', 'SOC', function($scope, SOC)
{

  $scope.wages = [
  {
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }, 
    {
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  ];

  $scope.prospects = [
  {
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }, 
    {
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  ];

  $scope.getWagesFor0 = function() {
    SOC.get('http://api.lmiforall.org.uk/api/v1/ashe/estimatePay?soc=" + $scope.users[0].jobCode + "&coarse=true&filter=gender:" + gender + "&breakdown=region')    
    .sucess(function(data)
    {
      console.log(data);
      angular.forEach(data.series[0].breakdown, function(i,e)
      {
        $scope.wages[0][e.region] = e.estpay;
      });
    };
  };

  $scope.getWagesFor1 = function()
  {
    SOC.get('http://api.lmiforall.org.uk/api/v1/ashe/estimatePay?soc=' + $scope.users[0].jobCode + '&coarse=true&filter=gender:' + gender + '&breakdown=region')    
    .sucess(function(data)
    {
      angular.forEach(data.series[0].breakdown, function(i,e)
      {
        $scope.wages[1][e.region] = e.estpay;
      });
    };
  };

  $scope.getProspectsFor0 = function()
  {
    SOC.get('http://api.lmiforall.org.uk/api/v1/wf/predict/breakdown/region?soc=' + soc + '&maxYear=2015')    
    .sucess(function(data)
    {
      angular.forEach(data.predictedEmployment[0].breakdown, function(i,e)
      {
        $scope.prospects[0][e.code] = e.estpay;
      });
    };
  };

  $scope.getProspectsFor1 = function()
  {
    SOC.get('http://api.lmiforall.org.uk/api/v1/wf/predict/breakdown/region?soc=' + soc + '&maxYear=2015')    
    .sucess(function(data)
    {
      angular.forEach(data.predictedEmployment[0].breakdown, function(i,e)
      {
        $scope.prospects[1][e.code] = e.estpay;
      });
    };
  };
}]);

