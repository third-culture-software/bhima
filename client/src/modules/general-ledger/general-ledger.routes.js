angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('generalLedger', {
        url         : '/general_ledger',
        controller  : 'GeneralLedgerController as GeneralLedgerCtrl',
        templateUrl : 'modules/general-ledger/general-ledger.html',
      });
  }]);
