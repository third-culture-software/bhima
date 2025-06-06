angular.module('bhima.controllers')
  .controller('MultiplePayrollController', MultiplePayrollController);

// dependencies injection
MultiplePayrollController.$inject = [
  'MultiplePayrollService', 'NotifyService',
  'GridSortingService', 'GridColumnService', 'GridStateService', '$state',
  'ReceiptModal', 'uiGridConstants', 'SessionService',
];

/**
 * Multiple Payroll Registry Controller
 *
 * @description
 * This controller is responsible for display all vouchers in the voucher table as a
 * registry.  The registry supports client-side filtering, server-side searching, column
 * reordering, and many more features.
 */
function MultiplePayrollController(
  MultiplePayroll, Notify, Sorting, Columns, GridState, $state,
  Receipts, uiGridConstants, Session,
) {
  const vm = this;
  const cacheKey = 'multiple-payroll-grid';

  vm.gridOptions = {};

  vm.search = search;
  vm.onRemoveFilter = onRemoveFilter;
  vm.openColumnConfigModal = openColumnConfigModal;
  vm.clearGridState = clearGridState;
  vm.toggleInlineFilter = toggleInlineFilter;

  vm.loading = false;
  vm.activePosting = true;
  vm.activeConfig = true;

  const columnDefs = [{
    field : 'hrreference',
    displayName : 'TABLE.COLUMNS.REFERENCE',
    headerCellFilter : 'translate',
    aggregationType : uiGridConstants.aggregationTypes.count,
    aggregationHideLabel : true,
    footerCellClass : 'text-center',
    sortingAlgorithm : Sorting.algorithms.sortByReference,
  }, {
    field : 'display_name',
    displayName : 'FORM.LABELS.EMPLOYEE_NAME',
    headerCellFilter : 'translate',
  }, {
    field : 'service_name',
    displayName : 'FORM.LABELS.SERVICE',
    headerCellFilter : 'translate',
  }, {
    field : 'function_name',
    displayName : 'FORM.LABELS.FUNCTION',
    headerCellFilter : 'translate',
  }, {
    field : 'code',
    displayName : 'FORM.LABELS.CODE',
    headerCellFilter : 'translate',
  }, {
    field : 'net_salary',
    aggregationHideLabel : true,
    aggregationType  : uiGridConstants.aggregationTypes.sum,
    cellClass : 'text-right',
    cellFilter : 'currency:row.entity.currency_id',
    displayName : 'FORM.LABELS.NET_SALARY',
    footerCellClass : 'text-right',
    headerCellFilter : 'translate',
    type : 'number',
  }, {
    field : 'balance',
    aggregationHideLabel : true,
    aggregationType  : uiGridConstants.aggregationTypes.sum,
    cellClass : 'text-right',
    cellFilter : 'currency:row.entity.currency_id',
    displayName : 'FORM.LABELS.BALANCE',
    footerCellClass : 'text-right',
    headerCellFilter : 'translate',
    type : 'number',
  }, {
    field : 'status_id',
    displayName : 'FORM.LABELS.STATUS',
    headerCellFilter : 'translate',
    enableFiltering : false,
    enableSorting : false,
    cellTemplate : '/modules/multiple_payroll/templates/cellStatus.tmpl.html',
  }, {
    field : 'action',
    width : 200,
    displayName : '',
    enableFiltering : false,
    enableSorting : false,
    cellTemplate : 'modules/multiple_payroll/templates/action.tmpl.html',
  }];

  // grid default options
  vm.gridOptions = {
    appScopeProvider  : vm,
    showColumnFooter  : true,
    enableColumnMenus : false,
    flatEntityAccess  : true,
    fastWatch         : true,
    rowTemplate       : '/modules/templates/row.negative.html',
    columnDefs,
    onRegisterApi : (api) => { vm.gridApi = api; },
  };

  const gridColumns = new Columns(vm.gridOptions, cacheKey);
  const state = new GridState(vm.gridOptions, cacheKey);

  function toggleInlineFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  // search Payroll Data
  function search() {
    const filtersSnapshot = MultiplePayroll.filters.formatHTTP();

    MultiplePayroll.openSearchModal(filtersSnapshot)
      .then((changes) => {
        if (!changes) { return; }

        if (changes.length) {
          MultiplePayroll.filters.replaceFilters(changes);
          MultiplePayroll.cacheFilters();
          vm.latestViewFilters = MultiplePayroll.filters.formatView();
          load(MultiplePayroll.filters.formatHTTP(true));
        }
      });
  }

  // TODO(@jniles) - clean this up a bit.
  // uses $state to open the configuration modal for the employee
  vm.goToEmployeeConfig = goToEmployeeConfig;
  function goToEmployeeConfig(uuid) {
    const period = getCurrentPeriodInfo();
    $state.go('multiple_payroll.config', { paymentPeriodId : period.id, employeeUuid : uuid });
  }

  // TODO(@jniles) - we should have a better way of getting the current period information
  // rather than getting it from the filter values, but at least this is standaridzed.
  function getCurrentPeriodInfo() {
    // current period is the first default filter value
    const [periodFromFilter] = vm.latestViewFilters.defaultFilters;

    return {
      id : periodFromFilter._value,
      label : periodFromFilter.displayValue,
    };
  }

  function load(filters) {
    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    MultiplePayroll.read(null, filters)
      .then((employees) => {
        vm.gridOptions.data = employees;
      })
      .catch(errorHandler)
      .finally(toggleLoadingIndicator);
  }

  // remove a filter with from the filter object, save the filters and reload
  function onRemoveFilter(key) {
    MultiplePayroll.removeFilter(key);
    MultiplePayroll.cacheFilters();
    vm.latestViewFilters = MultiplePayroll.filters.formatView();

    load(MultiplePayroll.filters.formatHTTP(true));
  }

  /**
   * @function errorHandler
   *
   * @description
   * Uses Notify to show an error in case the server sends back an information.
   * Triggers the error state on the grid.
   */
  function errorHandler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  /**
   * @function toggleLoadingIndicator
   *
   * @description
   * Toggles the grid's loading indicator to eliminate the flash when rendering
   * transactions and allow a better UX for slow loads.
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  // initialize module
  function startup() {
    if ($state.params.filters.length) {
      MultiplePayroll.filters.replaceFiltersFromState($state.params.filters);
      MultiplePayroll.cacheFilters();
    }

    vm.latestViewFilters = MultiplePayroll.filters.formatView();

    // If there is no filter open the window to select the pay period
    // TODO(@jniles) - the payment period ID should be embedded in the URL,
    // and should default to "search()" if there is no payment period.  This would
    // be conceptually cleaner.
    // We could then also have the "default" status on the payment period page.
    if (!vm.latestViewFilters.defaultFilters.length) {
      search();
    } else {
      load(MultiplePayroll.filters.formatHTTP(true));
    }
  }

  // This function opens a modal through column service to let the user toggle
  // the visibility of the voucher registry's columns.
  function openColumnConfigModal() {
    // column configuration has direct access to the grid API to alter the current
    // state of the columns - this will be saved if the user saves the grid configuration
    gridColumns.openConfigurationModal();
  }

  // this function actually puts the employees on the list to be paid.
  vm.putOnWaiting = function putOnWaiting() {
    const employees = vm.gridApi.selection.getSelectedRows();

    if (employees.length === 0) {
      Notify.danger('FORM.WARNINGS.NO_EMPLOYEE_SELECTED');
      return;
    }

    const numberOfEmployeesWithNegativeSalary = employees.filter(emp => (emp.net_salary < 0)).length;

    if (numberOfEmployeesWithNegativeSalary > 0) {
      Notify.danger('FORM.WARNINGS.ATTENTION_NEGATIVE_VALUE');
      return;
    }

    // returns true If one employee who is not configured is selected
    const isNotConfigured = employee => parseInt(employee.status_id, 10) !== 2;
    const invalid = employees.some(isNotConfigured);

    if (invalid) {
      Notify.warn('FORM.WARNINGS.ATTENTION_WAITING_LIST');
      return;
    }

    // get All Employees Uuid
    const employeeUuids = employees.map(emp => emp.employee_uuid);
    const totalNetSalary = employees.reduce((agg, emp) => agg + emp.net_salary, 0);

    const period = getCurrentPeriodInfo();

    const waitingListParameters = {
      totalNetSalary,
      employeeUuids,
      paymentPeriodLabel : period.label,
      paymentPeriodId : period.id,
    };

    MultiplePayroll.openModalWaitingListConfirmation(waitingListParameters)
      .then(() => {
        Notify.success('FORM.INFO.CONFIGURED_SUCCESSFULLY');
        $state.go('multiple_payroll', null, { reload : true });
      })
      .catch(Notify.handleError);
  };

  // Set Configured
  vm.setConfigured = function setConfigured() {
    const employees = vm.gridApi.selection.getSelectedRows();

    if (employees.length) {
      const filters = MultiplePayroll.filters.formatHTTP(true);
      const currencyId = filters.currency_id;
      if (currencyId !== Session.enterprise.currency_id) {
        Notify.warn('FORM.INFO.SETTING_PAYMENT_CURRENCY');
      } else {
        // returns true If one employee who is no longer waiting for configuration is selected
        const isNotWaitingConfiguration = employee => parseInt(employee.status_id, 10) !== 1;
        const invalid = employees.some(isNotWaitingConfiguration);

        if (invalid) {
          Notify.warn('FORM.WARNINGS.ATTENTION_CONFIGURED');
        } else {
          vm.activeConfig = false;
          const period = getCurrentPeriodInfo();
          const data = {
            employees,
            currencyId,
          };

          MultiplePayroll.configurations(period.id, data)
            .then(() => {
              Notify.success('FORM.INFO.CONFIGURED_SUCCESSFULLY');
              vm.activeConfig = true;
              $state.go('multiple_payroll', null, { reload : true });
            })
            .catch(Notify.handleError);
        }
      }
    } else {
      Notify.danger('FORM.WARNINGS.NO_EMPLOYEE_SELECTED');
    }
  };

  vm.viewPaySlip = function viewPaySlip() {
    const employees = vm.gridApi.selection.getSelectedRows();

    if (employees.length) {
      // get All Employees Uuid
      const employeesUuid = employees.map(emp => emp.employee_uuid);

      const filters = MultiplePayroll.filters.formatHTTP(true);
      const currency = filters.currency_id;
      const conversionRate = filters.conversion_rate;

      // returns true if one employee waiting for configuration is selected
      const isWaitingConfiguration = employee => parseInt(employee.status_id, 10) === 1;
      const invalid = employees.some(isWaitingConfiguration);

      if (invalid) {
        Notify.warn('FORM.WARNINGS.ATTENTION_PAYSLIPS');
      } else {
        const period = getCurrentPeriodInfo();

        Receipts.payroll(period.id, employeesUuid, currency, conversionRate, true);
      }
    } else {
      Notify.danger('FORM.WARNINGS.NO_EMPLOYEE_SELECTED');
    }
  };

  /*
   * The PayrollReport function allows to display two reports related to the Payroll,
   * the first to display a condensed report of the bulletins of payrolls of the employees
   * and the second a report of the payroll taxes on remuneration (Charges of the company)
  */
  vm.viewPaySlipReport = function viewPaySlipReport(socialCharge) {
    const employees = vm.gridApi.selection.getSelectedRows();

    if (employees.length) {
      // get All Employees Uuid
      const employeesUuid = employees.map(emp => emp.employee_uuid);

      const filters = MultiplePayroll.filters.formatHTTP(true);
      const currencyId = filters.currency_id;
      const conversionRate = filters.conversion_rate;

      // returns true if one employee waiting for configuration is selected
      const isWaitingConfiguration = employee => parseInt(employee.status_id, 10) === 1;
      const invalid = employees.some(isWaitingConfiguration);

      if (invalid) {
        Notify.warn('FORM.WARNINGS.ATTENTION_PAYSLIPS');
      } else {
        const period = getCurrentPeriodInfo();
        Receipts.payrollReport(period.id, employeesUuid, currencyId, socialCharge, conversionRate);
      }
    } else {
      Notify.danger('FORM.WARNINGS.NO_EMPLOYEE_SELECTED');
    }
  };

  vm.paySlip = function paySlip(employee) {
    const filters = MultiplePayroll.filters.formatHTTP(true);
    const currency = filters.currency_id;
    const conversionRate = filters.conversion_rate;
    const period = getCurrentPeriodInfo();
    Receipts.payroll(period.id, employee.employee_uuid, currency, conversionRate, true);
  };

  vm.download = function download(type) {
    let employeesSelected;

    if (vm.gridApi) {
      employeesSelected = vm.gridApi.selection.getSelectedRows();
    } else {
      employeesSelected = [];
    }

    return MultiplePayroll.download(type, employeesSelected);
  };

  vm.saveGridState = state.saveGridState;
  // saves the grid's current configuration
  function clearGridState() {
    state.clearGridState();
    $state.reload();
  }

  startup();
}
