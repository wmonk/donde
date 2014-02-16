'use strict';

/* Controllers */
var projectTurkey = angular.module('projectTurkey',['googlechart']);

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
      'wages': 1,
      'prospects': 1,
      'education': 1
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
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null]
  ];

  $scope.prospects = [
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null,null]
  ];

  $scope.education = [null, null, null, null, null, null, null, null, null, null, null, null,null];


  $scope.resultMatrix =[null, null, null, null, null, null, null, null, null, null, null, null,null];


  $scope.message = "";

  $scope.getWages = function(){
    $scope.getWagesForUser(0);
    $scope.getWagesForUser(1);
    $scope.getProspectsForUser(0);
    $scope.getProspectsForUser(1);
    $scope.getEducation();
  }

  $scope.getWagesForUser = function(i) {
    
    // call without region to get LONDON data
    SOC.get('http://api.lmiforall.org.uk/api/v1/ashe/estimatePay?soc=' + $scope.users[i].jobCode + '&age='+$scope.users[i].age+'coarse=false&filter=gender:' + $scope.users[i].gender).success(function(data)
    {
      var totalWages = 0; 
      $scope.wages[i][0] = data.series[0].estpay;
      totalWages += data.series[0].estpay;

      //now get the rest of the regions
      SOC.get('http://api.lmiforall.org.uk/api/v1/ashe/estimatePay?soc=' + $scope.users[i].jobCode + '&age='+$scope.users[i].age+'coarse=false&filter=gender:' + $scope.users[i].gender + '&breakdown=region')
      .success(function(data)
      {
        angular.forEach(data.series[0].breakdown, function(row, index){
          $scope.wages[i][$scope.regionAsheIndexToOurIndex(row.region)-1] = row.estpay;
          totalWages += row.estpay;
        });

        for (var r = 0; r < $scope.wages[i].length; r++)
        {
          if ($scope.wages[i][r] != null)
          {
            $scope.wages[i][r] = $scope.wages[i][r]/totalWages;
            $scope.wages[i][r] = parseFloat($scope.wages[i][r].toFixed(4));
          }
        }
      })
      .error(function(data){
        console.error("Error:", data);
      });
    });
  };

  $scope.getProspectsForUser = function(index){
    SOC.get('http://api.lmiforall.org.uk/api/v1/wf/predict/breakdown/region?soc=' + $scope.users[index].jobCode + '&maxYear=2015')
      .success(function(data){
        var totalProspects = 0;
        angular.forEach(data.predictedEmployment[0].breakdown, function(e, i){
          $scope.prospects[index][e.code-1] = e.employment;
          totalProspects += e.employment;
        });

        for (var r = 0; r < $scope.prospects[0].length; r++)
        {
          $scope.prospects[index][r] = $scope.prospects[index][r]/totalProspects;
          $scope.prospects[index][r] = parseFloat($scope.prospects[index][r].toFixed(4));        
        }

      })
      .error(function(data){
        console.error("Error:", data);
      });
  };


  $scope.getEducation = function(){
    SOC.get('http://opendatacommunities.org/sparql.json?query=PREFIX+finance%3A+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Ffinance%2F%3E%0D%0APREFIX+qb%3A+%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fcube%23%3E%0D%0APREFIX+housing%3A+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Fhousing%2F%3E%0D%0APREFIX+gov%3A+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Flocal-government%2F%3E%0D%0APREFIX+sdmx%3A+%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fsdmx%2F2009%2Fdimension%23%3E%0D%0A%0D%0A%0D%0Aselect+%3Fregion+%28SUM%28%3Fspend%29+as+%3Fs%29+where+%7B%0D%0A%3Fobs+finance%3Aauthority+%3Fdistricts+.%0D%0A%3Fdistricts+%3Chttp%3A%2F%2Fstatistics.data.gov.uk%2Fdef%2Fadministrative-geography%2Fregion%3E+%3Fregion+.%0D%0A%3Fobs+finance%3AserviceExpenditureCategory+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Ffinance%2Fconcept%2Fservice-expenditure-category%2F190%3E+.%0D%0A%3Fobs+qb%3AdataSet+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdata%2Fservice-expenditure%3E+.%0D%0A%3Fobs+finance%3ArevenueAccountBudgetCategory+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Ffinance%2Fconcept%2Frevenue-account-budget-category%2Fnet-total-cost%3E+.%0D%0A%3Fobs+finance%3Aamount+%3Fspend+.%0D%0A%3Fh+qb%3AdataSet+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdata%2Fhouseholds-2008%3E+.%0D%0A%3Fh+sdmx%3ArefArea+%3Farea+.%0D%0A%3Farea+gov%3AisGovernedBy+%3Fdistricts+.%0D%0A%3Fh+housing%3Ahouseholds+%3Fhouseholds%0D%0A%7D%0D%0Agroup+by+%3Fregion')
      .success(function(data){
        var totalEducation = 0;
        angular.forEach(data.results.bindings, function (object, key) {
          var URI = object.region.value;
          var index = $scope.regionLetterToRegionIndex(URI.substring(URI.length-1));
          if (index != -1)
          {
            $scope.education[index] = parseInt(object.s.value);
            totalEducation += parseInt(object.s.value);
          }
        }); 
        for (var i = 0; i < $scope.education.length; i++)
        {
          $scope.education[i] = $scope.education[i] / totalEducation;
          $scope.education[i] = parseFloat($scope.education[i].toFixed(4)); 
        }
      })
      .error(function(data){
        console.error("Error:", data);
      });
  };

  $scope.getLifePlan = function()
  {
    var bestRegion = -1;
    var bestRegionValue = 0;
    for(var index = 0; index < $scope.resultMatrix.length-1; index++)
    {
      chart1.data.rows[index] = {c:[{}]};
      //chart1.data.rows[index].c[index][0] = {v: $scope.regionIndexToRegionName(index)};
      chart1.data.rows[index].c[0] = {v: $scope.regionIndexToRegionName(index)};

      var val = 0;

      val += $scope.wages[0][index] * $scope.metrics.wages;
      chart1.data.rows[index].c[1] = {v: $scope.wages[0][index] * $scope.metrics.wages};      

      val += $scope.wages[1][index] * $scope.metrics.wages;
      chart1.data.rows[index].c[2] = {v: $scope.wages[1][index] * $scope.metrics.wages};      


      val += $scope.prospects[0][index] * $scope.metrics.prospects;
      chart1.data.rows[index].c[3] = {v: $scope.prospects[0][index] * $scope.metrics.prospects};      


      val += $scope.prospects[1][index] * $scope.metrics.prospects;
      chart1.data.rows[index].c[4] = {v: $scope.prospects[1][index] * $scope.metrics.prospects};

      val += $scope.education[index]    * $scope.metrics.education;
      chart1.data.rows[index].c[5] = {v: $scope.education[index] * $scope.metrics.education};

      $scope.resultMatrix[index] = val;    
      
      if (val > bestRegionValue)
      {
        bestRegion = index;
        bestRegionValue = val;
      }
    }
    bestRegion += 1;
    if (bestRegion != -1)
    {
      $scope.message = "You should move to:" + $scope.regionIndexToRegionName(bestRegion);
    }
  };

  // TODO: Make sure we are using the regional indexes correct, LMI have conflicting values?! :(
  $scope.regionLetterToRegionIndex = function(letter) {
    var l = letter;
    switch(l.toLowerCase())
    {
      case 'h': return 1; // London
      case 'a': return 9; // North East
      case 'b': return 8; // North West
      case 'd': return 7; // Yorkshire & Humberside
      case 'e': return 6; // East Midlands
      case 'f': return 5; // West Midlands
      case 'g': return 3; // Eastern
      case 'j': return 2; // South East
      case 'k': return 4;// South West
      default: return -1; // sorry: Scotland, Wales, NI
    };
  };

  $scope.regionIndexToRegionName = function(index)
  {
    switch(index)
    {
      case 1: return 'London';
      case 2: return  'South East';
      case 3: return 'Eastern';
      case 4: return 'South West';
      case 5: return 'West Midlands';
      case 6: return 'East Midlands';
      case 7: return 'Yorkshire & Humberside';
      case 8: return 'North West';
      case 9: return 'North East';
      case 10: return 'Wales';
      case 11: return 'Scotland';
      case 12: return 'Northern Ireland';
    };
  };

  $scope.regionAsheIndexToOurIndex = function(index)
  {
    switch(index)
    {
      case 0: return 1; // London
      case 9: return 2; // south east
      case 7: return 3; // Eastern
      case 10: return 4; // South West
      case 6: return 5; // West Midlands
      case 5: return 6; // East Midlands
      case 4: return 7; // Yorkshire & The Humbder
      case 2: return 8; // North West
      case 1: return 9; // North East
      case 11: return 10; // Wales
      case 12: return 11; // Scotland
      case 13: return 12; // Northern Ireland
    };
  };


     var chart1 = {};
    chart1.type = "ColumnChart";
    chart1.cssStyle = "height:600px; width:600px;";
    chart1.data = {"cols": [
        {id: "region", label: "Region", type: "string"},
        {id: "wage0", label: "Wage Zero", type: "number"},
        {id: "wage1", label: "Wage One", type: "number"},
        {id: "prospects0", label: "Prospects Zero", type: "number"},
        {id: "prospects1", label: "Prospect One", type: "number"},
        {id: "education", label: "Education", type: "number"}
    ], "rows": [
    ]};
  

    chart1.options = {
        "title": "Region Score Breakdown",
        "isStacked": "true",
        "fill": 20,
        "displayExactValues": true,
        "vAxis": {
            "title": "Score", "gridlines": {"count": 6}
        },
        "hAxis": {
            "title": "Region"
        }
    };

    chart1.formatters = {};

    $scope.chart = chart1;


}]);

