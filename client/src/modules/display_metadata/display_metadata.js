angular.module('bhima.controllers')
  .controller('DisplayMetadataController', DisplayMetadataController);

DisplayMetadataController.$inject = [
  '$state', 'DisplayMetadataService', 'DataCollectorManagementService', 'NotifyService',
  'uiGridConstants', 'ModalService', 'PatientService', 'util', 'AppCache', 'SurveyFormService', 'ReceiptModal',
  'ChoicesListManagementService',
];

/**
 * DISPLAY METADATA CONTROLLER
 * This module is responsible for handling the CRUD operation on DISPLAY METADATA CONTROLLER
 */

/**
 *
 * @param $state
 * @param DisplayMetadata
 * @param DataCollectorManagement
 * @param Notify
 * @param uiGridConstants
 * @param ModalService
 * @param Patients
 * @param util
 * @param AppCache
 * @param SurveyForm
 * @param Receipts
 * @param ChoicesList
 */
function DisplayMetadataController($state, DisplayMetadata, DataCollectorManagement,
  Notify, uiGridConstants, ModalService, Patients, util, AppCache, SurveyForm, Receipts,
  ChoicesList) {
  const vm = this;
  vm.gridApi = {};
  vm.filterEnabled = false;
  vm.toggleFilter = toggleFilter;
  vm.format = util.formatDate;
  vm.search = search;
  vm.collector = {};
  vm.changes = {};
  vm.displayData = displayData;
  vm.patient = {};
  vm.options = {};
  vm.onRemoveFilter = onRemoveFilter;

  vm.filterElements = {
    defaultFilters : [],
    customFilters : [],
  };

  vm.filterElements.defaultFilters = [];

  vm.downloadPDF = function downloadPDF() {
    vm.options.renderer = 'pdf';
    return DisplayMetadata.download(vm.options);
  };

  const cache = new AppCache('display_metadata');

  ChoicesList.read()
    .then(choicesLists => {
      vm.choicesLists = choicesLists;
    })
    .catch(Notify.handleError);

  if ($state.params.id && $state.params.patient) {
    // Prevent a non-patient form from being used to collect non-patient data
    vm.hasPatientData = true;
  } else {
    vm.hasPatientData = false;

    if (vm.collectorId) {
      loadGrid();
    }
  }

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    showColumnFooter  : true,
    onRegisterApi     : onRegisterApiFn,
    enableHorizontalScrollbar : uiGridConstants.scrollbars.WHEN_NEEDED,
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
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  // bind methods
  vm.edit = edit;
  vm.remove = remove;

  /**
   *
   * @param data
   */
  function edit(data) {
    if (vm.hasPatientData || data.patient_uuid) {
      const includeMedicalSheet = vm.hasPatientData ? 1 : 0;

      $state.go('display_metadata.patientEdit', {
        id : data.data_collector_management_id,
        uuid : data.uuid,
        patient : $state.params.patient || data.patient_uuid,
        include : includeMedicalSheet,
      });
    } else {
      $state.go('display_metadata.edit', { id : data.data_collector_management_id, uuid : data.uuid });
    }
  }

  /**
   *
   * @param uuid
   */
  function remove(uuid) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(() => {
        DisplayMetadata.delete(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadGrid();
          })
          .catch(Notify.handleError);
      });
  }

  // remove a filter with from the filter object, save the filters and reload
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {

    vm.changes = DisplayMetadata.removeFilters(key, vm.changes);
    vm.filterElements.defaultFilters = [];
    vm.filterElements.customFilters = [];

    cache.changes = vm.changes;
    loadGrid();
  }

  /**
   *
   * @param error
   */
  function handleError(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  // load user grid
  /**
   *
   */
  function loadGrid() {
    toggleLoadingIndicator();
    // Reuse cash unless patient data is consulted
    if (cache.collector && !vm.collectorId && !$state.params.patient) {
      vm.collectorId = cache.collector.id;
    }

    const hasNoChanges = Object.keys(vm.changes).length === 0;

    if (hasNoChanges) {
      vm.changes = cache.changes;
    }

    if (!$state.params.id && !vm.collectorId) {
      search();
    } else if (vm.collectorId && !$state.params.id) {
      vm.hasError = false;
      vm.loading = true;

      vm.params = {
        data_collector_management_id : vm.collectorId,
        includePatientData : vm.includePatientData,
        changes : vm.changes,
      };

      SurveyForm.read(null, { data_collector_management_id : vm.collectorId })
        .then((survey) => {
          vm.filterElements.customFilters = DisplayMetadata.displayFilters(survey, vm.changes);
          vm.options = {
            changes : vm.changes,
            data_collector_management_id : vm.collectorId,
            filterClient : vm.filterElements.customFilters,
          };
        })
        .catch(handleError)
        .finally(toggleLoadingIndicator);

      DisplayMetadata.read(null, vm.params)
        .then((data) => {
          data.columns.forEach(item => {
            if (item.field === 'dateSurvey') {
              item.aggregationType = uiGridConstants.aggregationTypes.count;
              item.aggregationHideLabel = true;
            }
          });

          vm.gridOptions.columnDefs = data.columns;
          vm.gridOptions.data = data.surveyData;
        })
        .catch(handleError)
        .finally(toggleLoadingIndicator);

      DataCollectorManagement.read(vm.collectorId)
        .then((collector) => {
          cache.collector = collector;
          cache.changes = vm.changes;
          vm.collector = collector;

          vm.filterElements.defaultFilters.push(
            {
              _key : 'form_name',
              _label : 'FORM.LABELS.FORM',
              _displayValue : vm.collector.label,
              _isCacheable : true,
              _isDefault : true,
              displayValue : vm.collector.label,
              comparitorLabel : ':',
            },
          );
        })
        .catch(handleError)
        .finally(toggleLoadingIndicator);

    } else if ($state.params.id && $state.params.patient) {
      vm.hasError = false;
      vm.loading = true;
      vm.collectorId = $state.params.id;
      // View Patient Form Data
      vm.params = {
        data_collector_management_id : $state.params.id,
        patient_uuid : $state.params.patient,
        changes : vm.changes,
      };

      DisplayMetadata.read(null, vm.params)
        .then((data) => {
          data.columns.forEach(item => {
            if (item.field === 'dateSurvey') {
              item.aggregationType = uiGridConstants.aggregationTypes.count;
              item.aggregationHideLabel = true;
            }
          });
          vm.gridOptions.columnDefs = data.columns;
          vm.gridOptions.data = data.surveyData;
        })
        .catch(handleError)
        .finally(toggleLoadingIndicator);

      DataCollectorManagement.read($state.params.id)
        .then((collector) => {
          vm.collector = collector;
          vm.filterElements.defaultFilters.push(
            {
              _key : 'form_name',
              _label : 'FORM.LABELS.FORM',
              _displayValue : vm.collector.label,
              _isCacheable : true,
              _isDefault : true,
              displayValue : vm.collector.label,
              comparitorLabel : ':',
            },
          );
        })
        .catch(handleError)
        .finally(toggleLoadingIndicator);

      Patients.read($state.params.patient)
        .then((patient) => {
          vm.patient = patient;
        })
        .catch(handleError)
        .finally(toggleLoadingIndicator);

      SurveyForm.read(null, { data_collector_management_id : vm.collectorId })
        .then((survey) => {
          vm.filterElements.customFilters = DisplayMetadata.displayFilters(survey, vm.changes);
          vm.options = {
            changes : vm.changes,
            data_collector_management_id : vm.collectorId,
            filterClient : vm.filterElements,
            patient_uuid : vm.patient.uuid,
            patient : vm.patient,
          };
        })
        .catch(handleError)
        .finally(toggleLoadingIndicator);
    }

  }

  /**
   *
   */
  function toggleLoadingIndicator() {
    vm.loading = false;
  }

  // search Metadata of survey
  /**
   *
   */
  function search() {
    // Prevent the changement of form when hasPatientData is true
    const params = {
      data_collector_management_id : vm.collectorId,
      hasPatientData : vm.hasPatientData,
    };

    DisplayMetadata.openSearchModal(params)
      .then(changes => {
        if (!changes) { return; }

        vm.collectorId = changes.collectorId;
        vm.includePatientData = changes.includePatientData;
        vm.changes = changes;

        vm.filterElements.defaultFilters = [];
        loadGrid();
      });
  }

  /**
   *
   * @param dataUuid
   */
  function displayData(dataUuid) {
    Receipts.displayData(dataUuid, vm.patient, true);
  }

  loadGrid();
}
