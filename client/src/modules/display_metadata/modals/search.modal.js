angular.module('bhima.controllers')
  .controller('DisplayMetadataSearchModalController', DisplayMetadataSearchModalController);

DisplayMetadataSearchModalController.$inject = [
  '$uibModalInstance', 'Store', 'SurveyFormService', 'NotifyService', 'AppCache',
  'ChoicesListManagementService', 'filters', 'SearchModalUtilService',
];

/**
 * @param ModalInstance
 * @param Store
 * @param SurveyForm
 * @param Notify
 * @param AppCache
 * @param ChoicesList
 * @param filters
 * @param SearchModal
 * @class DisplayMetadataSearchModalController
 * @description
 * This controller is responsible to collecting data from the filter form and
 * returning it as a JSON object to the parent controller.  The data can be
 * preset by passing in a filters object using filtersProvider().
 */
function DisplayMetadataSearchModalController(
  ModalInstance, Store, SurveyForm, Notify, AppCache, ChoicesList, filters,
  SearchModal,
) {
  const vm = this;
  vm.onSelectSurveyForm = onSelectSurveyForm;
  vm.searchQueries = {};
  vm.searchValues = {};
  vm.searchDateFrom = {};
  vm.searchDateTo = {};
  vm.multipleChoice = {};
  vm.onSelectList = onSelectList;
  vm.onSelectMultiple = onSelectMultiple;
  vm.disabled = false;

  const cache = new AppCache('display_metadata_search');

  if (filters) {
    if (filters.hasPatientData) {
      vm.disabled = true;
    }

    onSelectSurveyForm({ id : filters.data_collector_management_id });
  } else if (Object.keys(cache).length) {
    if (cache.collector.id) {
      onSelectSurveyForm(cache.collector);
    }
  }

  /**
   *
   * @param list
   * @param value
   */
  function onSelectList(list, value) {
    vm.searchValues[value] = list.id;
    vm.searchQueries[value] = list.label;
  }

  /**
   *
   * @param lists
   * @param value
   */
  function onSelectMultiple(lists, value) {
    vm.multipleChoice[value] = lists;
  }

  /**
   *
   * @param collector
   */
  function onSelectSurveyForm(collector) {
    vm.searchQueries.data_collector_id = collector.id;
    vm.include_patient_data = collector.include_patient_data;

    SurveyForm.read(null, { data_collector_management_id : collector.id })
      .then(surveyElements => {
        vm.formItems = surveyElements;
        return ChoicesList.read();
      })
      .then(choicesLists => {
        vm.choicesLists = choicesLists;
      })
      .catch(Notify.handleError);
  }
  const changes = new Store({ identifier : 'key' });

  const lastValues = {};

  // displayValues will be an id:displayValue pair
  const displayValues = {};

  vm.cancel = function cancel() { ModalInstance.close(); };

  // submit the filter object to the parent controller.
  vm.submit = function submit(form) {
    if (form.$invalid) { return 0; }

    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastValues);

    const multipleChoiceLength = Object.keys(vm.multipleChoice).length;
    if (multipleChoiceLength) {
      Object.keys(vm.multipleChoice).forEach((key) => {
        for (let i = 0; i < vm.multipleChoice[key].length; i++) {
          vm.choicesLists.forEach(list => {
            if (list.id === vm.multipleChoice[key][i]) {
              vm.multipleChoice[key][i] = list.label;
            }
          });
        }
      });
    }

    const allChanges = {
      loggedChanges,
      collectorId : vm.searchQueries.data_collector_id,
      includePatientData : vm.include_patient_data,
      searchDateFrom : vm.searchDateFrom,
      searchDateTo : vm.searchDateTo,
      multipleChoice : vm.multipleChoice,
    };

    // return values to the controller
    return ModalInstance.close(allChanges);
  };
}
