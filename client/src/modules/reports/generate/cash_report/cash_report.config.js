angular.module('bhima.controllers')
  .controller('cash_reportController', CashReportConfigController);

CashReportConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state', '$translate',
];

/**
 *
 * @param $sce
 * @param Notify
 * @param SavedReports
 * @param AppCache
 * @param reportData
 * @param $state
 * @param $translate
 */
function CashReportConfigController($sce, Notify, SavedReports, AppCache, reportData, $state, $translate) {
  const vm = this;
  const cache = new AppCache('configure_cash_report');
  const reportUrl = 'reports/finance/cash_report';

  vm.previewGenerated = false;
  vm.reportDetails = {};

  vm.reportTypes = [
    { id : 'ENTRY_AND_EXIT', label : 'FORM.LABELS.ENTRY_EXIT' },
    { id : 'ENTRY', label : 'FORM.LABELS.ENTRY' },
    { id : 'EXIT', label : 'FORM.LABELS.EXIT' },
  ];

  vm.reportFormats = [
    { id : 'NORMAL', label : 'FORM.LABELS.CASH_JOURNAL' },
    { id : 'SPLIT', label : 'FORM.LABELS.CASH_SPLIT' },
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
      .catch(err => {
        if (err.data.code && err.data.code === 'TOO_MANY_CASHBOXES_PER_ACCOUNT') {
          // Work-around to construct a more detailed error message
          err.data.code = $translate.instant('CASHBOX.TOO_MANY_CASHBOXES_PER_ACCOUNT',
            { cashboxName : vm.cashboxName });
        }
        Notify.handleError(err);
      });
  };

  vm.onSelectCashbox = function onSelectCashbox(cashbox) {
    vm.reportDetails.account_id = cashbox.account_id;
    vm.cashboxName = cashbox.hrlabel;
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

  /**
   *
   */
  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);
    }

    // Set the defaults for the format and type
    if (!angular.isDefined(vm.reportDetails.format)) {
      vm.reportDetails.format = vm.reportFormats[0].id;
    }

    if (!angular.isDefined(vm.reportDetails.type)) {
      vm.reportDetails.type = vm.reportTypes[0].id;
    }
  }
}
