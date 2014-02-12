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
  $scope.metrics = appData.metrics;
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
  $scope.metrics = appData.metrics;

  $scope.wages = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];

  $scope.prospects = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];

  $scope.education = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


  $scope.resultMatrix =[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


  $scope.message = "";

  $scope.getWages = function(){
    console.log($scope.metrics);
    $scope.getWagesFor0();
    $scope.getWagesFor1();
    $scope.getProspectsFor0();
    $scope.getProspectsFor1();
    $scope.getEducation();
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

  $scope.getEducation = function(){
    SOC.get('http://opendatacommunities.org/sparql.json?query=PREFIX+finance%3A+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Ffinance%2F%3E%0D%0APREFIX+qb%3A+%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fcube%23%3E%0D%0APREFIX+housing%3A+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Fhousing%2F%3E%0D%0APREFIX+gov%3A+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Flocal-government%2F%3E%0D%0APREFIX+sdmx%3A+%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fsdmx%2F2009%2Fdimension%23%3E%0D%0A%0D%0A%0D%0Aselect+%3Fregion+%28SUM%28%3Fspend%29+as+%3Fs%29+where+%7B%0D%0A%3Fobs+finance%3Aauthority+%3Fdistricts+.%0D%0A%3Fdistricts+%3Chttp%3A%2F%2Fstatistics.data.gov.uk%2Fdef%2Fadministrative-geography%2Fregion%3E+%3Fregion+.%0D%0A%3Fobs+finance%3AserviceExpenditureCategory+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Ffinance%2Fconcept%2Fservice-expenditure-category%2F190%3E+.%0D%0A%3Fobs+qb%3AdataSet+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdata%2Fservice-expenditure%3E+.%0D%0A%3Fobs+finance%3ArevenueAccountBudgetCategory+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Ffinance%2Fconcept%2Frevenue-account-budget-category%2Fnet-total-cost%3E+.%0D%0A%3Fobs+finance%3Aamount+%3Fspend+.%0D%0A%3Fh+qb%3AdataSet+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdata%2Fhouseholds-2008%3E+.%0D%0A%3Fh+sdmx%3ArefArea+%3Farea+.%0D%0A%3Farea+gov%3AisGovernedBy+%3Fdistricts+.%0D%0A%3Fh+housing%3Ahouseholds+%3Fhouseholds%0D%0A%7D%0D%0Agroup+by+%3Fregion')
      .success(function(data){
        angular.forEach(data.results.bindings, function (object, key) {
          var URI = object.region.value;
          var index = $scope.regionLetterToRegionIndex(URI.substring(URI.length-1));
          if (index != -1)
          {
            $scope.education[index] = parseInt(object.s.value);
          }
        });        
      })
      .error(function(data){
        console.error("Error:", data);
      });
  };

  $scope.getLifePlan = function()
  {
    var bestRegion = -1;
    var bestRegionValue = -1;
    for(var index = 0; index < $scope.resultMatrix.length-1; index++)
    {
      var val = 0;
      val += $scope.wages[0][index] * $scope.metrics.wages;
      val += $scope.wages[1][index] * $scope.metrics.wages;
      val += $scope.prospects[0][index] * $scope.metrics.prospects;
      val += $scope.prospects[1][index] * $scope.metrics.prospects;
      val += $scope.education[index]    * $scope.metrics.education;
      console.log(val);
      $scope.resultMatrix[index] = val;    
      
      if (val > bestRegionValue)
      {
        bestRegion = index;
        bestRegionValue = val;
      }
    }
    $scope.message = "You should move to:" + $scope.regionIndexToRegionName(bestRegion);
  };

  // TODO: Make sure we are using the regional indexes correct, LMI have conflicting values?! :(
  $scope.regionLetterToRegionIndex = function(letter) {
    var l = letter;
    switch(l.toLowerCase())
    {
      case 'h': return 0; // London
      case 'a': return 1; // North East
      case 'b': return 2; // North West
      case 'd': return 4; // Yorkshire & Humberside
      case 'e': return 5; // East Midlands
      case 'f': return 6; // West Midlands
      case 'g': return 7; // Eastern
      case 'j': return 9; // South East
      case 'k': return 10;// South West
      default: return -1; // sorry: Scotland, Wales, NI
    };
  };

  $scope.regionIndexToRegionName = function(index)
  {
    switch(index)
    {
      case 0: return 'London';
      case 1: return 'North East';
      case 2: return  'North West';
      case 3: return '????';
      case 4: return 'Yorkshire & Humberside';
      case 5: 'East Midlands';
      case 6: 'West Midlands';
      case 7: 'Eastern';
      case 8: '?????';
      case 9: 'South East';
      case 10: 'South West';
      case 10: return 'Wales';
      case 12: return 'Scotland';
      case 13: return 'Northern Ireland';
    };
  };
}]);

