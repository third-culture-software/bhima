angular.module('bhima.routes')
  .config(['$stateProvider', function purchaseRoutes($stateProvider) {
    $stateProvider
      // purchases/create
      .state('purchasesCreate', {
        url         : '/purchases/create',
        controller  : 'PurchaseOrderController as PurchaseCtrl',
        templateUrl : 'modules/purchases/create/createUpdate.html',
      })

      // purchases/:uuid/update
      .state('purchasesUpdate', {
        url         : '/purchases/:uuid/update',
        params      : { uuid : { squash : true, value : null } },
        controller  : 'PurchaseOrderController as PurchaseCtrl',
        templateUrl : 'modules/purchases/create/createUpdate.html',
      })

      // purchases
      .state('purchasesRegistry', {
        url         : '/purchases',
        controller  : 'PurchaseRegistryController as PurchaseRegistryCtrl',
        templateUrl : 'modules/purchases/registry/registry.html',
        params      : { 
          filters : [],
          purchase : { value : null },
        },
      })

      // purchases detailed
      .state('purchasesDetailed', {
        url         : '/purchases/detailed',
        controller  : 'PurchaseDetailedController as PurchaseDetailedCtrl',
        templateUrl : 'modules/purchases/detailed/registry.html',
        params      : { filters : [] },
      });
  }]);
