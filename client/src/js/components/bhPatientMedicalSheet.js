angular.module('bhima.components')
  .component('bhPatientMedicalSheet', {
    controller   : PatientMedicalSheetCtrl,
    templateUrl  : 'modules/patients/record/bh-patient-medical-sheet.html',
    bindings     : {
      patientUuid : '<',
    },
  });

PatientMedicalSheetCtrl.$inject = [
  'DataCollectorManagementService', 'NotifyService', 'uiGridConstants', '$state',
];

/**
 * @param DataCollectorManagement
 * @param Notify
 * @param uiGridConstants
 * @param $state
 * @function PatientMedicalSheetCtrl
 * @description
 * This component is allows
 * to display the different medical sheet to record the Patients Medical Data
 */
function PatientMedicalSheetCtrl(DataCollectorManagement, Notify, uiGridConstants, $state) {
  const $ctrl = this;

  $ctrl.$onInit = function $onInit() {
    $ctrl.gridApi = {};
    $ctrl.filterEnabled = false;
    $ctrl.toggleFilter = toggleFilter;
    $ctrl.consult = consult;

    // options for the UI grid
    $ctrl.gridOptions = {
      appScopeProvider  : $ctrl,
      enableColumnMenus : false,
      fastWatch         : true,
      flatEntityAccess  : true,
      enableSorting     : true,
      onRegisterApi     : onRegisterApiFn,
      columnDefs : [
        {
          field : 'label',
          width : 300,
          displayName : 'FORM.LABELS.DESIGNATION',
          enableFiltering : 'true',
          headerCellFilter : 'translate',
        },
        {
          field : 'description',
          displayName : 'FORM.LABELS.DETAILS',
          enableFiltering : 'true',
          headerCellFilter : 'translate',
        },
        {
          field : 'version_number',
          displayName : 'FORM.LABELS.VERSION',
          width : 100,
          enableFiltering : 'true',
          headerCellFilter : 'translate',
        },
        {
          field : 'action',
          displayName : '',
          width : 100,
          enableFiltering : 'false',
          cellTemplate : '/modules/data_collector_management/templates/consultation.cell.html',
        },
      ],
    };

    /**
     *
     * @param gridApi
     */
    function onRegisterApiFn(gridApi) {
      $ctrl.gridApi = gridApi;
    }

    /**
     *
     */
    function toggleFilter() {
      $ctrl.filterEnabled = !$ctrl.filterEnabled;
      $ctrl.gridOptions.enableFiltering = $ctrl.filterEnabled;
      $ctrl.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
    }

    /**
     *
     * @param error
     */
    function handleError(error) {
      $ctrl.hasError = true;
      Notify.handleError(error);
    }

    // load user grid
    /**
     *
     */
    function loadGrid() {
      $ctrl.hasError = false;
      $ctrl.loading = true;

      DataCollectorManagement.read(null, { is_related_patient : 1 })
        .then((dataCollectorManagement) => {
          $ctrl.gridOptions.data = dataCollectorManagement;
        })
        .catch(handleError)
        .finally(toggleLoadingIndicator);
    }

    /**
     *
     */
    function toggleLoadingIndicator() {
      $ctrl.loading = false;
    }

    /**
     *
     * @param data
     */
    function consult(data) {
      $state.go('display_metadata.patient', { id : data.id, patient : $ctrl.patientUuid });
    }

    loadGrid();
  };
}
