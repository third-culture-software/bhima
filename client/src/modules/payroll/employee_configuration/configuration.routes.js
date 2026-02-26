angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('configurationEmployee', {
        url         : '/payroll/employee_configuration',
        controller  : 'ConfigurationEmployeeController as ConfigurationEmployeeCtrl',
        templateUrl : 'modules/payroll/employee_configuration/configuration.html',
      })

      .state('configurationEmployee.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', configurationEmployeeModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('configurationEmployee.edit', {
        url : '/:id/edit',
        params : {
          isCreateState : { value : false },
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', configurationEmployeeModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function configurationEmployeeModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/payroll/employee_configuration/modals/employee.modal.html',
    controller : 'EmployeeModalController as EmployeeModalCtrl',
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
