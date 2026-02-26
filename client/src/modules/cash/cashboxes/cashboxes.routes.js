angular.module('bhima.routes')
  .config(['$stateProvider', configureCashBoxRoutes]);

/**
 *
 * @param $stateProvider
 */
function configureCashBoxRoutes($stateProvider) {
  $stateProvider
    .state('cashboxes', {
      abstract    : true,
      url         : '/cashboxes',
      controller  : 'CashboxController as CashCtrl',
      templateUrl : 'modules/cash/cashboxes/cashboxes.html',
      params      : {
        label : null,
      },
    })
    .state('cashboxes.list', {
      url         : '',
      templateUrl : 'modules/cash/cashboxes/cashboxes.list.html',
    })
    .state('cashboxes.create', {
      url         : '/create',
      templateUrl : 'modules/cash/cashboxes/update/add.html',
      controller  : 'CashboxUpdateController as UpdateCtrl',
    })
    .state('cashboxes.edit', {
      url    : '/:uuid/edit',
      params : {
        id : { squash : true, value : null },
      },
      templateUrl : 'modules/cash/cashboxes/update/edit.html',
      controller  : 'CashboxUpdateController as UpdateCtrl',
    });
}
