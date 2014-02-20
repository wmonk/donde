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
      'age': 22,
      'jobTitle' : '',
      'jobCode': 3421,
      'gender': 1
    },
    {
      'age': 21,
      'jobTitle' : '',
      'jobCode': 5431,
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


}]);

projectTurkey.controller('calculateDeets', ['$scope', '$filter', '$sce', 'SOC', 'appData', '$q', function($scope, $filter, $sce, SOC, appData, $q){

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
  };


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

  $scope.averages     = {};

  $scope.result_region = "";
  $scope.result_employment = "";
  $scope.result_costs = "";
  $scope.result_population = "";

  $scope.getWages = function(){
    $scope.getWagesForUser(0);
    $scope.getWagesForUser(1);
    $scope.getProspectsForUser(0);
    $scope.getProspectsForUser(1);
    $scope.getEducation();
    $scope.getRegionalData();
  };


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

          $scope.prospects[index][$scope.wfIndexToOurIndex(e.code)] = {"raw":e.employment, "score":e.employment};
          totalProspects += e.employment;
        });

        for (var r = 0; r < $scope.numberOfRegions; r++)
        {
          if ($scope.prospects[index][r] != null) {
            $scope.prospects[index][r].score = parseFloat(($scope.prospects[index][r].score/(totalProspects*2)).toFixed(4));
          }else{
            $scope.prospects[index][r] = {"raw": 0, "score": 0};
          }
        }

        return true;
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
            $scope.education[index] ={"raw": parseInt(object.s.value), "score": parseInt(object.s.value) };
            totalEducation += parseInt(object.s.value);
          }
        });
        for (var i = 0; i < $scope.numberOfRegions; i++)
        {
          if ($scope.education[i] != null)
          {
            $scope.education[i].score = parseFloat(($scope.education[i].score / totalEducation).toFixed(4));
          }
          else
          {
            $scope.education[i] = {"score": 0, "raw": 0};
          }
        }

        return true;
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
        $scope.expenditure[object.region] = {"raw": 0, "score": 0};
        $scope.age[object.region] = {"raw":0, "score": 0};
        $scope.density[object.region] = {"raw": 0, "score": 0};

        // expenditure
        $scope.expenditure[object.region].raw = object.expenditure;
        $scope.expenditure[object.region].score = parseFloat(((1/object.expenditure)*100).toFixed(4));
        // age
        $scope.age[object.region].raw = object.averageAge;
        $scope.age[object.region].score = 1/object.averageAge;
        totalAge += 1/object.averageAge;

        // population density
        $scope.density[object.region].raw = object.populationDensity;
        totalPopulationDensity += object.populationDensity;
      });


      for (var r = 0; r < $scope.numberOfRegions; r++)
      {
        $scope.age[r].score = ($scope.age[r].score / totalAge).toFixed(4);
        $scope.density[r].score = ($scope.density[r].raw / totalPopulationDensity).toFixed(4);
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
      // prospects
      $scope.results[index].prospects0Value = $scope.prospects[0][index].raw;
      $scope.results[index].prospects0Score = $scope.prospects[0][index].score * $scope.metrics.prospects;
      $scope.results[index].prospects1Value = $scope.prospects[1][index].raw;
      $scope.results[index].prospects1Score = $scope.prospects[1][index].score * $scope.metrics.prospects;

      // education
      $scope.results[index].educationValue = $scope.education[index].raw;
      $scope.results[index].educationScore = $scope.education[index].score * $scope.metrics.education;

      // expenditure
      $scope.results[index].expenditureValue = $scope.expenditure[index].raw;
      $scope.results[index].expenditureScore = $scope.expenditure[index].score * $scope.metrics.expenditure;

      // age
      $scope.results[index].ageValue = $scope.age[index].raw;
      $scope.results[index].ageScore = $scope.age[index].score * $scope.metrics.age;

      // density
      $scope.results[index].densityValue = $scope.density[index].raw;
      $scope.results[index].densityScore = $scope.density[index].score * $scope.metrics.density;

      $scope.results[index].totalScore = $scope.results[index].wages0Score
                                        +$scope.results[index].wages1Score
                                        +$scope.results[index].prospects0Score
                                        +$scope.results[index].prospects1Score
                                        +$scope.results[index].educationScore
                                        +$scope.results[index].expenditureScore
                                        +$scope.results[index].ageScore
                                        +$scope.results[index].densityScore;
    }
    // result 0 is the best region based on score!
    $scope.results = $filter('orderBy')($scope.results, '-totalScore');

    // calculate the 'average' region
    $scope.averages = {"wages0":0,"wages1":0, "prospects0":0,"prospects1":0, "education":0,"expenditure":0,"age":0,"density":0};
    for (var r = 0; r < $scope.numberOfRegions; r++)
    {
      $scope.averages.wages0 += $scope.results[r].wages0Value;
      $scope.averages.wages1 += $scope.results[r].wages1Value;
      $scope.averages.prospects0 += $scope.results[r].prospects0Value;
      $scope.averages.prospects1 += $scope.results[r].prospects1Value;
      $scope.averages.education += $scope.results[r].educationValue;
      $scope.averages.expenditure += $scope.results[r].expenditureValue;
      $scope.averages.age += $scope.results[r].ageValue;
      $scope.averages.density += $scope.results[r].densityValue;
    }

    for(var propertyName in $scope.averages)
    {
      $scope.averages[propertyName] = ($scope.averages[propertyName]/$scope.numberOfRegions).toFixed(4);
    }

    var resultsInGraph = 4;
    for (var r = 0; r < resultsInGraph; r++)
    {
      console.log($scope.results[r].regionName);
      chart1.data.rows[r] = {c:[{}]};
      chart1.data.rows[r].c[0] = {v: $scope.results[r].regionName};
      // wages
      var wagesMsg = "P1: £" + $scope.results[r].wages0Value + " P2: £" + $scope.results[r].wages1Value;
      chart1.data.rows[r].c[1] = {v: ($scope.results[r].wages0Score + $scope.results[r].wages1Score), f: wagesMsg};

      // prospects
      var prospectsMsg = "P1: " + $scope.results[r].prospects0Value.toFixed(0) + " P2: " + $scope.results[r].prospects1Value.toFixed(0);
      chart1.data.rows[r].c[2] = {v: ($scope.results[r].prospects0Score + $scope.results[r].prospects1Score), f: prospectsMsg};
      // eduation
      chart1.data.rows[r].c[3] = {v: $scope.results[r].educationScore};
      // expenditure
      var expenditureMsg = "£" + $scope.results[r].expenditureValue.toFixed(0) + " per week";
      chart1.data.rows[r].c[4] = {v: $scope.results[r].expenditureScore, f: expenditureMsg};
      // age
      var ageMsg = $scope.results[r].ageValue + " years old";
      chart1.data.rows[r].c[5] = {v: $scope.results[r].ageScore, f:ageMsg };
      // density
      var densityMsg = $scope.results[r].densityValue + " people per square km";
      chart1.data.rows[r].c[6] = {v: $scope.results[r].densityScore, f:densityMsg};

    }



    // ouput results!
    var regionMessage = "Donde calculates that the best area for you to live is in the " + $scope.results[0].regionName + " region.";
    $scope.result_region = $sce.trustAsHtml(regionMessage);

    // employment
    var wages0Percent = (($scope.results[0].wages0Value / $scope.averages.wages0)*100).toFixed(0)-100;
    var wages1Percent = (($scope.results[0].wages1Value / $scope.averages.wages1)*100).toFixed(0)-100;
    var prospects0Percent = (($scope.results[0].prospects0Value / $scope.averages.prospects0)*100).toFixed(0)-100;
    var prospects1Percent = (($scope.results[0].prospects1Value / $scope.averages.prospects1)*100).toFixed(0)-100;

    var employmentOutput = "<b>" + $scope.users[0].jobTitle +"</b><br/>You can earn on average <i>£" + $scope.results[r].wages0Value + " per week</i> in "+ $scope.results[0].regionName + ", this is " + wages0Percent + "&#37; better than other regions.";
    employmentOutput += "The prospects in this area is " + prospects0Percent + "&#37; better than other regions on average.";

    employmentOutput  += "<br/>" + "<b>" + $scope.users[1].jobTitle +"</b><br/>You can earn on average <i>£" + $scope.results[r].wages1Value + " per week</i> in "+ $scope.results[0].regionName + ", this is " + wages1Percent + "&#37; better than other regions.";
    employmentOutput += "The prospects in this area is " + prospects1Percent + "&#37; better than other regions.";
    $scope.result_employment = $sce.trustAsHtml(employmentOutput);


    // costs
    var expenditurePercent =  (($scope.results[0].expenditureValue / $scope.averages.expenditure)*100).toFixed(0)-100;
    var costsMessage = "The average expenditure for this region is £" + $scope.results[0].expenditureValue.toFixed(0) + " per person a week. This is " + expenditurePercent + "&#37; above/below the national average.";
    $scope.result_costs = $sce.trustAsHtml(costsMessage);



    // population
    var education =  (($scope.results[0].educationValue / $scope.averages.education)*100).toFixed(0)-100;
    var age = (($scope.results[0].ageValue / $scope.averages.age)*100).toFixed(0)-100;
    var density = (($scope.results[0].densityValue / $scope.averages.density)*100).toFixed(0)-100;
    var populationMessage = "The average age for this region is <i>" + $scope.results[0].ageValue + " years old</i> and has a population density of <i>" + $scope.results[0].densityValue + " people per square kilometer</i>.";
    $scope.result_population = $sce.trustAsHtml(populationMessage);
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
    chart1.cssStyle = "height:300%; width:100%;";
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
        "colors" : ['#9E3F00','#0CCABA','#E3F5B7','#e6Ae00','#D46700','#BFBAB7'],
        "isStacked": "true",
        "legend" : "none",
        "horizontal": true,
        "fill": 20,
        "displayExactValues": false,
        "vAxis": {
            "title": "", "gridlines": {"count": 0}
        },
        "hAxis": {
            "title": "",
            "textStyle": {
              "color": "#3276b1",
              "fontName": "Roboto Slab"
            }
        }
    };

    chart1.formatters = {};

    $scope.chart = chart1;


}]);

