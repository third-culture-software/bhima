angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('shipments', {
        url : '/shipments',
        templateUrl : 'modules/shipment/shipment.html',
        controller : 'ShipmentRegistryController as ShipmentCtrl',
      })

      .state('shipments-create', {
        url : '/shipments/create',
        params : {
          isCreateState : { value : true },
        },
        templateUrl : 'modules/shipment/create-shipment.html',
        controller : 'CreateShipmentController as CreateShipCtrl',
        onEnter : ['$transition$', gotoPage],
      })

      .state('shipments-edit', {
        url : '/shipments/:uuid/edit',
        params : {
          uuid : { value : null, squash : true },
          isCreateState : { value : false },
        },
        templateUrl : 'modules/shipment/create-shipment.html',
        controller : 'CreateShipmentController as CreateShipCtrl',
        onEnter : ['$transition$', gotoPage],
      });
  }]);

/**
 *
 * @param $transition
 */
function gotoPage($transition) {
  $transition.params('to');
}
