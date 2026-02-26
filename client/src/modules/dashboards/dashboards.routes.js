angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('indicatorsFilesRegistry', {
        url         : '/dashboards/indicators_files_registry',
        controller  : 'IndicatorsFilesRegistryController as $ctrl',
        templateUrl : 'modules/dashboards/indicators_files_registry/indicators_files_registry.html',
      })

      .state('indicatorsFilesRegistry.addHospitalizationFile', {
        url : '/addHospitalizationFile',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', hospitalizationModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('indicatorsFilesRegistry.editHospitalizationFile', {
        url : '/editHospitalizationFile',
        params : {
          uuid : null,
        },
        onEnter : ['$uibModal', '$transition$', hospitalizationModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('indicatorsFilesRegistry.addStaffFile', {
        url : '/addStaffFile',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', staffModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('indicatorsFilesRegistry.editStaffFile', {
        url : '/editStaffFile',
        params : {
          uuid : null,
        },
        onEnter : ['$uibModal', '$transition$', staffModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('indicatorsFilesRegistry.addFinanceFile', {
        url : '/addFinanceFile',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', financeModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('indicatorsFilesRegistry.editFinanceFile', {
        url : '/editFinanceFile',
        params : {
          uuid : null,
        },
        onEnter : ['$uibModal', '$transition$', financeModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('hospitalizationDashboard', {
        url         : '/dashboards/hospitalization',
        controller  : 'HospitalizationDashboardController as $ctrl',
        templateUrl : 'modules/dashboards/hospitalization/hospitalization.html',
      })

      .state('staffDashboard', {
        url         : '/dashboards/staff',
        controller  : 'StaffDashboardController as $ctrl',
        templateUrl : 'modules/dashboards/staff/staff.html',
      })

      .state('financeDashboard', {
        url         : '/dashboards/finances',
        controller  : 'FinanceDashboardController as $ctrl',
        templateUrl : 'modules/dashboards/finance/finance.html',
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function hospitalizationModal($modal, $transition) {
  $modal.open({
    size : 'lg',
    templateUrl : 'modules/dashboards/indicators_files_registry/modals/hospitalization.modal.html',
    controller : 'HospitalizationModalController as $ctrl',
    resolve : { params : () => $transition.params('to') },
  }).result.catch(angular.noop);
}

/**
 *
 * @param $modal
 * @param $transition
 */
function staffModal($modal, $transition) {
  $modal.open({
    size : 'lg',
    templateUrl : 'modules/dashboards/indicators_files_registry/modals/staff.modal.html',
    controller : 'StaffModalController as $ctrl',
    resolve : { params : () => $transition.params('to') },
  }).result.catch(angular.noop);
}

/**
 *
 * @param $modal
 * @param $transition
 */
function financeModal($modal, $transition) {
  $modal.open({
    size : 'lg',
    templateUrl : 'modules/dashboards/indicators_files_registry/modals/finance.modal.html',
    controller : 'FinanceModalController as $ctrl',
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