projectTurkey.directive('scrollOnClick', function() {
  return {
    restrict: 'A',
    link: function(scope, $elm, attrs) {
      var idToScroll = attrs.href;
      $elm.on('click', function(e) {
        e.preventDefault();
        var $target;
        var i;

        // i = $(this).parent('.container').index() + 1;
        console.log(idToScroll)
        switch(idToScroll){
          case '#you':
            i = 1;
            break;
          case '#partner':
            i = 2;
            break;
          case '#tokens':
            i = 3;
            break;
          case '#results':
            i = 4;
            break;
          case '#life':
            i = 5;
            break;
        }

        console.log(i);

        if (i === 4) {
          var b = $('body').scrollTop();
          $("#welcome").animate({marginTop: (-$(window).height() * (i - 1)) - $('#tokens').outerHeight() + b}, "slow", function(){
            $('#welcome').css({marginTop: (-$(window).height() * (i - 1)) - $('#tokens').outerHeight()})
            $('body, html').scrollTop(0);
            $('.scrollr').css("height", "100%")

            setTimeout(function(){
              $('.loader').fadeOut("fast");
              setTimeout(function(){
                $('#results .btn').css({opacity: 1});
              },500)

            }, 3000)
          });
        }else if(i === 5){
          $("#welcome").animate({marginTop: (-$(window).height() * (i - 1)) - $('#tokens').outerHeight()}, "slow", function(){
            $('.scrollr').css({height: $('#life').height()})
          });
        }else if(i === 3){
          $("#welcome").animate({marginTop: -$(window).height() * i}, "slow", function(){
            $('.scrollr').css({height: $('#tokens').height()})
          });
        }else{
          $("#welcome").animate({marginTop: -$(window).height() * i}, "slow", function(){
          $('.scrollr').css({height: "100%"})

          });
        }


        // if (idToScroll) {
        //   $target = $(idToScroll);
        // } else {
        //   $target = $elm;
        // }

      });
    }
  }
});
