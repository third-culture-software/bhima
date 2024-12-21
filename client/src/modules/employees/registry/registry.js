angular.module('bhima.controllers')
  .controller('EmployeeRegistryController', EmployeeRegistryController);

EmployeeRegistryController.$inject = [
  '$state', 'EmployeeService', 'NotifyService', 'AppCache',
  'util', 'ReceiptModal', 'uiGridConstants', 'GridColumnService', 'bhConstants',
  'GridStateService', 'GridSortingService', 'LanguageService',
];

/**
 * Employee Registry Controller
 *
 * @description
 * This module is responsible for the management of Employe Registry.
 */
function EmployeeRegistryController(
  $state, Employees, Notify, AppCache, util, Receipts, uiGridConstants, Columns,
  bhConstants, GridState, Sorting, Languages,
) {
  const vm = this;

  const cacheKey = 'EmployeeRegistry';

  vm.search = search;
  vm.employeesCard = employeesCard;
  vm.openColumnConfiguration = openColumnConfiguration;
  vm.gridApi = {};
  vm.onRemoveFilter = onRemoveFilter;
  vm.download = Employees.download;
  vm.toggleInlineFilter = toggleInlineFilter;
  vm.languageKey = Languages.key;

  // track if module is making a HTTP request for employeess
  vm.loading = false;

  function muteDisabledCells(grid, row) {
    return (row.entity.locked) ? `text-muted strike` : '';
  }

  const columnDefs = [
    {
      field                : 'reference',
      displayName          : 'TABLE.COLUMNS.REFERENCE',
      aggregationType      : uiGridConstants.aggregationTypes.count,
      aggregationHideLabel : true,
      headerCellFilter     : 'translate',
      footerCellClass      : 'text-center',
      sortingAlgorithm : Sorting.algorithms.sortByReference,
      cellClass : muteDisabledCells,
    },
    {
      field                : 'code',
      displayName          : 'TABLE.COLUMNS.REGISTRATION_NUMBER',
      headerCellFilter     : 'translate',
      footerCellClass      : 'text-center',
      cellClass            : muteDisabledCells,
    },
    {
      field            : 'display_name',
      displayName      : 'TABLE.COLUMNS.NAME',
      headerCellFilter : 'translate',
      cellTemplate     : '/modules/employees/templates/employee.cell.html',
      sort : { direction : uiGridConstants.ASC, priority : 1 },
      cellClass : muteDisabledCells,
    },
    {
      field            : 'service_name',
      displayName      : 'TABLE.COLUMNS.SERVICE',
      headerCellFilter : 'translate',
      sort : { direction : uiGridConstants.ASC, priority : 2 },
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'cost_center',
      displayName      : 'TABLE.COLUMNS.COST_CENTER',
      headerCellFilter : 'translate',
      sort : { direction : uiGridConstants.ASC, priority : 1 },
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'is_medical',
      displayName      : 'FORM.LABELS.MEDICAL_STAFF',
      headerCellFilter : 'translate',
      cellTemplate     : '/modules/employees/templates/medical.cell.html',
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'sex',
      displayName      : 'TABLE.COLUMNS.GENDER',
      headerCellFilter : 'translate',
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'dob',
      displayName      : 'TABLE.COLUMNS.DOB',
      headerCellFilter : 'translate',
      type             : 'date',
      cellFilter       : 'date:'.concat(bhConstants.dates.format),
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'hiring_date',
      displayName      : 'FORM.LABELS.DATE_EMBAUCHE',
      headerCellFilter : 'translate',
      type             : 'date',
      visible          : false,
      cellFilter       : 'date:'.concat(bhConstants.dates.format),
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'text',
      displayName      : 'TABLE.COLUMNS.GRADE',
      headerCellFilter : 'translate',
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'nb_spouse',
      displayName      : 'FORM.LABELS.NB_SPOUSE',
      headerCellFilter : 'translate',
      type             : 'number',
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'nb_enfant',
      displayName      : 'FORM.LABELS.NB_CHILD',
      headerCellFilter : 'translate',
      type             : 'number',
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'individual_salary',
      displayName      : 'FORM.LABELS.INDIVIDUAL_SALARY',
      headerCellFilter : 'translate',
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'bank',
      displayName      : 'FORM.LABELS.BANK',
      headerCellFilter : 'translate',
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'bank_account',
      displayName      : 'FORM.LABELS.BANK_ACCOUNT',
      headerCellFilter : 'translate',
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'adresse',
      displayName      : 'FORM.LABELS.ADDRESS',
      headerCellFilter : 'translate',
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'phone',
      displayName      : 'FORM.LABELS.PHONE',
      headerCellFilter : 'translate',
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'email',
      displayName      : 'FORM.LABELS.EMAIL',
      headerCellFilter : 'translate',
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'fonction_txt',
      displayName      : 'FORM.LABELS.FUNCTION',
      headerCellFilter : 'translate',
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      field            : 'title_txt',
      displayName      : 'FORM.LABELS.PROFESSION',
      headerCellFilter : 'translate',
      visible          : false,
      cellClass        : muteDisabledCells,
    },
    {
      name            : 'actions',
      displayName     : '',
      cellTemplate    : '/modules/employees/templates/action.cell.html',
      enableFiltering : false,
    },
  ];

  vm.uiGridOptions = {
    appScopeProvider  : vm,
    showColumnFooter  : true,
    enableSorting     : true,
    enableColumnMenus : false,
    flatEntityAccess  : true,
    fastWatch         : true,
    columnDefs,
    onRegisterApi : (api) => { vm.gridApi = api; },
  };

  const columnConfig = new Columns(vm.uiGridOptions, cacheKey);
  const state = new GridState(vm.uiGridOptions, cacheKey);

  function toggleInlineFilter() {
    vm.uiGridOptions.enableFiltering = !vm.uiGridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  vm.saveGridState = state.saveGridState;
  vm.clearGridState = function clearGridState() {
    state.clearGridState();
    $state.reload();
  };

  // error handler
  function handler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  // this function loads employees from the database with search parameters
  // if passed in.
  function load(parameters) {
    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    // hook the returned employeess up to the grid.
    Employees.read(null, parameters)
      .then((employees) => {
        employees.forEach((employee) => {
          employee.employeeAge = util.getMomentAge(employee.dob, 'years');
        });

        // put data in the grid
        vm.uiGridOptions.data = employees;
      })
      .catch(handler)
      .finally(() => {
        toggleLoadingIndicator();
      });
  }

  function search() {
    const filtersSnapshot = Employees.filters.formatHTTP();
    Employees.openSearchModal(filtersSnapshot)
      .then((changes) => {
        // This is very important if changes is undefined, a cache problem occurs
        if (!changes) { return; }

        Employees.filters.replaceFilters(changes);

        Employees.cacheFilters();
        vm.latestViewFilters = Employees.filters.formatView();
        load(Employees.filters.formatHTTP(true));
      });
  }

  // remove a filter with from the filter object, save the filters and reload
  function onRemoveFilter(key) {
    Employees.removeFilter(key);
    Employees.cacheFilters();
    vm.latestViewFilters = Employees.filters.formatView();
    return load(Employees.filters.formatHTTP(true));
  }

  function openColumnConfiguration() {
    columnConfig.openConfigurationModal();
  }

  // toggles the loading indicator on or off
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  // employee card
  function employeesCard(uuid) {
    Receipts.patient(uuid);
  }

  // startup function. Checks for cached filters and loads them.  This behavior could be changed.
  function startup() {
    if ($state.params.filters.length) {
      Employees.filters.replaceFiltersFromState($state.params.filters);
      Employees.cacheFilters();
    }

    load(Employees.filters.formatHTTP(true));
    vm.latestViewFilters = Employees.filters.formatView();
  }

  // fire up the module
  startup();
}
