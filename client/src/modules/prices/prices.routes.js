angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('prices', {
        url         : '/prices',
        controller  : 'PriceListController as PriceListCtrl',
        templateUrl : 'modules/prices/prices.html',
      });
  }]);
