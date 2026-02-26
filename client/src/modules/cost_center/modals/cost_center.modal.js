angular.module('bhima.controllers')
  .controller('CostCenterModalController', CostCenterModalController);

CostCenterModalController.$inject = [
  '$state', 'CostCenterService', 'AllocationBasisService', 'NotifyService',
  'appcache', 'bhConstants', 'params', '$translate',
];

/**
 *
 * @param $state
 * @param CostCenter
 * @param AllocationBasisService
 * @param Notify
 * @param AppCache
 * @param bhConstants
 * @param params
 * @param $translate
 */
function CostCenterModalController($state, CostCenter, AllocationBasisService, Notify,
  AppCache, bhConstants, params, $translate) {
  const vm = this;
  vm.costCenter = {};
  vm.referenceCostCenter = [];
  vm.allocationMethodOptions = bhConstants.stepDownAllocation.METHOD_OPTIONS;

  const cache = AppCache('CostCenterModal');

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  vm.isCreateState = vm.stateParams.isCreateState;

  // exposed methods
  vm.submit = submit;
  vm.auxiliaryFee = auxiliaryFee;
  vm.setCostCenterMeta = setCostCenterMeta;
  vm.onSelectAccountReference = onSelectAccountReference;
  vm.onSelectProject = onSelectProject;

  vm.onServicesChange = onServicesChange;
  vm.clear = clear;
  vm.reset = reset;
  vm.translate = translateAllocationBasisOption;

  if (vm.isCreateState) {
    // Use first allocation method as default
    [vm.costCenter.allocation_method] = vm.allocationMethodOptions;
  } else {
    CostCenter.read(vm.stateParams.id)
      .then((data) => {
        const costCenterInfoExists = !!(data.costCenter && data.costCenter.length >= 0 && data.costCenter[0]);
        vm.costCenter = costCenterInfoExists ? data.costCenter[0] : {};
        if (data.services) {
          vm.relatedServices = data.services.length ? 1 : 0;
          vm.assignedProject = data.costCenter && data.costCenter[0] && data.costCenter[0].project_id ? 1 : 0;
          vm.services = data.services;
        }
        processReference(data.references);
        vm.setting = true;
      })
      .catch(Notify.handleError);
  }

  AllocationBasisService.getAllocationBases()
    .then((bases) => {
      // Translate the basis terms
      vm.allocationBases = bases.map(base => {
        if (base.is_predefined) {
          base.name = $translate.instant(base.name);
          base.description = $translate.instant(base.description);
          base.units = base.units ? $translate.instant(base.units) : '';
        }
        return base;
      });
    })
    .catch(Notify.handleError);

  /**
   *
   * @param references
   */
  function processReference(references) {
    if (references) {
      references.forEach((reference) => {
        const costCenterReferenceBundle = {
          account_reference_id : reference.account_reference_id,
          is_cost : reference.is_cost,
          is_variable : reference.is_variable,
          is_turnover : reference.is_turnover,
        };

        if (reference.is_cost) {
          if (vm.costCenter.is_principal) {
            vm.hasCostCenter = 1;
          } else {
            vm.isCostCenter = 1;
            vm.auxiliaryCenter = 1;
          }
          vm.costCenter.is_cost = reference.is_cost;

          if (reference.is_variable) {
            vm.costCenter.reference_cost_variable_id = reference.account_reference_id;
            vm.variableCostCenterReference = costCenterReferenceBundle;
          } else {
            vm.costCenter.reference_cost_fixed_id = reference.account_reference_id;
            vm.fixCostCenterReference = costCenterReferenceBundle;
          }
        }

        if (!reference.is_cost) {
          if (vm.costCenter.is_principal) {
            vm.hasProfitCenter = 1;
          } else {
            vm.isProfitCenter = 1;
            vm.auxiliaryCenter = 1;
          }

          if (reference.is_turnover) {
            vm.costCenter.reference_profit_turnover_id = reference.account_reference_id;
            vm.turnoverProfitCenterReference = costCenterReferenceBundle;
          } else {
            vm.costCenter.reference_other_profit_id = reference.account_reference_id;
            vm.otherProfitCenterReference = costCenterReferenceBundle;
          }
        }
      });
    }
  }

  /**
   *
   * @param value
   * @param index
   */
  function clear(value, index) {
    vm[value] = null;
    vm.costCenter[index] = null;

    delete vm[value];
    delete vm.costCenter[index];
  }

  /**
   *
   * @param value
   */
  function reset(value) {
    vm.costCenter[value] = null;
  }

  /**
   *
   * @param value
   */
  function auxiliaryFee(value) {
    vm.auxiliaryCenter = value ? 1 : 0;
    if (value) {
      vm.hasProfitCenter = !value;
      vm.hasCostCenter = !value;
      vm.isCostCenter = 0;
      vm.isProfitCenter = 0;
    }
  }

  /**
   *
   * @param accountReference
   * @param isCostCenter
   * @param isVariable
   * @param isTurnOver
   */
  function onSelectAccountReference(accountReference, isCostCenter, isVariable, isTurnOver) {
    const config = {
      account_reference_id : accountReference.id,
      is_cost : isCostCenter,
      is_variable : isVariable,
      is_turnover : isTurnOver,
    };

    if (isCostCenter && isVariable) {
      vm.variableCostCenterReference = config;
    } else if (isCostCenter && !isVariable) {
      vm.fixCostCenterReference = config;
    } else if (!isCostCenter && isTurnOver) {
      vm.turnoverProfitCenterReference = config;
    } else if (!isCostCenter && !isTurnOver) {
      vm.otherProfitCenterReference = config;
    }
  }

  /**
   *
   * @param value
   */
  function setCostCenterMeta(value) {
    vm.isCostCenter = value;
    vm.isProfitCenter = !value;
  }

  /**
   *
   * @param services
   */
  function onServicesChange(services) {
    vm.services = services;
  }

  /**
   *
   * @param project
   */
  function onSelectProject(project) {
    vm.costCenter.project_id = project.id;
  }

  /**
   *
   * @param option
   */
  function translateAllocationBasisOption(option) {
    return $translate.instant(`ALLOCATION_METHOD_${option.toUpperCase()}`);
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param costCenterForm
   */
  function submit(costCenterForm) {
    if (costCenterForm.$invalid) { return 0; }

    if (vm.isCostCenter || vm.hasCostCenter) {
      if (vm.variableCostCenterReference) {
        vm.referenceCostCenter.push(vm.variableCostCenterReference);
      }

      if (vm.fixCostCenterReference) {
        vm.referenceCostCenter.push(vm.fixCostCenterReference);
      }
    }

    if (vm.isProfitCenter || vm.hasProfitCenter) {
      if (vm.turnoverProfitCenterReference) {
        vm.referenceCostCenter.push(vm.turnoverProfitCenterReference);
      }

      if (vm.otherProfitCenterReference) {
        vm.referenceCostCenter.push(vm.otherProfitCenterReference);
      }
    }

    const data = {
      label : vm.costCenter.label,
      is_principal : vm.costCenter.is_principal,
      reference_cost_center : vm.referenceCostCenter,
      services : vm.services,
      project_id : vm.costCenter.project_id,
      allocation_method : vm.costCenter.allocation_method,
      allocation_basis_id : vm.costCenter.allocation_basis.id,
    };

    const promise = (vm.isCreateState)
      ? CostCenter.create(data)
      : CostCenter.update(vm.costCenter.id, data);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('cost_center', null, { reload : true });
      })
      .catch(Notify.handleError);
  }
}
