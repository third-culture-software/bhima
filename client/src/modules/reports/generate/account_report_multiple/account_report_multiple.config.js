angular.module('bhima.controllers')
  .controller('account_report_multipleController', AccountReportMultipleConfigController);

AccountReportMultipleConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData',
  '$state', 'moment', 'SessionService',
];

function AccountReportMultipleConfigController(
  $sce, Notify, SavedReports, AppCache, reportData, $state,
  Moment, Session,
) {
  const vm = this;
  const cache = new AppCache('configure_account_report_multiple');
  const reportUrl = 'reports/finance/account_report_multiple';

  vm.previewGenerated = false;
  vm.reportDetails = {
    accountIds : [],
    includeUnpostedValues : 0,
  };

  checkCachedConfiguration();

  function handleStateParameters() {
    const { data } = reportData.params;

    if (data && data.accountIds) {
      vm.reportDetails.accountIds = data.accountIds;
    }
  }

  vm.dateInterval = 1;

  vm.selectAccount = function selectAccount(account) {
    vm.reportDetails.accountIds.push(account.id);
  };

  vm.onChangeUnpostedValues = (bool) => {
    vm.reportDetails.includeUnpostedValues = bool;
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.setCurrency = function setCurrency(currency) {
    vm.reportDetails.currency_id = currency.id;
  };

  // the selected account number has changed
  // maybe the user has removed a selected account
  vm.onChangeAccounts = function onChangeAccounts(accountId) {
    vm.reportDetails.accountIds = vm.reportDetails.accountIds.filter(id => {
      return id !== accountId;
    });
  };

  vm.requestSaveAs = function requestSaveAs() {
    parseDateInterval(vm.reportDetails);

    const options = {
      url : reportUrl,
      report : reportData,
      reportOptions : sanitiseDateStrings(vm.reportDetails),
    };

    return SavedReports.saveAsModal(options)
      .then(() => {
        $state.go('reportsBase.reportsArchive', { key : options.report.report_key });
      })
      .catch(Notify.handleError);
  };

  vm.preview = function preview(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.RECORD_ERROR');
      return 0;
    }

    parseDateInterval(vm.reportDetails);

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);

    const sendDetails = sanitiseDateStrings(vm.reportDetails);

    return SavedReports.requestPreview(reportUrl, reportData.id, sendDetails)
      .then(result => {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
      })
      .catch(Notify.handleError);
  };

  function sanitiseDateStrings(options) {
    const sanitisedOptions = angular.copy(options);
    sanitisedOptions.dateTo = Moment(sanitisedOptions.dateTo).format('YYYY-MM-DD');
    sanitisedOptions.dateFrom = Moment(sanitisedOptions.dateFrom).format('YYYY-MM-DD');
    return sanitisedOptions;
  }

  // @TODO validation on dates - this should be done through a 'period select' component
  function parseDateInterval(reportDetails) {
    if (!vm.dateInterval) {
      delete reportDetails.dateTo;
      delete reportDetails.dateFrom;
    }
  }

  function checkCachedConfiguration() {
    vm.reportDetails = angular.copy(cache.reportDetails || {});

    // Set the defaults
    if (!angular.isDefined(vm.reportDetails.currency_id)) {
      vm.reportDetails.currency_id = Session.enterprise.currency_id;
    }
  }

  handleStateParameters();
}
