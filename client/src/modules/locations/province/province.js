angular.module('bhima.controllers')
  .controller('ProvinceController', ProvinceController);

ProvinceController.$inject = [
  '$state', 'LocationService', 'util', 'NotifyService',
  'ModalService', '$uibModal', 'uiGridConstants',
];

/**
 *
 * @param $state
 * @param locationService
 * @param util
 * @param Notify
 * @param Modal
 * @param $uibModal
 * @param uiGridConstants
 */
function ProvinceController($state, locationService, util, Notify,
  Modal, $uibModal, uiGridConstants) {

  const vm = this;
  vm.session = {};

  vm.maxLength = util.maxTextLength;

  // fired on startup
  /**
   *
   */
  function startup() {
    // start up loading indicator
    vm.session.loading = true;
    // load Provinces
    refreshProvinces();
  }

  vm.messages = {
    country : locationService.messages.country,
  };

  // refresh the displayed Provinces
  /**
   *
   */
  function refreshProvinces() {
    return locationService.provinces({ detailed : 1 }).then((data) => {
      vm.gridOptions.data = data;
      vm.session.loading = false;
    });
  }

  vm.createUpdateModal = (selectedProvince = {}) => {
    return $uibModal.open({
      templateUrl : 'modules/locations/province/modal/createUpdate.html',
      controller : 'CreateUpdateProvinceController as ModalCtrl',
      resolve : { data : () => selectedProvince },
    }).result.then(result => {
      if (result) refreshProvinces();
    });
  };

  const columns = [{
    field : 'country_name',
    displayName : 'TABLE.COLUMNS.COUNTRY',
    headerCellFilter : 'translate',
  }, {
    field : 'name',
    displayName : 'TABLE.COLUMNS.PROVINCE',
    headerCellFilter : 'translate',
  }, {
    field : 'actions',
    enableFiltering : false,
    width : 100,
    displayName : '',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/locations/country/templates/action.cell.html',
  }];

  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    columnDefs : columns,
    enableSorting : true,
    fastWatch : true,
    flatEntityAccess : true,
    onRegisterApi : (gridApi) => {
      vm.gridApi = gridApi;
    },
  };

  vm.remove = function remove(uuid) {
    const message = 'FORM.DIALOGS.CONFIRM_DELETE';
    Modal.confirm(message)
      .then(confirmResponse => {
        if (!confirmResponse) {
          return;
        }
        locationService.delete.province(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            refreshProvinces();
          })
          .catch(Notify.handleError);
      });
  };

  vm.mergeProvinces = function mergeProvinces() {
    const selectedProvinces = vm.gridApi.selection.getSelectedRows();
    if (selectedProvinces.length) {
      if (selectedProvinces.length === 2) {
        const provinces = selectedProvinces.map(p => p);

        const locations = {
          locations : provinces,
          status : 'province',
        };

        $uibModal.open({
          templateUrl : 'modules/locations/modals/mergeLocations.modal.html',
          controller : 'MergeLocationsModalController as MergeLocationsModalCtrl',
          resolve : { data : () => locations },
        }).result.then(result => {
          if (result) refreshProvinces();
        });

      } else {
        Notify.warn('FORM.WARNINGS.ONLY_TWO_PROVINCES');
      }
    } else {
      Notify.warn('FORM.WARNINGS.NO_PROVINCES_HAS_SELECTED');
    }
  };

  /**
   * @function toggleInlineFilter
   * @description
   * Switches the inline filter on and off.
   */
  vm.toggleInlineFilter = function toggleInlineFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };
  startup();
}
