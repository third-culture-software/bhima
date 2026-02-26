angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('display_metadata', {
        url         : '/display_metadata',
        controller  : 'DisplayMetadataController as DisplayMetadataCtrl',
        templateUrl : 'modules/display_metadata/display_metadata.html',
      })

      .state('display_metadata.patient', {
        url         : '/:id/:patient/patient',
        controller  : 'DisplayMetadataController as DisplayMetadataCtrl',
        templateUrl : 'modules/display_metadata/display_metadata.html',
      })

      .state('display_metadata.patientfill', {
        url : '/:id/:patient/fill',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', fillFormModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('display_metadata.patientEdit', {
        url : '/:id/:uuid/:patient/:include/edit',
        params : {
          id : { value : null },
          uuid : { value : null },
          patient : { value : null },
          include : { value : null },
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', fillFormModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('display_metadata.edit', {
        url : '/:id/:uuid/edit',
        params : {
          uuid : { value : null },
          isCreateState : { value : false },
        },
        onEnter : ['$uibModal', '$transition$', fillFormModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function fillFormModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/fill_form/modals/fill_form.modals.html',
    controller : 'FillFormModalController as FillFormModalCtrl',
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
