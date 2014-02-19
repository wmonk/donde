'use strict';

/* Controllers */
var projectTurkey = angular.module('projectTurkey',['googlechart', 'ngTouch', 'ui.bootstrap']);

projectTurkey.factory('SOC', ['$http', function ($http) {
  return {
    get: function(url) {
      return $http.get(url);
    }
  };
}]);

projectTurkey.service('appData', function(){
  this.users = [
    {
      'age': null,
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
  // this.users = [
  //   {
  //     'age': 23,
  //     'jobTitle' : '',
  //     'jobCode': 3421,
  //     'gender': 1
  //   },
  //   {
  //     'age': 22,
  //     'jobTitle' : '',
  //     'jobCode': 2472,
  //     'gender': 2
  //   }
  // ];
  this.metrics = {
      'wages': 0,
      'prospects': 0,
      'education': 0,
      'expenditure' : 0,
      'age' : 0,
      'density' : 0
    };
});

projectTurkey.controller('dataInput', ['$scope', 'SOC', 'appData', '$http', function($scope, SOC, appData, $http){

  $scope.users = appData.users;
  $scope.metrics = appData.metrics;

  $scope.setSoc = function(i, item){
    $scope.users[i].jobCode = item.jobCode;
  }
  $scope.getSoc = function(i, item){
    return $http.get('http://api.lmiforall.org.uk/api/v1/soc/search', {
      params: {
        q: item,
      }
    }).then(function(data){
      var jobs = [];
      angular.forEach(data.data, function(item){
        jobs.push({jobTitle: item.title, jobCode: item.soc});
      });
      return jobs;
    });
  };
  $scope.partner = true;
  $scope.userPartner = function(i){
    if (i === 0) {
      return true;
    }
    if ($scope.partner) {
      return true;
    }else{
      return false;
    }
  }
}]);

projectTurkey.controller('usa', ['$scope', 'SOC', 'appData', function($scope, SOC, appData){
  $scope.users = appData.users;
  $scope.metrics = appData.metrics;

  $scope.maxTokens = 15;
  $scope.tokensUsed = 0;

  $scope.addTokenTo = function(what){
    if ($scope.metrics[what] >=10 || $scope.tokensUsed === 15) {
      return;
    }
    else
    {
      $scope.metrics[what]++;
      $scope.limitTokens();
    }
  }
  $scope.removeTokenFrom = function(what){
    $scope.limitTokens();
    if ($scope.metrics[what] <= 0) {
      return;
    }
    $scope.metrics[what]--;
  }
  $scope.limitTokens = function(){
    $scope.tokensUsed =   parseInt($scope.metrics.wages, 10)
                        + parseInt($scope.metrics.prospects, 10)
                        + parseInt($scope.metrics.education, 10)
                        + parseInt($scope.metrics.expenditure, 10)
                        + parseInt($scope.metrics.age, 10)
                        + parseInt($scope.metrics.density, 10);
  };

  $scope.getNumber = function(num) {
    return new Array(num);   
}
}]);

projectTurkey.controller('calculateDeets', ['$scope', '$filter', 'SOC', 'appData', function($scope, $filter, SOC, appData){

  $scope.users = appData.users;
  $scope.metrics = appData.metrics;
  $scope.numberOfRegions = 12;
  $scope.wages =
  [
    [null, null, null, null, null, null, null, null, null, null, null,null],
    [null, null, null, null, null, null, null, null, null, null, null,null]
  ];
  $scope.prospects =
  [
    [null, null, null, null, null, null, null, null, null, null, null,null],
    [null, null, null, null, null, null, null, null, null, null, null,null]
  ];
  $scope.education    = [null, null, null, null, null, null, null, null, null, null, null,null];
  $scope.density      = [null, null, null, null, null, null, null, null, null, null, null,null];
  $scope.expenditure  = [null, null, null, null, null, null, null, null, null, null, null,null];
  $scope.age          = [null, null, null, null, null, null, null, null, null, null, null,null];
  $scope.results      = [null, null, null, null, null, null, null, null, null, null, null,null];


  $scope.message = "";

  $scope.getWages = function(){
    $scope.getWagesForUser(0);
    $scope.getWagesForUser(1);
    $scope.getProspectsForUser(0);
    $scope.getProspectsForUser(1);
    $scope.getEducation();
    $scope.getRegionalData();
  }

  $scope.getWagesForUser = function(i) {

    // call without region to get LONDON data
    SOC.get('http://api.lmiforall.org.uk/api/v1/ashe/estimatePay?soc=' + $scope.users[i].jobCode + '&age='+$scope.users[i].age+'coarse=false&filter=gender:' + $scope.users[i].gender).success(function(data)
    {
      var totalWages = 0;
      $scope.wages[i][0] = {"wage": 0, "score": 0};
      $scope.wages[i][0].wage = data.series[0].estpay;
      $scope.wages[i][0].score = data.series[0].estpay;
      totalWages += data.series[0].estpay;

      //now get the rest of the regions
      SOC.get('http://api.lmiforall.org.uk/api/v1/ashe/estimatePay?soc=' + $scope.users[i].jobCode + '&age='+$scope.users[i].age+'coarse=false&filter=gender:' + $scope.users[i].gender + '&breakdown=region')
      .success(function(data)
      {
        angular.forEach(data.series[0].breakdown, function(row, index){
          $scope.wages[i][$scope.regionAsheIndexToOurIndex(row.region)] = {"wage":row.estpay, "score": row.estpay};
          totalWages += row.estpay;
        });

        for (var r = 0; r < $scope.numberOfRegions; r++)
        {
          if ($scope.wages[i][r] != null)
          {
            $scope.wages[i][r].score = parseFloat(($scope.wages[i][r].wage/totalWages).toFixed(4));
          }
          else
          {
            // why has this happened
            console.log("no wages data for index " + r);
            //$scope.wages[i][r] = {"wage" : 0, "score":0};
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
          $scope.prospects[index][$scope.wfIndexToOurIndex(e.code)] = e.employment;
          totalProspects += e.employment;
        });

        for (var r = 0; r < $scope.numberOfRegions; r++)
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
        for (var i = 0; i < $scope.numberOfRegions; i++)
        {
          $scope.education[i] = $scope.education[i] / totalEducation;
          $scope.education[i] = parseFloat($scope.education[i].toFixed(4));
        }
      })
      .error(function(data){
        console.error("Error:", data);
      });
  };
  $scope.getRegionalData = function()
  {
    // expenditure data: http://www.ons.gov.uk/ons/rel/family-spending/family-spending/family-spending-2012-edition/art-chapter-1--overview.html#tab-Household-expenditure-by-region
    SOC.get('data/regionalData.json')
    .success(function(data){
      var totalAge = 0;
      var totalPopulationDensity = 0;
      angular.forEach(data, function (object, key)
      {
        // set up arrays
        $scope.age[object.region] = {"age":null, "val": null};
        $scope.density[object.region] = {"density": null, "val": null};

        $scope.expenditure[object.region] =parseFloat(((1/object.expenditure)*100).toFixed(4));
        // age
        $scope.age[object.region].age = object.averageAge;
        $scope.age[object.region].val = 1/object.averageAge;
        totalAge += 1/object.averageAge;
        
        // population density
        $scope.density[object.region].density = object.populationDensity;
        totalPopulationDensity += object.populationDensity;
      });


      for (var r = 0; r < $scope.numberOfRegions; r++)
      {
        $scope.age[r].val = ($scope.age[r].val / totalAge).toFixed(4);
        $scope.density[r].val = ($scope.density[r].density / totalPopulationDensity).toFixed(4);
         
      }
    });
  };

  $scope.getLifePlan = function()
  { 
    for(var index = 0; index < $scope.numberOfRegions; index++)
    {
      $scope.results[index] = {};
      $scope.results[index].regionIndex = index;
      $scope.results[index].regionName = $scope.regionIndexToRegionName(index);
      
      //wages
      $scope.results[index].wages0Value = $scope.wages[0][index].wage;
      $scope.results[index].wages0Score = $scope.wages[0][index].score * $scope.metrics.wages;
      $scope.results[index].wages1Value = $scope.wages[1][index].wage;
      $scope.results[index].wages1Score = $scope.wages[1][index].score * $scope.metrics.wages; 
      // proscpects
      $scope.results[index].prospects0Value = $scope.prospects[0][index];
      $scope.results[index].prospects0Score = $scope.prospects[0][index] * $scope.metrics.prospects;
      $scope.results[index].prospects1Value = $scope.prospects[1][index];
      $scope.results[index].prospects1Score = $scope.prospects[1][index] * $scope.metrics.prospects;

      // education      
      $scope.results[index].educationValue = $scope.education[index];
      $scope.results[index].educationScore= $scope.education[index] * $scope.metrics.education;

      // expenditure
      $scope.results[index].expenditureValue = $scope.expenditure[index];
      $scope.results[index].expenditureScore = $scope.expenditure[index] * $scope.metrics.expenditure;


      // age
      $scope.results[index].ageValue = $scope.age[index].age;
      $scope.results[index].ageScore = $scope.age[index].val * $scope.metrics.age;

      // density
      $scope.results[index].densityValue = $scope.density[index].density;
      $scope.results[index].densityScore = $scope.density[index].val * $scope.metrics.density;

      $scope.results[index].totalScore = $scope.results[index].wages0Score
                                        +$scope.results[index].wages1Score
                                        +$scope.results[index].prospects0Score
                                        +$scope.results[index].prospects1Score
                                        +$scope.results[index].educationScore
                                        +$scope.results[index].expenditureScore
                                        +$scope.results[index].ageScore
                                        +$scope.results[index].densityScore;
    



    }
    

    $scope.results = $filter('orderBy')($scope.results, '-totalScore'); 
    console.log($scope.results);
    var resultsInGraph = 12;
    for (var r = 0; r < resultsInGraph; r++)
    {
      chart1.data.rows[r] = {c:[{}]}; 
      chart1.data.rows[r].c[0] = {v: $scope.results[r].regionName};
      // wages
      var msg = "P1: £" + $scope.results[r].wages0Value + " P2: £" + $scope.results[r].wages1Value;
      chart1.data.rows[r].c[1] = {v: ($scope.results[r].wages0Score + $scope.results[r].wages1Score), f: msg };
      // prospects
      chart1.data.rows[r].c[2] = {v: ($scope.results[r].prospects0Score + $scope.results[r].prospects1Score)};
      // eduation
      chart1.data.rows[r].c[3] = {v: $scope.results[r].educationScore};
      // expenditure
      chart1.data.rows[r].c[4] = {v: $scope.results[r].expenditureScore}; 
      // age
      chart1.data.rows[r].c[5] = {v: $scope.results[r].ageScore}; 
      // density
      chart1.data.rows[r].c[6] = {v: $scope.results[r].densityScore}; 
      
    }

    $scope.message = "Start your new life in: " + $scope.results[0].regionName;
  };

  // TODO: Make sure we are using the regional indexes correct, LMI have conflicting values?! :(
  $scope.regionLetterToRegionIndex = function(letter) {
    var l = letter;
    switch(l.toLowerCase())
    {
      case 'h': return 0; // London
      case 'a': return 8; // North East
      case 'b': return 7; // North West
      case 'd': return 6; // Yorkshire & Humberside
      case 'e': return 5; // East Midlands
      case 'f': return 4; // West Midlands
      case 'g': return 2; // Eastern
      case 'j': return 1; // South East
      case 'k': return 3;// South West
      default: return -1; // sorry: Scotland, Wales, NI
    };
  };

  $scope.regionIndexToRegionName = function(index)
  {
    switch(index)
    {
      case 0: return 'London';
      case 1: return  'South East';
      case 2: return 'Eastern';
      case 3: return 'South West';
      case 4: return 'West Midlands';
      case 5: return 'East Midlands';
      case 6: return 'Yorkshire & Humberside';
      case 7: return 'North West';
      case 8: return 'North East';
      case 9: return 'Wales';
      case 10: return 'Scotland';
      case 11: return 'Northern Ireland';
    };
  };

  $scope.regionAsheIndexToOurIndex = function(index)
  {
    switch(index)
    {
      case 1: return 0; // London
      case 8: return 1; // south east
      case 7: return 2; // Eastern
      case 9: return 3; // South West
      case 6: return 4; // West Midlands
      case 5: return 5; // East Midlands
      case 4: return 6; // Yorkshire & The Humbder
      case 3: return 7; // North West
      case 2: return 8; // North East
      case 10: return 9; // Wales
      case 11: return 10; // Scotland
      case 12: return 11; // Northern Ireland
    };
  };

  $scope.wfIndexToOurIndex = function(index)
  {
    return index-1;
  };


     var chart1 = {};
    chart1.type = "ColumnChart";
    chart1.cssStyle = "height:600px; width:100%;";
    chart1.data = {"cols": [
        {id: "region", label: "Region", type: "string"},
        {id: "wages", label: "Wages", type: "number"},
        {id: "prospects", label: "Prospects", type: "number"},
        {id: "education", label: "Education", type: "number"},
        {id: "expenditure", label: "Expenditure", type: "number"},
        {id: "age", label: "Population Age", type: "number"},
        {id: "density", label: "Density", type: "number"},
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
