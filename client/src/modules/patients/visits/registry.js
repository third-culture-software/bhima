angular.module('bhima.controllers')
  .controller('AdmissionRegistryController', AdmissionRegistryController);

AdmissionRegistryController.$inject = [
  '$state', 'VisitService', 'NotifyService', 'util', 'uiGridConstants',
  'GridColumnService', 'GridStateService', 'LanguageService', 'ReceiptModal',
];

/**
 * Admission Registry Controller
 *
 * This module is responsible for the management of Admission Registry.
 */
function AdmissionRegistryController(
  $state, Visits, Notify, util, uiGridConstants,
  Columns, GridState, Languages, Receipts,
) {
  const vm = this;
  const cacheKey = 'AdmissionRegistry';

  // the grid registry filter
  const { grid } = Visits;

  vm.loading = false;
  vm.search = search;
  vm.patientCard = patientCard;
  vm.openColumnConfiguration = openColumnConfiguration;
  vm.onRemoveFilter = onRemoveFilter;
  vm.languageKey = Languages.key;
  vm.toggleInlineFilter = toggleInlineFilter;
  vm.openTransferModal = openTransferModal;
  vm.openVisitModal = openVisitModal;
  vm.openPatientDischargeModal = openPatientDischargeModal;

  const patientCardTemplate = `
    <div class="ui-grid-cell-contents">
      <a ui-sref="patientRecord({ patientUuid : row.entity.patient_uuid })">{{row.entity.reference}}</a>
    </div>
  `;

  const patientDetailsTemplate = `
    <div class="ui-grid-cell-contents">
      <a ui-sref="patientRecord({ patientUuid : row.entity.patient_uuid })">{{row.entity.display_name}}</a>
    </div>
  `;

  const columnDefs = [{
    field : 'service_name',
    displayName : 'FORM.LABELS.SERVICE',
    headerCellFilter : 'translate',
  }, {
    field : 'ward_name',
    displayName : 'WARD.TITLE',
    headerCellFilter : 'translate',
  }, {
    field : 'room_label',
    displayName : 'ROOM.TITLE',
    headerCellFilter : 'translate',
  }, {
    field : 'bed_label',
    displayName : 'BED.TITLE',
    headerCellFilter : 'translate',
  }, {
    field : 'reference',
    displayName : 'TABLE.COLUMNS.REFERENCE',
    headerCellFilter : 'translate',
    cellTemplate : patientCardTemplate,
  }, {
    field : 'display_name',
    displayName : 'TABLE.COLUMNS.NAME',
    headerCellFilter : 'translate',
    cellTemplate : patientDetailsTemplate,
  }, {
    field : 'sex',
    displayName : 'FORM.LABELS.SEX',
    headerCellFilter : 'translate',
  }, {
    field : 'hospital_no',
    displayName : 'PATIENT_RECORDS.HOSPITAL_NO',
    headerCellFilter : 'translate',
  }, {
    field : 'start_date',
    displayName : 'PATIENT_RECORDS.VISITS.ADMISSION_DATE',
    headerCellFilter : 'translate',
    cellFilter : 'date',
    type : 'date',
  }, {
    field : 'end_date',
    displayName : 'PATIENT_RECORDS.VISITS.DISCHARGE_DATE',
    headerCellFilter : 'translate',
    cellFilter : 'date',
    type : 'date',
    cellTemplate : '/modules/patients/visits/templates/end_date.cell.html',
  }, {
    field : 'discharge_label',
    displayName : 'PATIENT_RECORDS.DISCHARGE.TITLE',
    headerCellFilter : 'translate',
    cellFilter : 'translate',
  }, {
    field : 'duration',
    displayName : 'PATIENT_RECORDS.VISITS.DURATION',
    headerCellFilter : 'translate',
    type : 'number',
    cellFilter : 'amDurationFormat:"day"',
  }, {
    field : 'hospitalized',
    displayName : 'PATIENT_RECORDS.VISITS.ADMISSION_TYPE',
    headerCellFilter : 'translate',
    cellTemplate : '/modules/patients/visits/templates/type.cell.html',
  }, {
    name : 'actions',
    displayName : '',
    cellTemplate : '/modules/patients/visits/templates/action.cell.html',
    enableSorting : false,
    enableFiltering : false,
  }];

  vm.uiGridOptions = {
    appScopeProvider : vm,
    showGridFooter : true,
    enableSorting : true,
    enableColumnMenus : false,
    flatEntityAccess : true,
    fastWatch : true,
    columnDefs,
  };

  vm.uiGridOptions.onRegisterApi = function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  };

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
  function handler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  // this function loads admissions from the database with search filters, if passed in.
  function load(filters) {

    // flush error and loading states
    vm.hasError = false;
    vm.loading = true;

    // hook the returned admissions up to the grid.
    return Visits.admissions.read(null, filters)
      .then((admissions) => {

        // put data in the grid
        vm.uiGridOptions.data = admissions;
        // grid : update view filters
        vm.latestViewFilters = grid.latestViewFilters();
      })
      .catch(handler)
      .finally(() => {
        toggleLoadingIndicator();
      });
  }

  // grid : search modal
  function search() {
    grid.search(Visits.openAdmissionSearchModal, load);
  }

  // grid : on remove a filter
  function onRemoveFilter(key) {
    grid.onRemoveFilter(key, load);
  }

  // grid : on startup
  function startup() {
    grid.startup($state.params, load);
  }

  function openColumnConfiguration() {
    columnConfig.openConfigurationModal();
  }

  // toggles the loading indicator on or off
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  // admission card
  function patientCard(uuid) {
    Receipts.patient(uuid);
  }

  // new patient visit
  function openVisitModal() {
    Visits.openAdmission(null, true)
      .then(result => {
        if (!result) { return; }
        // reload the grid
        grid.reload(load);
      });
  }

  // discharges a patient if they need to be discharged
  function openPatientDischargeModal(visit) {
    Visits.openAdmission(visit.patient_uuid, false, visit)
      .then(result => {
        if (!result) { return; }
        // reload the grid
        grid.reload(load);
      });
  }

  // patient transfer
  function openTransferModal(row) {
    const location = row.ward_name.concat('/', row.room_label, '/', row.bed_label);
    Visits.openTransferModal({
      patient_visit_uuid : row.uuid,
      patient_uuid : row.patient_uuid,
      patient_display_name : row.display_name,
      location,
    }).then(result => {
      if (!result) { return; }
      // reload the grid
      grid.reload(load);
    });
  }

  // fire up the module
  startup();
}
