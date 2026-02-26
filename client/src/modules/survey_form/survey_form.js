angular.module('bhima.controllers')
  .controller('SurveyFormController', SurveyFormController);

SurveyFormController.$inject = [
  '$state', 'SurveyFormService', 'NotifyService', 'uiGridConstants', 'ModalService', '$translate',
];

/**
 * SURVEY FORM Controller
 * This module is responsible for handling the CRUD operation on SURVEY FORM
 */

/**
 *
 * @param $state
 * @param SurveyForm
 * @param Notify
 * @param uiGridConstants
 * @param ModalService
 * @param $translate
 */
function SurveyFormController($state, SurveyForm, Notify, uiGridConstants, ModalService, $translate) {
  const vm = this;
  vm.gridApi = {};
  vm.filterEnabled = false;
  vm.toggleFilter = toggleFilter;
  vm.dataCollectorSelect = dataCollectorSelect;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : [
      {
        field : 'rank',
        width : 75,
        displayName : 'FORM.LABELS.RANK',
        headerCellFilter : 'translate',
      },
      {
        field : 'typeChoice',
        displayName : 'FORM.LABELS.TYPE',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
      },
      {
        field : 'name',
        displayName : 'FORM.LABELS.VARIABLE_NAME',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
      },
      {
        field : 'label',
        displayName : 'FORM.LABELS.DESIGNATION',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
      },
      {
        field : 'hint',
        displayName : 'FORM.LABELS.HINT',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
      },
      {
        field : 'required',
        displayName : 'FORM.LABELS.REQUIRED',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/survey_form/templates/required.cell.html',
      },
      {
        field : 'filter_choice_list_id',
        displayName : 'FORM.LABELS.CHOICE_FILTER',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/survey_form/templates/choice_filter.cell.html',
      },
      {
        field : 'constraint',
        displayName : 'FORM.LABELS.CONSTRAINT',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
      },
      {
        field : 'default',
        displayName : 'FORM.LABELS.DEFAULT',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
      },
      {
        field : 'calculation',
        displayName : 'FORM.LABELS.CALCULATION',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
      },
      {
        field : 'action',
        displayName : '',
        enableFiltering : 'false',
        cellTemplate : '/modules/survey_form/templates/action.cell.html',
      },
    ],
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
   * @param surveyForm
   */
  function edit(surveyForm) {
    $state.go('survey_form.edit', { id : surveyForm.id, collectorId : vm.collectorId });
  }

  /**
   *
   * @param id
   */
  function remove(id) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(() => {
        SurveyForm.delete(id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadGrid();
          })
          .catch(Notify.handleError);
      });
  }

  /**
   *
   * @param error
   */
  function handleError(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  /**
   *
   * @param collectorId
   */
  function dataCollectorSelect(collectorId) {
    vm.collectorId = collectorId;

    if (vm.collectorId) {
      loadGrid();
    }
  }

  // load user grid
  /**
   *
   */
  function loadGrid() {
    if (vm.collectorId) {
      toggleLoadingIndicator();
      vm.hasError = false;
      vm.loading = true;
      const otherChoice = $translate.instant('FORM.LABELS.OTHER');

      SurveyForm.read(null, { data_collector_management_id : vm.collectorId })
        .then((surveyForm) => {
          surveyForm.forEach(item => {
            item.typeLabel = $translate.instant(item.typeLabel);
            item.choiceListLabel = $translate.instant(item.choiceListLabel);
            item.other_choice = item.other_choice ? `( ${otherChoice} )` : '';
            item.typeChoice = item.choiceListLabel ? `${item.typeLabel} / ${item.choiceListLabel} ${item.other_choice}`
              : item.typeLabel;
          });

          vm.gridOptions.data = surveyForm;
        })
        .catch(handleError)
        .finally(toggleLoadingIndicator);
    } else {
      vm.gridOptions.data = null;
    }
  }

  /**
   *
   */
  function toggleLoadingIndicator() {
    vm.loading = false;
  }

  loadGrid();
}
