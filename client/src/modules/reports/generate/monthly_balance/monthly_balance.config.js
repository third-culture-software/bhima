angular.module('bhima.controllers')
  .controller('monthly_balanceController', monthlyBalanceController);

monthlyBalanceController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state', 'SessionService',
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
function monthlyBalanceController($sce, Notify, SavedReports, AppCache, reportData, $state, Session) {
  const vm = this;
  const cache = new AppCache('monthly_balance');
  const reportUrl = 'reports/finance/monthly_balance';

  vm.previewGenerated = false;
  vm.reportDetails = {
    allAccount : 1,
  };

  vm.onSelectFiscalYear = (fiscalYear) => {
    vm.reportDetails.fiscal_id = fiscalYear.id;
  };

  vm.onSelectPeriod = (period) => {
    vm.reportDetails.period_id = period.id;
    vm.reportDetails.periodLabel = period.hrLabel;
  };

  vm.onSelectCurrency = (currency) => {
    vm.reportDetails.currencyId = currency.id;
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.onSelectAccount = function onSelectAccount(account) {
    vm.account = account;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.RECORD_ERROR');
      return 0;
    }

    if (vm.account) {
      vm.reportDetails.accountNumber = vm.account.number;
      vm.reportDetails.accountLabel = vm.account.label;
      vm.reportDetails.accountId = vm.account.id;
    }

    if (vm.reportDetails.allAccount) {
      vm.reportDetails.accountNumber = null;
      vm.reportDetails.accountLabel = null;
      vm.reportDetails.accountId = null;
    }

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);

    return SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then(result => {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
      })
      .catch(Notify.handleError);
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

  checkCachedConfiguration();

  /**
   *
   */
  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);
    }

    // Set the defaults
    if (!angular.isDefined(vm.reportDetails.currencyId)) {
      vm.reportDetails.currencyId = Session.enterprise.currency_id;
    }

  }
}
