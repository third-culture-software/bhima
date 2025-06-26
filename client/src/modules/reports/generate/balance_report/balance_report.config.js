angular.module('bhima.controllers')
  .controller('balance_reportController', BalanceReportConfigController);

BalanceReportConfigController.$inject = [
  '$sce', 'NotifyService', 'SessionService', 'BaseReportService', 'AppCache', 'reportData', '$state',
];

/**
 * @function BalanceReportConfigController
 *
 * @description
 * This function renders the balance report.
 */
function BalanceReportConfigController($sce, Notify, Session, SavedReports, AppCache, reportData, $state) {
  const vm = this;
  const cache = new AppCache('BalanceReport');
  const reportUrl = 'reports/finance/balance';

  vm.previewGenerated = false;
  vm.reportDetails = {};

  checkCachedConfiguration();

  vm.setCurrency = function setCurrency(currency) {
    vm.reportDetails.currency_id = currency.id;
  };

  vm.onSelectFiscalYear = (fiscalYear) => {
    vm.reportDetails.fiscal_id = fiscalYear.id;
    delete vm.reportDetails.period_id;
  };

  vm.onSelectPeriod = (period) => {
    vm.reportDetails.period_id = period?.id;
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.onChangeLayout = (bool) => {
    vm.reportDetails.useSeparateDebitsAndCredits = bool;
  };

  vm.onChangeEmptyRows = (bool) => {
    vm.reportDetails.shouldPruneEmptyRows = bool;
  };

  vm.onChangeHideTitleAccounts = (bool) => {
    vm.reportDetails.shouldHideTitleAccounts = bool;
  };

  vm.onChangeClosingBalances = bool => {
    // If true, the period is the whole FY, so delete the period
    if (bool) {
      delete vm.reportDetails.period_id;
    }
    vm.reportDetails.includeClosingBalances = bool;
  };

  vm.onSelectCronReport = report => {
    vm.reportDetails = angular.copy(report);
  };

  vm.preview = function preview(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.RECORD_ERROR');
      return 0;
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

  function checkCachedConfiguration() {
    vm.reportDetails = angular.copy(cache.reportDetails || {});

    // Set the defaults
    if (!angular.isDefined(vm.reportDetails.currency_id)) {
      vm.reportDetails.currency_id = Session.enterprise.currency_id;
    }

    if (!angular.isDefined(vm.reportDetails.includeClosingBalances)) {
      vm.reportDetails.includeClosingBalances = 0;
    }
    if (!angular.isDefined(vm.reportDetails.useSeparateDebitsAndCredits)) {
      vm.reportDetails.useSeparateDebitsAndCredits = 1;
    }
    if (!angular.isDefined(vm.reportDetails.shouldPruneEmptyRows)) {
      vm.reportDetails.shouldPruneEmptyRows = 1;
    }
    if (!angular.isDefined(vm.reportDetails.shouldHideTitleAccounts)) {
      vm.reportDetails.shouldHideTitleAccounts = 0;
    }
    if (angular.isDefined(vm.reportDetails.fiscal_id)
        && angular.isDefined(vm.reportDetails.includeClosingBalances)) {
      delete vm.reportDetails.period_id;
    }
  }
}
