angular.module('bhima.controllers')
  .controller('patient_standingController', patientStandingController);

patientStandingController.$inject = [
  '$state', '$sce', 'NotifyService', 'BaseReportService', 'AppCache',
  'BaseReportService', 'reportData',
];

/**
 * @param $state
 * @param $sce
 * @param Notify
 * @param BaseReportService
 * @param AppCache
 * @param SavedReports
 * @param reportData
 * @function patientStandingController
 * @description
 */
function patientStandingController($state, $sce, Notify, BaseReportService, AppCache, SavedReports, reportData) {

  const vm = this;
  const cache = new AppCache('configure_patient_standing');
  const reportUrl = '/reports/finance/financial_patient/';

  vm.reportDetails = { patientUuid : '' };

  checkCachedConfiguration();

  vm.requestSaveAs = function requestSaveAs() {
    const targetUrl = reportUrl.concat(vm.reportDetails.patientUuid);
    const options = {
      url : targetUrl,
      report : reportData,
      reportOptions : angular.copy(vm.reportDetails),
    };

    return SavedReports.saveAsModal(options)
      .then(() => {
        $state.go('reportsBase.reportsArchive', { key : options.report.report_key });
      })
      .catch(Notify.handleError);
  };

  // set patient
  vm.setPatient = function setPatient(patient) {
    vm.reportDetails.patientUuid = patient.uuid;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) { return 0; }

    // do not submit if missing a patient
    if (!vm.reportDetails.patientUuid) { return 0; }

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);

    const targetUrl = reportUrl.concat(vm.reportDetails.patientUuid);

    return SavedReports.requestPreview(targetUrl, reportData.id, angular.copy(vm.reportDetails))
      .then(result => {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
      })
      .catch(Notify.handleError);
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  /**
   *
   */
  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);
    }
  }
}
