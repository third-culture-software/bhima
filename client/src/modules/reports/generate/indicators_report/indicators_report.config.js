angular.module('bhima.controllers')
  .controller('indicators_reportController', indicatorsReportController);

indicatorsReportController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state',
];

function indicatorsReportController($sce, Notify, SavedReports, AppCache, reportData, $state) {
  const vm = this;
  const cache = new AppCache('indicators_report');
  const reportUrl = '/reports/indicators_report';

  vm.previewGenerated = false;
  vm.reportDetails = {};

  vm.indicatorTypes = [
    { id : 'finances', label : 'TREE.DASHBOARDS.FINANCES' },
    { id : 'hospitalization', label : 'TREE.DASHBOARDS.HOSPITALIZATION' },
    { id : 'staff', label : 'TREE.DASHBOARDS.HUMANS_RESSOURCES' },
  ];

  checkCachedConfiguration();

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) {
      return Notify.danger('FORM.ERRORS.RECORD_ERROR');
    }

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);

    return SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then((result) => {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
      })
      .catch(Notify.handleError);
  };

  vm.onSelectService = service => {
    vm.reportDetails.service_uuid = service.uuid;
  };

  vm.clear = (key) => {
    delete vm.reportDetails[key];
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
    }
  }
}
