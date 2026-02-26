angular.module('bhima.controllers')
  .controller('ServicesController', ServicesController);

ServicesController.$inject = [
  'ServiceService', 'ModalService', 'NotifyService', 'uiGridConstants', '$state', '$timeout',
];

/**
 *
 * @param Services
 * @param ModalService
 * @param Notify
 * @param uiGridConstants
 * @param $state
 * @param $timeout
 */
function ServicesController(Services, ModalService, Notify, uiGridConstants, $state, $timeout) {
  const vm = this;

  // bind methods
  vm.deleteService = deleteService;
  vm.editService = editService;
  vm.createService = createService;
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};

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
        field : 'name',
        displayName : 'FORM.LABELS.SERVICE',
        headerCellFilter : 'translate',
      },
      {
        field : 'cost_center_name',
        displayName : 'TABLE.COLUMNS.COST_CENTER',
        headerCellFilter : 'translate',
      },
      {
        field : 'project_name',
        displayName : 'FORM.LABELS.PROJECT',
        headerCellFilter : 'translate',
      },
      {
        field : 'action',
        width : 80,
        displayName : '',
        cellTemplate : '/modules/services/templates/action.tmpl.html',
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
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /**
   *
   */
  function loadServices() {
    vm.loading = true;

    Services.read(null, { full : 1 })
      .then((data) => {
        vm.gridOptions.data = data;

        $timeout(() => {
          countServiceByProject();
        }, 0);
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // switch to delete warning mode
  /**
   *
   * @param service
   */
  function deleteService(service) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        if (!bool) { return; }

        Services.delete(service.uuid)
          .then(() => {
            Notify.success('SERVICE.DELETED');
            loadServices();
          })
          .catch(Notify.handleError);
      });
  }

  // update an existing service
  /**
   *
   * @param serviceObject
   */
  function editService(serviceObject) {
    $state.go('services.edit', { service : serviceObject });
  }

  // create a new service
  /**
   *
   */
  function createService() {
    $state.go('services.create');
  }

  // count services by project
  /**
   *
   */
  function countServiceByProject() {
    Services.count()
      .then(data => {
        let gridFooterTemplate = `<div class="ui-grid-footer-info ui-grid-grid-footer">`;
        let total = 0;

        data.forEach(row => {
          total += row.total;
          gridFooterTemplate += `<span><b>${row.project_abbr}</b>: ${row.total}</span> / `;
        });

        gridFooterTemplate += `
          <span><b>Total</b>: ${total}</span>
          </div>
        `;

        vm.gridOptions.showGridFooter = true;
        vm.gridOptions.gridFooterTemplate = gridFooterTemplate;
        vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.OPTIONS);
      })
      .catch(Notify.handleError);
  }
  loadServices();
}
