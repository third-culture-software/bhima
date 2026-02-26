angular.module('bhima.controllers')
  .controller('SubsidyController', SubsidyController);

SubsidyController.$inject = [
  'SubsidyService', 'ModalService', 'NotifyService',
  'uiGridConstants', '$state',
];

/**
 *
 * @param Subsidy
 * @param ModalService
 * @param Notify
 * @param uiGridConstants
 * @param $state
 */
function SubsidyController(Subsidy, ModalService, Notify, uiGridConstants, $state) {
  const vm = this;

  // bind methods
  vm.create = create;
  vm.update = update;
  vm.remove = remove;
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : [
      {
        field : 'label',
        displayName : 'TABLE.COLUMNS.LABEL',
        headerCellFilter : 'translate',
      },
      {
        field : 'value',
        displayName : 'TABLE.COLUMNS.VALUE',
        headerCellFilter : 'translate',
        type : 'number',
      },
      {
        field : 'number',
        displayName : 'TABLE.COLUMNS.ACCOUNT',
        headerCellFilter : 'translate',
      },
      {
        field : 'action',
        width : 80,
        displayName : '',
        cellTemplate : '/modules/subsidies/templates/action.tmpl.html',
        enableSorting : false,
        enableFiltering : false,
      },
    ],
  };

  /**
   *
   * @param gridApi
   */
  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  /**
   *
   */
  function toggleFilter() {
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /**
   *
   */
  function create() {
    $state.go('subsidies.create');
  }

  /**
   *
   * @param id
   */
  function update(id) {
    $state.go('subsidies.edit', { id });
  }

  // refresh the displayed Subsidies
  /**
   *
   */
  function refreshSubsidies() {
    return Subsidy.read(null, { detailed : 1 })
      .then(data => {
        vm.gridOptions.data = data;
      });
  }

  // switch to delete warning mode
  /**
   *
   * @param id
   */
  function remove(id) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        // if the user clicked cancel, reset the view and return
        if (!bool) { return; }

        Subsidy.delete(id)
          .then(() => {
            refreshSubsidies();
            Notify.success('SUBSIDY.DELETED');
          })
          .catch(Notify.handleError);
      });
  }

  refreshSubsidies();
}
