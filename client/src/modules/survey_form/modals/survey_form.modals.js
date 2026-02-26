angular.module('bhima.controllers')
  .controller('SurveyFormModalController', SurveyFormModalController);

SurveyFormModalController.$inject = [
  '$state', 'SurveyFormService', 'NotifyService', 'appcache', 'DataCollectorManagementService', 'params',
];

/**
 * SURVEY FORM Modal Controller
 * @param $state
 * @param SurveyForm
 * @param Notify
 * @param AppCache
 * @param DataCollectorManagement
 * @param params
 */
function SurveyFormModalController($state, SurveyForm, Notify, AppCache, DataCollectorManagement, params) {
  const vm = this;
  const cache = AppCache('SurveyFormModal');

  vm.surveyForm = {};
  vm.stateParams = {};

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;
  vm.clear = clear;
  vm.selectType = selectType;
  vm.onSelectList = onSelectList;
  vm.onSelectSurvey = onSelectSurvey;
  vm.checkVariableName = checkVariableName;
  vm.check = true;

  /**
   *
   * @param type
   */
  function selectType(type) {
    vm.surveyForm.type = type.id;
    vm.selectList = (type.is_list) ? 1 : 0;
    vm.selectOne = ((type.id === 3) && type.is_list) ? 1 : 0;
  }

  /**
   *
   * @param list
   */
  function onSelectList(list) {
    vm.surveyForm.choice_list_id = list.id;
  }

  /**
   *
   * @param survey
   */
  function onSelectSurvey(survey) {
    vm.surveyForm.filter_choice_list_id = survey.id;
  }

  /**
   *
   */
  function checkVariableName() {
    if (vm.surveyForm.name) {
      vm.check = SurveyForm.validVariable(vm.surveyForm.name);
    }
  }

  if (params.collectorId) {
    vm.surveyForm.data_collector_management_id = params.collectorId;

    DataCollectorManagement.read(params.collectorId)
      .then(data => {
        vm.dataCollector = data;
      })
      .catch(Notify.handleError);
  }

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }
  vm.isCreateState = vm.stateParams.isCreateState;

  if (!vm.isCreateState) {
    SurveyForm.read(vm.stateParams.id)
      .then(data => {
        vm.selectList = data.choice_list_id;
        vm.surveyForm = data;

        vm.check = SurveyForm.validVariable(vm.surveyForm.name);
      })
      .catch(Notify.handleError);
  }

  // load SURVEY FORM
  SurveyForm.read()
    .then(surveyForms => {
      vm.surveyForms = surveyForms;
    })
    .catch(Notify.handleError);

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param surveyForm
   */
  function submit(surveyForm) {
    vm.hasNoChange = surveyForm.$submitted && surveyForm.$pristine && !vm.isCreateState;

    if (surveyForm.$invalid || !vm.check) { return null; }
    if (surveyForm.$pristine) { return null; }

    if (parseInt(vm.surveyForm.type, 10) !== 9) {
      vm.surveyForm.calculation = null;
    }

    vm.surveyForm.name = vm.surveyForm.name.trim();

    const promise = (vm.isCreateState)
      ? SurveyForm.create(vm.surveyForm)
      : SurveyForm.update(vm.surveyForm.id, vm.surveyForm);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('survey_form', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param value
   */
  function clear(value) {
    vm.surveyForm[value] = null;
  }

  /**
   *
   */
  function closeModal() {
    $state.go('survey_form');
  }
}
