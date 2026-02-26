angular.module('bhima.controllers')
  .controller('CCAllocationBasisModalController', CCAllocationBasisModalController);

CCAllocationBasisModalController.$inject = [
  '$state', 'AllocationBasisService', 'AllocationBasisQuantityService',
  'NotifyService', 'parameters', 'appcache', '$translate',
];

/**
 *
 * @param $state
 * @param AllocationBasis
 * @param AllocationBasisQuantity
 * @param Notify
 * @param parameters
 * @param AppCache
 * @param $translate
 */
function CCAllocationBasisModalController(
  $state, AllocationBasis, AllocationBasisQuantity,
  Notify, parameters, AppCache, $translate,
) {
  const vm = this;

  const { params, fromState } = parameters;

  const cache = AppCache('CostCenterAllocationBasisModal');

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  vm.costCenterId = params.id;
  vm.costCenter = {};

  vm.isCreateState = vm.stateParams.isCreateState;
  vm.ccAllocation = {};

  vm.onSelectCostCenter = onSelectCostCenter;
  vm.submit = submit;

  vm.cancel = () => { $state.go(fromState || '^'); };

  /**
   *
   * @param cc
   */
  function onSelectCostCenter(cc) {
    vm.costCenter = cc;
    vm.costCenterId = cc.id;
    loadAllocationBasisQuantity();
  }

  /**
   *
   */
  function load() {
    loadAllocationBasis()
      .then(() => {
        if (!vm.isCreateState) { loadAllocationBasisQuantity(); }
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function loadAllocationBasis() {
    return AllocationBasis.read(null, { cost_center_id : vm.costCenterId })
      .then(result => {
        // Process the labels
        result.forEach(item => {
          item.label = $translate.instant(item.name);
          if (item.units) {
            item.label += ` (${$translate.instant(item.units)})`;
          }
        });
        vm.allocationBases = result || {};
      });
  }

  /**
   *
   */
  function loadAllocationBasisQuantity() {
    return AllocationBasisQuantity.bulkDetails(vm.costCenterId)
      .then(result => {
        vm.ccAllocation = result.reduce((current, item) => {
          current[item.allocation_basis_label] = item.quantity;
          return current;
        }, {});
      });
  }

  /**
   *
   */
  function getInsertData() {
    const baseMap = vm.allocationBases.reduce((current, item) => {
      current[item.name] = item.id;
      return current;
    }, {});

    const insert = Object.keys(vm.ccAllocation)
      .map((key) => ({
        cost_center_id : vm.costCenterId,
        basis_id : baseMap[key],
        quantity : vm.ccAllocation[key],
      }));

    return insert;
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return; }

    const data = getInsertData();
    const request = vm.isCreateState
      ? AllocationBasisQuantity.bulkInsert(data)
      : AllocationBasisQuantity.bulkUpdate(params.id, data);

    request
      .then(() => {
        Notify.success(vm.isCreateState ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS');
        $state.go(fromState, null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  load();
}
