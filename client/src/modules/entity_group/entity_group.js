angular.module('bhima.controllers')
  .controller('EntityGroupController', EntityGroupController);

EntityGroupController.$inject = [
  'EntityGroupService', 'ModalService', 'NotifyService', 'uiGridConstants',
  '$state',
];

/**
 * EntityGroup Controller
 *
 * This controller is responsible of handling entity group
 * @param EntityGroup
 * @param ModalService
 * @param Notify
 * @param uiGridConstants
 * @param $state
 */
function EntityGroupController(
  EntityGroup, ModalService, Notify, uiGridConstants, $state,
) {
  const vm = this;

  // bind methods
  vm.deleteEntityGroup = deleteEntityGroup;
  vm.editEntityGroup = editEntityGroup;
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityGroupAccess  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : [
      {
        field : 'label',
        displayName : 'ENTITY.GROUP.GROUP',
        headerCellFilter : 'translate',
      },
      {
        field : 'entities',
        displayName : 'ENTITY.LABEL',
        headerCellFilter : 'translate',
      },
      {
        field : 'action',
        width : 80,
        displayName : '',
        cellTemplate : '/modules/entity_group/templates/action.tmpl.html',
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
  function loadEntities() {
    vm.loading = true;

    EntityGroup.read()
      .then(data => {
        vm.gridOptions.data = data;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // switch to delete warning mode
  /**
   *
   * @param uuid
   */
  function deleteEntityGroup(uuid) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
        if (!bool) { return; }

        EntityGroup.delete(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadEntities();
          })
          .catch(Notify.handleError);
      });
  }

  // update an existing entity
  /**
   *
   * @param uuid
   */
  function editEntityGroup(uuid) {
    $state.go('entityGroup.edit', { uuid });
  }

  loadEntities();
}
