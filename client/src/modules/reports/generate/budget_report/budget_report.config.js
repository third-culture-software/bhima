angular.module('bhima.controllers')
  .controller('budget_reportController', BudgetReportController);

BudgetReportController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state', 'SessionService',
];

function BudgetReportController($sce, Notify, SavedReports, AppCache, reportData, $state, Session) {
  const vm = this;
  const cache = new AppCache('configure_budget_report');
  const reportUrl = 'reports/finance/budget_report';

  vm.reportDetails = {
    currency_id : Session.enterprise.currency_id,
    set_number_year : 1,
    filter : 'default',
  };

  vm.reportDetails.include_summary_section = 0;

  vm.previewGenerated = false;
  checkCachedConfiguration();

  vm.onSelectFiscalYear = (fiscalYear) => {
    vm.reportDetails.fiscal_id = fiscalYear.id;
  };

  vm.onSelectCurrency = (currency) => {
    vm.reportDetails.currency_id = currency.id;
  };

  vm.onSelectCronReport = report => {
    vm.reportDetails = angular.copy(report);
  };

  vm.onChangeIncludeSection = value => {
    if (value === 0) {
      vm.reportDetails.cashboxesIds = [];
    }

    vm.reportDetails.include_summary_section = value;
  };

  vm.onSelectCashboxes = (cashboxesIds) => {
    vm.reportDetails.cashboxesIds = cashboxesIds;
  };

  vm.numberYears = [
    { id : 1 }, { id : 2 }, { id : 3 }, { id : 4 }, { id : 5 },
  ];

  vm.preview = function preview(form) {
    if (form.$invalid) { return null; }

    if (vm.reportDetails.include_summary_section === 0) {
      vm.reportDetails.cashboxesIds = [];
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

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.clear = (value) => {
    delete vm.reportDetails[value];
  };

  vm.filterBudget = [
    { value : 'default', label : 'REPORT.BUDGET_REPORT.DISPLAY_ALL_ACCOUNTS' },
    { value : 'hide_title', label : 'REPORT.BUDGET_REPORT.HIDE_TITLE_ACCOUNT' },
    { value : 'show_title', label : 'REPORT.BUDGET_REPORT.SHOW_ONLY_TITLE_ACCOUNT' },
  ];

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
    vm.reportDetails.type = 1;
  }
}
