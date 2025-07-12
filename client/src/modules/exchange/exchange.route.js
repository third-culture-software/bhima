angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('exchange', {
        url : '/exchange',
        templateUrl : 'modules/exchange/exchange.html',
        controller : 'ExchangeController as ExchangeCtrl',
        data : { allowAuthPassthrough : true },
      });
  }]);
