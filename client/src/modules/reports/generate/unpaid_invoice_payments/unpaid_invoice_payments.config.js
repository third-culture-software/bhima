angular.module('bhima.controllers')
  .controller('unpaid_invoice_paymentsController', UnbalancedInvoicePaymentsConfigController);

UnbalancedInvoicePaymentsConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state',
  'SessionService',
];

/**
 *
 * @param $sce
 * @param Notify
 * @param SavedReports
 * @param AppCache
 * @param reportData
 * @param $state
 * @param Session
 */
function UnbalancedInvoicePaymentsConfigController($sce, Notify, SavedReports, AppCache, reportData, $state, Session) {
  const vm = this;
  const cache = new AppCache('configure_unpaid_invoice_payments');
  const reportUrl = 'reports/finance/unpaid_invoice_payments';

  vm.previewGenerated = false;
  vm.reportDetails = {
    currencyId : Session.enterprise.currency_id,
  };

  checkCachedConfiguration();

  vm.onSelectDebtorGroup = (debtorGroup) => {
    vm.reportDetails.debtorGroupName = debtorGroup.name;
    vm.reportDetails.debtorGroupUuid = debtorGroup.uuid;
  };

  vm.onSelectCronReport = report => {
    vm.reportDetails = angular.copy(report);
  };

  vm.onSelectCurrency = currency => {
    vm.reportDetails.currencyId = currency.id;
  };

  vm.onClear = () => {
    delete vm.reportDetails.debtorGroupName;
    delete vm.reportDetails.debtorGroupUuid;
  };

  vm.clear = (key) => {
    delete vm.reportDetails[key];
  };

  vm.onSelectService = service => {
    vm.reportDetails.serviceUuid = service.uuid;
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
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

  vm.preview = function preview(form) {
    if (form.$invalid) { return 0; }

    cache.reportDetails = angular.copy(vm.reportDetails);

    const sendDetails = angular.copy(vm.reportDetails);

    return SavedReports.requestPreview(reportUrl, reportData.id, sendDetails)
      .then((result) => {

        // update cached configuration
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
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
  }
}
