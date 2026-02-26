angular.module('bhima.controllers')
  .controller('SectorController', SectorController);

SectorController.$inject = [
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
function SectorController($state, locationService, util, Notify,
  Modal, $uibModal, uiGridConstants) {

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
    refreshSectors();
  }

  vm.messages = {
    country : locationService.messages.country,
  };

  // refresh the displayed sectors
  /**
   *
   */
  function refreshSectors() {
    return locationService.sectors({ detailed : 1 }).then((data) => {
      vm.gridOptions.data = data;
      vm.session.loading = false;
    });
  }

  vm.createUpdateModal = (selectedSector = {}) => {
    return $uibModal.open({
      templateUrl : 'modules/locations/sector/modal/createUpdate.html',
      controller : 'CreateUpdateSectorController as ModalCtrl',
      resolve : { data : () => selectedSector },
    }).result.then(result => {
      if (result) refreshSectors();
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
    field : 'name',
    displayName : 'TABLE.COLUMNS.SECTOR',
    headerCellFilter : 'translate',
  }, {
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
        locationService.delete.sector(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            refreshSectors();
          })
          .catch(Notify.handleError);
      });
  };

  vm.mergeSectors = function mergeSectors() {
    const selectedSectors = vm.gridApi.selection.getSelectedRows();
    if (selectedSectors.length) {
      if (selectedSectors.length === 2) {
        const sectors = selectedSectors.map(s => s);

        const locations = {
          locations : sectors,
          status : 'sector',
        };

        $uibModal.open({
          templateUrl : 'modules/locations/modals/mergeLocations.modal.html',
          controller : 'MergeLocationsModalController as MergeLocationsModalCtrl',
          resolve : { data : () => locations },
        }).result.then(result => {
          if (result) refreshSectors();
        });

      } else {
        Notify.warn('FORM.WARNINGS.ONLY_TWO_SECTORS');
      }
    } else {
      Notify.warn('FORM.WARNINGS.NO_SECTORS_HAS_SELECTED');
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
