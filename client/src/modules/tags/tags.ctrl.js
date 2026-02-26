angular.module('bhima.controllers')
  .controller('TagsController', TagsController);

TagsController.$inject = [
  'TagService', 'ModalService',
  'NotifyService', 'uiGridConstants', '$rootScope',
];

/**
 *
 * @param Tags
 * @param Modal
 * @param Notify
 * @param uiGridConstants
 * @param $rootScope
 */
function TagsController(Tags, Modal, Notify, uiGridConstants, $rootScope) {
  const vm = this;

  vm.canEditTags = false;

  vm.createUpdateTagsModal = Tags.createUpdateTagsModal;

  vm.remove = function remove(uuid) {
    const message = 'FORM.DIALOGS.CONFIRM_ACTION';
    Modal.confirm(message)
      .then(confirmResponse => {
        if (!confirmResponse) {
          return;
        }
        Tags.delete(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadTags();
          })
          .catch(Notify.handleError);
      });
  };

  /**
   *
   */
  function loadTags() {
    vm.loading = true;
    vm.errorState = false;
    Tags.read()
      .then(tags => {
        vm.gridOptions.data = tags.map(t => {
          t.style = { color : t.color };
          return t;
        });
      })
      .catch(err => {
        vm.errorState = true;
        Notify.handleError(err);
      })
      .finally(() => {
        vm.loading = false;
      });
  }

  $rootScope.$on('TAGS_CHANGED', loadTags);

  const columns = [{
    field : 'name',
    displayName : 'FORM.LABELS.NAME',
    headerCellFilter : 'translate',
    cellTemplate : '/modules/tags/templates/name.cell.html',
  }, {
    field : 'actions',
    enableFiltering : false,
    width : 100,
    displayName : '',
    headerCellFilter : 'translate',
    cellTemplate : '/modules/tags/templates/action.cell.html',
  }];

  // ng-click="
  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    columnDefs : columns,
    enableSorting : true,
    data : [],
    fastWatch : true,
    flatEntityAccess : true,
    onRegisterApi : (gridApi) => {
      vm.gridApi = gridApi;
    },
  };

  loadTags();
  /**
   * @function toggleInlineFilter
   * @description
   * Switches the inline filter on and off.
   */
  vm.toggleInlineFilter = function toggleInlineFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };
}
