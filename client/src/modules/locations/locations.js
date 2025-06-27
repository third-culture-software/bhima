// TODO Handle HTTP exception errors (displayed contextually on form)
angular.module('bhima.controllers')
  .controller('LocationController', LocationController);

LocationController.$inject = [
  'LocationService',
];

function LocationController(locationService) {
  const vm = this;
  const session = vm.session = {};

  session.loading = false;
  vm.view = 'default';

  function handler(error) {
    console.error(error);
  }

  // fired on startup
  function startup() {
    // start up loading indicator
    session.loading = true;

    // load location
    locationService.locations().then((data) => {
      vm.gridOptions.data = data;
      session.loading = false;
    }).catch(handler);

  }

  const columns = [{
    field : 'village',
    displayName : 'TABLE.COLUMNS.VILLAGE',
    headerCellFilter : 'translate',
  },
  {
    field : 'sector',
    displayName : 'TABLE.COLUMNS.SECTOR',
    headerCellFilter : 'translate',
  },
  {
    field : 'province',
    displayName : 'TABLE.COLUMNS.PROVINCE',
    headerCellFilter : 'translate',
  },
  {
    field : 'country',
    displayName : 'TABLE.COLUMNS.COUNTRY',
    headerCellFilter : 'translate',
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

  startup();
}
