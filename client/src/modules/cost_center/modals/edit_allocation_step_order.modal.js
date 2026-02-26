angular.module('bhima.controllers')
  .controller('AllocationEditStepOrderController', AllocationEditStepOrderController);

AllocationEditStepOrderController.$inject = [
  'CostCenterService', 'NotifyService', '$uibModalInstance', 'uiGridConstants',
];

/**
 *
 * @param CostCenters
 * @param Notify
 * @param Instance
 * @param uiGridConstants
 */
function AllocationEditStepOrderController(CostCenters, Notify, Instance, uiGridConstants) {

  const vm = this;

  vm.loading = false;
  vm.cancel = Instance.close;
  vm.loadCostCenters = loadCostCenters;
  vm.moveStepDown = moveStepDown;
  vm.moveStepUp = moveStepUp;
  vm.submit = submit;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    flatEntityAccess : true,
    enableRowReordering : true,
    enableSorting : false,
    onRegisterApi : onRegisterApiFn,
    columnDefs : [
      {
        field : 'label',
        displayName : 'FORM.LABELS.DESIGNATION',
        headerCellFilter : 'translate',
        enableSorting : false,
      },
      {
        field : 'step_order',
        displayName : 'COST_CENTER.STEP_ORDER',
        headerCellFilter : 'translate',
        headerCellClass : 'wrappingColHeader',
        defaultSort : { direction : uiGridConstants.ASC, priority : 1 },
        type : 'number',
        visible : true,
      },
      {
        field : 'reorder',
        displayName : '',
        cellTemplate : '/modules/cost_center/templates/reorder_allocation_steps.tmpl.html',
        enableSorting : false,
        enableFiltering : false,
      },
    ],
  };

  /**
   *
   */
  function loadCostCenters() {
    vm.loading = true;
    CostCenters.read()
      .then((data) => {
        const auxData = data.filter(item => !item.is_principal);
        auxData.sort((a, b) => Number(a.step_order) - Number(b.step_order));

        // rewrite the step order
        auxData.forEach((value, idx) => {
          value.step_order = idx + 1;
        });

        vm.data = auxData;
        vm.gridOptions.data = vm.data;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  /**
   *
   * @param gridApi
   */
  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  /**
   *
   * @param row
   */
  function moveStepDown(row) {
    const stepOrder = row.step_order;
    const upper = vm.data.find(r => r.step_order === stepOrder + 1);
    row.step_order++;
    upper.step_order--;
    vm.gridOptions.data = vm.data;
    vm.gridApi.core.refreshRows();
  }

  /**
   *
   * @param row
   */
  function moveStepUp(row) {
    const stepOrder = row.step_order;
    const lower = vm.data.find(r => r.step_order === stepOrder - 1);
    row.step_order--;
    lower.step_order++;
    vm.gridOptions.data = vm.data;
    vm.gridApi.core.refreshRows();
  }

  /**
   *
   */
  function submit() {
    vm.loading = true;
    const newStepOrder = vm.gridOptions.data.map(row => ({
      id : row.id,
      step_order : row.step_order,
    }));
    CostCenters.setAllocationStepOrder({ new_order : newStepOrder })
      .then(() => {
        vm.loading = false;
        Instance.close();
        Notify.success('FORM.INFO.UPDATE_SUCCESS');
      });
  }

  loadCostCenters();
}
