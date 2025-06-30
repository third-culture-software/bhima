angular.module('bhima.controllers')
  .controller('data_kitController', dataKitController);

dataKitController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state', 'SurveyFormService',
  'ChoicesListManagementService',
];

function dataKitController($sce, Notify, SavedReports, AppCache, reportData, $state, SurveyForm,
  ChoicesList) {
  const vm = this;
  const cache = new AppCache('data_kit');
  const reportUrl = '/data_kit/report';
  vm.reportDetails = {};
  vm.reportDetails.searchDateFrom = {};
  vm.reportDetails.searchDateTo = {};
  vm.reportDetails.multipleChoice = {};
  vm.reportDetails.loggedChanges = {};
  vm.onSelectList = onSelectList;
  vm.onSelectMultiple = onSelectMultiple;
  vm.onClear = onClear;

  vm.previewGenerated = false;
  vm.onSelectSurveyForm = onSelectSurveyForm;
  checkCachedConfiguration();

  function onSelectSurveyForm(collector) {
    vm.reportDetails = {};
    vm.reportDetails.searchDateFrom = {};
    vm.reportDetails.searchDateTo = {};
    vm.reportDetails.multipleChoice = {};
    vm.reportDetails.loggedChanges = {};

    vm.reportDetails.data_collector_id = collector.id;
    vm.reportDetails.includePatientData = collector.include_patient_data;

    delete cache.reportDetails;

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

  function onSelectList(list, value) {
    vm.reportDetails[value] = list.id;
    vm.reportDetails.loggedChanges[value] = list.label;
  }

  function onSelectMultiple(lists, value) {
    vm.reportDetails.multipleChoice[value] = lists;
  }

  function onClear(value) {
    delete vm.reportDetails[value];
    delete vm.reportDetails.loggedChanges[value];
  }

  vm.preview = function preview(form) {
    if (form.$invalid) { return; }
    cache.reportDetails = angular.copy(vm.reportDetails);

    angular.forEach(vm.reportDetails.multipleChoice, (values, key) => {
      // values is an array.
      values.forEach((value, index) => {
        vm.choicesLists.forEach(list => {
          if (list.id === value) {
            vm.reportDetails.multipleChoice[key][index] = list.label;
          }
        });
      });
    });

    SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then((result) => {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
      })
      .catch(Notify.handleError);
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;

    angular.forEach(vm.reportDetails.multipleChoice, (values, key) => {
      // values is an array.
      values.forEach((value, index) => {
        vm.choicesLists.forEach(list => {
          if (list.label === value) {
            vm.reportDetails.multipleChoice[key][index] = list.id;
          }
        });
      });
    });
  };

  vm.requestSaveAs = function requestSaveAs() {

    const options = {
      url : reportUrl,
      report : reportData,
      reportOptions : angular.copy(vm.reportDetails),
    };

    return SavedReports.saveAsModal(options)
      .then(() => {
        $state.go('reportsBase.reportsArchive', { key : options.report.report_key });
      })
      .catch(Notify.handleError);
  };

  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);

      if (vm.reportDetails.data_collector_id) {
        SurveyForm.read(null, { data_collector_management_id : vm.reportDetails.data_collector_id })
          .then(surveyElements => {
            vm.formItems = surveyElements;
            return ChoicesList.read();
          })
          .then(choicesLists => {
            vm.choicesLists = choicesLists;
          })
          .catch(Notify.handleError);
      }
    }
    vm.reportDetails.type = 1;
  }
}
