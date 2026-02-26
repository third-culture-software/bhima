angular.module('bhima.controllers')
  .controller('CountryController', CountryController);

CountryController.$inject = [
  '$state', 'LocationService', 'util', 'NotifyService',
  '$uibModal', 'ModalService', 'uiGridConstants',
];

/**
 *
 * @param $state
 * @param locationService
 * @param util
 * @param Notify
 * @param $uibModal
 * @param Modal
 * @param uiGridConstants
 */
function CountryController($state, locationService, util, Notify, $uibModal, Modal, uiGridConstants) {
  const vm = this;
  vm.session = {};
  vm.view = 'default';

  // bind methods
  vm.countryLength = util.length45;

  // fired on startup
  /**
   *
   */
  function startup() {
    // start up loading indicator
    vm.session.loading = true;
    // load Country
    refreshCountries();
  }

  vm.messages = {
    country : locationService.messages.country,
  };

  // refresh the displayed Countrys
  /**
   *
   */
  function refreshCountries() {
    return locationService.countries({ detailed : 1 }).then((countries) => {
      vm.gridOptions.data = countries;
      vm.session.loading = false;
      // make sure that we are showing the proper message to the client
      vm.messages.country = (countries.length > 0)
        ? locationService.messages.country
        : locationService.messages.empty;
    }).catch(angular.noop);
  }

  vm.createUpdateModal = (selectedCountry = {}) => {
    return $uibModal.open({
      templateUrl : 'modules/locations/country/modal/createUpdate.html',
      controller : 'CreateUpdateCountryController as ModalCtrl',
      resolve : { data : () => selectedCountry },
    }).result.then(result => {
      if (result) refreshCountries();
    });
  };

  const columns = [{
    field : 'name',
    displayName : 'TABLE.COLUMNS.COUNTRY',
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
        locationService.delete.country(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            refreshCountries();
          })
          .catch(Notify.handleError);
      });
  };

  vm.createUpdateModal = (selectedCountry = {}) => {
    return $uibModal.open({
      templateUrl : 'modules/locations/country/modal/createUpdate.html',
      controller : 'CreateUpdateCountryController as ModalCtrl',
      resolve : { data : () => selectedCountry },
    }).result.then(result => {
      if (result) refreshCountries();
    });
  };

  vm.mergeCountries = function mergeCountries() {
    const selectedCountries = vm.gridApi.selection.getSelectedRows();
    if (selectedCountries.length) {
      if (selectedCountries.length === 2) {
        const countries = selectedCountries.map(c => c);
        const locations = {
          locations : countries,
          status : 'country',
        };

        $uibModal.open({
          templateUrl : 'modules/locations/modals/mergeLocations.modal.html',
          controller : 'MergeLocationsModalController as MergeLocationsModalCtrl',
          resolve : { data : () => locations },
        }).result.then(result => {
          if (result) refreshCountries();
        });

      } else {
        Notify.warn('FORM.WARNINGS.ONLY_TWO_COUNTRIES');
      }
    } else {
      Notify.warn('FORM.WARNINGS.NO_COUNTRIES_HAS_SELECTED');
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
