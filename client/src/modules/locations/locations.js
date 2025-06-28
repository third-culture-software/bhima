angular.module('bhima.controllers')
  .controller('LocationController', LocationController);

LocationController.$inject = ['LocationService', 'NotifyService'];

function LocationController(Locations, Notify) {
  const vm = this;
  vm.session = {};

  vm.session.loading = false;
  vm.view = 'default';

  // fired on startup
  function startup() {
    // start up loading indicator
    vm.session.loading = true;

    // load location
    Locations.locations().then((data) => {
      vm.gridOptions.data = data;
      vm.session.loading = false;
    }).catch(Notify.handleError);

  }

  const columns = [{
    field : 'village',
    displayName : 'TABLE.COLUMNS.VILLAGE',
    headerCellFilter : 'translate',
  }, {
    field : 'sector',
    displayName : 'TABLE.COLUMNS.SECTOR',
    headerCellFilter : 'translate',
  }, {
    field : 'province',
    displayName : 'TABLE.COLUMNS.PROVINCE',
    headerCellFilter : 'translate',
  }, {
    field : 'country',
    displayName : 'TABLE.COLUMNS.COUNTRY',
    headerCellFilter : 'translate',
  }];

  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    columnDefs : columns,
    enableSorting : true,
    fastWatch : true,
    flatEntityAccess : true,
    onRegisterApi : (gridApi) => { vm.gridApi = gridApi; },
  };

  startup();
}
