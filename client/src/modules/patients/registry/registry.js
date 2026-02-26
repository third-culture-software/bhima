angular.module('bhima.controllers')
  .controller('PatientRegistryController', PatientRegistryController);

PatientRegistryController.$inject = [
  '$state', 'PatientService', 'NotifyService', 'util',
  'ReceiptModal', 'uiGridConstants', 'GridColumnService',
  'GridSortingService', 'GridStateService', '$httpParamSerializer', 'LanguageService',
  'BarcodeService', 'ModalService',
];

/**
 * Patient Registry Controller
 *
 * 
 * This module is responsible for the management of Patient Registry.
 * @param $state
 * @param Patients
 * @param Notify
 * @param util
 * @param Receipts
 * @param uiGridConstants
 * @param Columns
 * @param Sorting
 * @param GridState
 * @param $httpParamSerializer
 * @param Languages
 * @param Barcode
 * @param Modal
 */
function PatientRegistryController(
  $state, Patients, Notify, util, Receipts, uiGridConstants,
  Columns, Sorting, GridState, $httpParamSerializer, Languages,
  Barcode, Modal,
) {
  const vm = this;
  const cacheKey = 'PatientRegistry';

  vm.search = search;
  vm.patientCard = patientCard;
  vm.patientFiche = patientFiche;
  vm.openColumnConfiguration = openColumnConfiguration;
  vm.onRemoveFilter = onRemoveFilter;
  vm.download = Patients.download;
  vm.downloadExcel = downloadExcel;
  vm.languageKey = Languages.key;
  vm.toggleInlineFilter = toggleInlineFilter;
  vm.openBarcodeScanner = openBarcodeScanner;
  vm.mergePatients = mergePatients;
  vm.openFindDuplicatePatientsModal = openFindDuplicatePatientsModal;

  // track if module is making a HTTP request for patients
  vm.loading = false;

  const patientCardTemplate = `
    <div class="ui-grid-cell-contents">
      <a href ng-click="grid.appScope.patientCard(row.entity.uuid)">{{row.entity.reference}}</a>
    </div>
  `;

  const columnDefs = [{
    field : 'reference',
    displayName : 'TABLE.COLUMNS.REFERENCE',
    aggregationType : uiGridConstants.aggregationTypes.count,
    aggregationHideLabel : true,
    headerCellFilter : 'translate',
    cellTemplate : patientCardTemplate,
    footerCellClass : 'text-center',
    sortingAlgorithm : Sorting.algorithms.sortByReference,
  }, {
    field : 'display_name',
    displayName : 'TABLE.COLUMNS.NAME',
    headerCellFilter : 'translate',
    cellTemplate : '/modules/templates/grid/patient.cell.html',
  }, {
    field : 'patientAge',
    displayName : 'TABLE.COLUMNS.AGE',
    headerCellFilter : 'translate',
    type : 'number',
  }, {
    field : 'sex',
    displayName : 'TABLE.COLUMNS.GENDER',
    headerCellFilter : 'translate',
  }, {
    field : 'hospital_no',
    displayName : 'TABLE.COLUMNS.HOSPITAL_FILE_NR',
    headerCellFilter : 'translate',
  }, {
    field : 'project_name',
    displayName : 'TABLE.COLUMNS.PROJECT',
    headerCellFilter : 'translate',
  }, {
    field : 'debtorGroupName',
    displayName : 'TABLE.COLUMNS.DEBTOR_GROUP',
    headerCellFilter : 'translate',
  }, {
    field : 'registration_date',
    cellFilter : 'date',
    displayName : 'TABLE.COLUMNS.DATE_REGISTERED',
    headerCellFilter : 'translate',
  }, {
    field : 'created_at',
    type : 'date',
    displayName : 'FORM.LABELS.SERVER_DATE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/journal/templates/created_at.cell.html',
    visible : false,
  }, {
    field : 'last_visit',
    cellFilter : 'date',
    displayName : 'TABLE.COLUMNS.LAST_VISIT',
    headerCellFilter : 'translate',
    type : 'date',
  }, {
    field : 'dob',
    cellFilter : 'date',
    displayName : 'TABLE.COLUMNS.DOB',
    headerCellFilter : 'translate',
    type : 'date',
  }, {
    field : 'userName',
    displayName : 'TABLE.COLUMNS.USER',
    headerCellFilter : 'translate',
  }, {
    field : 'originVillageName',
    displayName : 'FORM.LABELS.ORIGIN_VILLAGE',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'originProvinceName',
    displayName : 'FORM.LABELS.ORIGIN_PROVINCE',
    headerCellFilter : 'translate',
    visible : false,
  },
  {
    field : 'health_area',
    displayName : 'FORM.LABELS.HEALTH_AREA',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'health_zone',
    displayName : 'FORM.LABELS.HEALTH_ZONE',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'originSectorName',
    displayName : 'FORM.LABELS.ORIGIN_SECTOR',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    name : 'actions',
    displayName : '',
    cellTemplate : '/modules/patients/templates/action.cell.html',
    enableSorting : false,
    enableFiltering : false,
  }];

  vm.uiGridOptions = {
    appScopeProvider : vm,
    showColumnFooter : true,
    enableSorting : true,
    enableColumnMenus : false,
    flatEntityAccess : true,
    fastWatch : true,
    columnDefs,
  };

  vm.uiGridOptions.onRegisterApi = function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  };

  /**
   *
   */
  function toggleInlineFilter() {
    vm.uiGridOptions.enableFiltering = !vm.uiGridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }
  const columnConfig = new Columns(vm.uiGridOptions, cacheKey);
  const state = new GridState(vm.uiGridOptions, cacheKey);

  vm.saveGridState = state.saveGridState;
  vm.clearGridState = function clearGridState() {
    state.clearGridState();
    $state.reload();
  };

  // error handler
  /**
   *
   * @param error
   */
  function handler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  // this function loads patients from the database with search filters, if passed in.
  /**
   *
   * @param filters
   */
  function load(filters) {

    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    const request = Patients.read(null, filters);

    // hook the returned patients up to the grid.
    request
      .then((patients) => {
        patients.forEach((patient) => {
          patient.patientAge = util.getMomentAge(patient.dob, 'years');
        });

        // put data in the grid
        vm.uiGridOptions.data = patients;
      })
      .catch(handler)
      .finally(() => {
        toggleLoadingIndicator();
      });
  }

  /**
   *
   */
  function search() {
    const filtersSnapshot = Patients.filters.formatHTTP();

    Patients.openSearchModal(filtersSnapshot)
      .then((changes) => {
        if (!changes) { return null; }
        Patients.filters.replaceFilters(changes);
        Patients.cacheFilters();
        vm.latestViewFilters = Patients.filters.formatView();
        return load(Patients.filters.formatHTTP(true));
      });
  }

  /**
   * @function openFindDuplicatePatientsModal
   * @description
   * Opens the modal to locate duplicate patients.  This is essentially a search
   * modal and returns filters to the registry to filter the registry on duplciate
   * patients.  If the modal is dismissed, nothing happens.
   */
  function openFindDuplicatePatientsModal() {
    Patients.openFindDuplicatePatientsModal()
      .then((changes) => {
        Patients.filters.replaceFilters(changes);
        vm.latestViewFilters = Patients.filters.formatView();
        return load(Patients.filters.formatHTTP(true));
      })
      .catch(angular.noop);
  }

  // remove a filter with from the filter object, save the filters and reload
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    Patients.removeFilter(key);
    Patients.cacheFilters();
    vm.latestViewFilters = Patients.filters.formatView();
    return load(Patients.filters.formatHTTP(true));
  }

  /**
   *
   */
  function openColumnConfiguration() {
    columnConfig.openConfigurationModal();
  }

  // toggles the loading indicator on or off
  /**
   *
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  // patient card
  /**
   *
   * @param uuid
   */
  function patientCard(uuid) {
    Receipts.patient(uuid);
  }

  /**
   *
   * @param uuid
   */
  function patientFiche(uuid) {
    Receipts.patient(uuid, false, { fiche : 1 });
  }

  // startup function. Checks for cached filters and loads them.  This behavior could be changed.
  /**
   *
   */
  function startup() {
    if ($state.params.filters.length) {
      Patients.filters.replaceFiltersFromState($state.params.filters);
      Patients.cacheFilters();
    }

    load(Patients.filters.formatHTTP(true));
    vm.latestViewFilters = Patients.filters.formatView();
  }

  /**
   *
   */
  function downloadExcel() {
    const filterOpts = Patients.filters.formatHTTP();
    const defaultOpts = {
      renderer : 'xlsx',
      lang : Languages.key,
      rowsDataKey : 'patients',
      renameKeys : true,
      displayNames : columnConfig.getDisplayNames(),
    };
    // combine options
    const options = angular.merge(defaultOpts, filterOpts);
    // return  serialized options
    return $httpParamSerializer(options);
  }

  /**
   * @function searchByBarcode()
   * @description
   * Gets the barcode from the barcode modal and then
   */
  function openBarcodeScanner() {
    Barcode.modal()
      .then(record => {
        Patients.filters.replaceFilters([
          { key : 'uuid', value : record.uuid, displayValue : record.display_name },
        ]);

        load(Patients.filters.formatHTTP(true));
        vm.latestViewFilters = Patients.filters.formatView();
      });
  }

  /**
   * @function mergePatients
   * @description
   * launch the merge patients modal tool
   */
  function mergePatients() {
    const selectedRows = vm.gridApi.selection.getSelectedRows();
    if (selectedRows.length === 0) {
      Notify.warn('FORM.WARNINGS.EMPTY_SELECTION');
      return;
    }

    if (selectedRows.length !== 2) {
      Notify.warn('FORM.WARNINGS.ONLY_TWO_PATIENTS');
      return;
    }

    // todo send uuid
    const patients = selectedRows.map(p => p);
    $state.go('patientRegistry.merge', { patients });
  }

  vm.changePatientGroup = () => {
    const patients = vm.gridApi.selection.getSelectedRows();
    if (patients.length === 0) {
      Notify.warn('FORM.WARNINGS.EMPTY_SELECTION');
      return;
    }

    // get the patient uuids
    const data = patients.map(patient => patient.uuid);

    Modal.editPatientGroup(data).then((result) => {
      if (result) {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
      }
    });
  };

  // fire up the module
  startup();
}
