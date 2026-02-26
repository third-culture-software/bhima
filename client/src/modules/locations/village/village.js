angular.module('bhima.controllers')
  .controller('VillageController', VillageController);

VillageController.$inject = [
  '$state', 'LocationService', 'util', 'NotifyService',
  'ModalService', '$uibModal', 'uiGridConstants', 'LocationService',
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
 * @param Location
 */
function VillageController($state, locationService, util, Notify,
  Modal, $uibModal, uiGridConstants, Location) {

  const vm = this;
  vm.session = {};
  vm.state = {};

  vm.maxLength = util.maxTextLength;

  // fired on startup
  /**
   *
   */
  function startup() {
    // start up loading indicator
    vm.session.loading = true;
    // load Provinces
    refreshVillages();
  }

  vm.messages = {
    country : locationService.messages.country,
  };

  // refresh the displayed Provinces
  /**
   *
   */
  function refreshVillages() {
    return locationService.villages({ detailed : 1 }).then((villages) => {
      vm.gridOptions.data = villages;
      vm.session.loading = false;
    });
  }

  vm.createUpdateModal = (selectedProvince = {}) => {
    return $uibModal.open({
      templateUrl : 'modules/locations/village/modal/createUpdate.html',
      controller : 'CreateUpdateVillageController as ModalCtrl',
      resolve : { data : () => selectedProvince },
    }).result.then(result => {
      if (result) refreshVillages();
    });
  };

  const columns = [{
    field : 'country_name',
    displayName : 'TABLE.COLUMNS.COUNTRY',
    headerCellFilter : 'translate',
  }, {
    field : 'province_name',
    displayName : 'TABLE.COLUMNS.PROVINCE',
    headerCellFilter : 'translate',
  },
  {
    field : 'sector_name',
    displayName : 'TABLE.COLUMNS.SECTOR',
    headerCellFilter : 'translate',
  },
  {
    field : 'name',
    displayName : 'TABLE.COLUMNS.VILLAGE',
    headerCellFilter : 'translate',
  },
  {
    field : 'longitude',
    displayName : 'FORM.LABELS.LONGITUDE',
    headerCellFilter : 'translate',
    type : 'number',
  },
  {
    field : 'latitude',
    displayName : 'FORM.LABELS.LATITUDE',
    headerCellFilter : 'translate',
    type : 'number',
  },
  {
    field : 'actions',
    enableFiltering : false,
    width : 100,
    displayName : '',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/locations/country/templates/action.cell.html',
  }];

  // ng-click="
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
        Location.delete.village(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            refreshVillages();
          })
          .catch(Notify.handleError);
      });
  };

  vm.mergeVillages = function Villages() {
    const selectedVillages = vm.gridApi.selection.getSelectedRows();
    if (selectedVillages.length) {
      if (selectedVillages.length === 2) {
        const villages = selectedVillages.map(v => v);

        const locations = {
          locations : villages,
          status : 'village',
        };

        $uibModal.open({
          templateUrl : 'modules/locations/modals/mergeLocations.modal.html',
          controller : 'MergeLocationsModalController as MergeLocationsModalCtrl',
          resolve : { data : () => locations },
        }).result.then(result => {
          if (result) refreshVillages();
        });

      } else {
        Notify.warn('FORM.WARNINGS.ONLY_TWO_VILLAGES');
      }
    } else {
      Notify.warn('FORM.WARNINGS.NO_VILLAGES_HAS_SELECTED');
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
