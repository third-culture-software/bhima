angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('funding_sources', {
        url         : '/funding_sources',
        controller  : 'FundingSourcesController as FundingSourcesCtrl',
        templateUrl : 'modules/fundingSources/fundingSources.html',
      });
  }]);
