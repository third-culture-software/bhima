angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('holidays', {
        url         : '/holidays',
        controller  : 'HolidayManagementController as HolidayCtrl',
        templateUrl : 'modules/holidays/holidays.html',
      })

      .state('holidays.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', holidayModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('holidays.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', holidayModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function holidayModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/holidays/modals/holiday.modal.html',
    controller : 'HolidayModalController as HolidayModalCtrl',
    resolve : { params : () => $transition.params('to') },
  }).result.catch(angular.noop);
}

/**
 *
 * @param ModalStack
 */
function closeModal(ModalStack) {
  ModalStack.dismissAll();
}
