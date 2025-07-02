angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('creditorGroups', {
        url         : '/creditors/groups',
        controller  : 'CreditorGroupController as CreditorGroupCtrl',
        templateUrl : 'modules/creditors/groups/creditor-groups.html',
        params      : {
          label : null,
        },
      })

      .state('creditorGroups.create', {
        url         : '/create',
        controller  : 'CreditorGroupController as CreditorGroupCtrl',
        templateUrl : 'modules/creditors/groups/creditor-groups-manage.html',
      })

      .state('creditorGroups.list', {
        url         : '/',
        controller  : 'CreditorGroupController as CreditorGroupCtrl',
        templateUrl : 'modules/creditors/groups/creditor-groups-list.html',
      })

      .state('creditorGroups.update', {
        url         : '/:uuid/update',
        controller  : 'CreditorGroupController as CreditorGroupCtrl',
        templateUrl : 'modules/creditors/groups/creditor-groups-manage.html',
      });
  }]);
