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
    $scope.getProspectsFor0();
    $scope.getProspectsFor1();
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
          $scope.wages[i][row.region] = row.estpay;
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

  $scope.getProspectsFor0 = function(){
    SOC.get('http://api.lmiforall.org.uk/api/v1/wf/predict/breakdown/region?soc=' + $scope.users[1].jobCode + '&maxYear=2015')
      .success(function(data){
        var totalProspects = 0;
        angular.forEach(data.predictedEmployment[0].breakdown, function(e, i){
          $scope.prospects[0][e.code] = e.employment;
          totalProspects += e.employment;
        });

        for (var r = 0; r < $scope.prospects[0].length; r++)
        {
          $scope.prospects[0][r] = $scope.prospects[0][r]/totalProspects;
          $scope.prospects[0][r] = parseFloat($scope.prospects[0][r].toFixed(4));        
        }

      })
      .error(function(data){
        console.error("Error:", data);
      });
  };

  $scope.getProspectsFor1 = function(){
    SOC.get('http://api.lmiforall.org.uk/api/v1/wf/predict/breakdown/region?soc=' + $scope.users[1].jobCode + '&maxYear=2015')
      .success(function(data){
        var totalProspects = 0;
        angular.forEach(data.predictedEmployment[0].breakdown, function(e, i){
          $scope.prospects[1][e.code] = e.employment;
          totalProspects += e.employment;
        });
        for (var r = 0; r < $scope.prospects[1].length; r++)
        {
          $scope.prospects[1][r] = $scope.prospects[1][r]/totalProspects;
          $scope.prospects[1][r] = parseFloat($scope.prospects[1][r].toFixed(4));        
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
      var val = 0;
      val += $scope.wages[0][index] * $scope.metrics.wages;
      val += $scope.wages[1][index] * $scope.metrics.wages;
      val += $scope.prospects[0][index] * $scope.metrics.prospects;
      val += $scope.prospects[1][index] * $scope.metrics.prospects;
      val += $scope.education[index]    * $scope.metrics.education;
      $scope.resultMatrix[index] = val;    
      
      if (val > bestRegionValue)
      {
        bestRegion = index;
        bestRegionValue = val;
      }
    }
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

     var chart1 = {};
    chart1.type = "ColumnChart";
    chart1.cssStyle = "height:200px; width:300px;";
    chart1.data = {"cols": [
        {id: "month", label: "Month", type: "string"},
        {id: "laptop-id", label: "Laptop", type: "number"},
        {id: "desktop-id", label: "Desktop", type: "number"},
        {id: "server-id", label: "Server", type: "number"},
        {id: "cost-id", label: "Shipping", type: "number"}
    ], "rows": [
        {c: [
            {v: "January"},
            {v: 19, f: "42 items"},
            {v: 12, f: "Ony 12 items"},
            {v: 7, f: "7 servers"},
            {v: 4}
        ]},
        {c: [
            {v: "February"},
            {v: 13},
            {v: 1, f: "1 unit (Out of stock this month)"},
            {v: 12},
            {v: 2}
        ]},
        {c: [
            {v: "March"},
            {v: 24},
            {v: 0},
            {v: 11},
            {v: 6}

        ]}
    ]};

    chart1.options = {
        "title": "Sales per month",
        "isStacked": "true",
        "fill": 20,
        "displayExactValues": true,
        "vAxis": {
            "title": "Sales unit", "gridlines": {"count": 6}
        },
        "hAxis": {
            "title": "Date"
        }
    };

    chart1.formatters = {};

    $scope.chart = chart1;


}]);

