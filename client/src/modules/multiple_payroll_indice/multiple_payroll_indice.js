angular.module('bhima.controllers')
  .controller('MultiplePayrollIndiceController', MultiplePayrollIndiceController);

// dependencies injection
MultiplePayrollIndiceController.$inject = [
  'MultipleIndicesPayrollService', 'NotifyService',
  'GridColumnService', 'GridStateService', '$state',
  'util', 'uiGridConstants', 'LanguageService', '$httpParamSerializer', '$translate',
];

/**
 * Multiple Payroll Registry Controller
 *
 * @description
 * This controller is responsible for display all vouchers in the voucher table as a
 * registry.  The registry supports client-side filtering, server-side searching, column
 * reordering, and many more features.
 */
function MultiplePayrollIndiceController(
  MultiplePayroll, Notify, Columns, GridState,
  $state, util, uiGridConstants, Languages, $httpParamSerializer,
  $translate,
) {
  const vm = this;
  const cacheKey = 'multiple-indice-payroll-grid';

  vm.gridOptions = {};

  vm.search = search;
  vm.onRemoveFilter = onRemoveFilter;
  vm.openColumnConfigModal = openColumnConfigModal;
  vm.clearGridState = clearGridState;
  vm.download = MultiplePayroll.download;
  vm.toggleInlineFilter = toggleInlineFilter;
  vm.staffingParametersModal = staffingParametersModal;
  vm.importConfigCSV = importConfigCSV;

  // date format function
  vm.format = util.formatDate;

  vm.loading = false;
  vm.activePosting = true;
  vm.activeConfig = true;

  const columnDefs = [{
    field : 'display_name',
    displayName : 'FORM.LABELS.EMPLOYEE_NAME',
    headerCellFilter : 'translate',
    width : 100,
    aggregationType  : uiGridConstants.aggregationTypes.count,
    aggregationHideLabel : true,
  }, {
    field : 'service_name',
    displayName : 'FORM.LABELS.SERVICE',
    headerCellFilter : 'translate',
  }, {
    field : 'action',
    width : 100,
    displayName : '',
    enableFiltering : false,
    enableSorting : false,
    cellTemplate : 'modules/multiple_payroll_indice/templates/action.tmpl.html',
  }];

  // grid default options
  vm.gridOptions = {
    appScopeProvider  : vm,
    showColumnFooter  : true,
    enableColumnMenus : false,
    flatEntityAccess  : true,
    fastWatch         : true,
    columnDefs,
    onRegisterApi : function onRegisterApi(api) {
      vm.gridApi = api;
    },
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
        if (!changes || !changes.length) { return null; }
        MultiplePayroll.filters.replaceFilters(changes);
        MultiplePayroll.cacheFilters();
        vm.latestViewFilters = MultiplePayroll.filters.formatView();
        return load(MultiplePayroll.filters.formatHTTP(true));
      });
  }

  function load(filters) {
    vm.payrollConfigurationId = filters.payroll_configuration_id;

    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    MultiplePayroll.read(null, filters)
      .then((result) => {
        renameGridHeaders(result.rubrics);
        vm.gridOptions.data = setGridData(result.employees);
      })
      .catch(errorHandler)
      .finally(toggleLoadingIndicator);
  }

  function renameGridHeaders(rubrics) {
    const actions = angular.copy(columnDefs[columnDefs.length - 1]);
    const newColumns = columnDefs.slice(0, 2);

    const header = {
      type : 'number',
      headerCellFilter : 'translate',
      cellClass  : 'text-right',
      footerCellClass  : 'text-right',
      footerCellFilter : 'number:2',
      cellFilter : 'number:2',
      aggregationType : uiGridConstants.aggregationTypes.sum,
      aggregationHideLabel : true,
    };

    rubrics.forEach(rubric => {
      newColumns.push(angular.extend({}, header, {
        field            : `${rubric.id}`,
        displayName      : rubric.abbr,
        headerTooltip : rubric.label,
      }));
    });

    vm.gridOptions.columnDefs = [...newColumns, actions];

    // notify the grid of a data change
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  function setGridData(employees) {
    return employees.map(employee => {
      const row = {
        employee_uuid : employee.uuid,
        display_name : employee.display_name,
        service_name : employee.service_name,
      };

      employee.rubrics.forEach(r => {
        row[r.rubric_id] = r.rubric_value;
      });

      return row;
    });
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

  //
  vm.putOnWaiting = function putOnWaiting() {
    const employees = vm.gridApi.selection.getSelectedRows();

    if (employees.length) {
      // get All Employees Reference
      const employeesRef = employees.map(emp => emp.reference);

      // returns true If one employee who is not configured is selected
      const isNotConfigured = employee => parseInt(employee.status_id, 10) !== 2;
      const invalid = employees.some(isNotConfigured);

      if (invalid) {
        Notify.warn('FORM.WARNINGS.ATTENTION_WAITING_LIST');
      } else {
        vm.activePosting = false;

        const idPeriod = vm.latestViewFilters.defaultFilters[0]._value;
        MultiplePayroll.paymentCommitment(idPeriod, employeesRef)
          .then(() => {
            Notify.success('FORM.INFO.CONFIGURED_SUCCESSFULLY');
            vm.activePosting = true;
            $state.go('multiple_payroll', null, { reload : true });
          })
          .catch(Notify.handleError);
      }
    } else {
      Notify.danger('FORM.WARNINGS.NO_EMPLOYEE_SELECTED');
    }
  };

  vm.saveGridState = state.saveGridState;
  // saves the grid's current configuration
  function clearGridState() {
    state.clearGridState();
    $state.reload();
  }

  function staffingParametersModal() {
    MultiplePayroll.staffingParametersModal().then(result => {
      if (result) {
        startup();
      }
    });
  }

  vm.downloadExcel = () => {
    const displayNames = gridColumns.getDisplayNames();
    const filterOpts = MultiplePayroll.filters.formatHTTP();
    const payrollConfigurationLabel = MultiplePayroll.filters._defaultFilters[0].displayValue;
    const fileTemplateName = `${$translate.instant('FORM.LABELS.DOWN_TEMPLATE_FILE')}_${payrollConfigurationLabel}_`;

    const defaultOpts = {
      renderer : 'xlsx',
      lang : Languages.key,
      filename : fileTemplateName,
      ignoredColumns : [
        displayNames.uuid,
        displayNames.hrRecord,
        displayNames.hrEntity,
      ],
      renameKeys : true,
      displayNames,
    };
    // combine options
    const options = angular.merge(defaultOpts, filterOpts);
    // return  serialized options
    return $httpParamSerializer(options);
  };

  function importConfigCSV() {
    return MultiplePayroll.importConfigModal({ payroll_configuration_id : vm.payrollConfigurationId })
      .then(result => {
        if (result) {
          startup();
        }
      })
      .catch(Notify.handleError);
  }

  startup();
}
