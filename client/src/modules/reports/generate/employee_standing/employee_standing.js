angular.module('bhima.controllers')
  .controller('employee_standingController', EmployeeStandingController);

EmployeeStandingController.$inject = [
  '$state', '$sce', 'NotifyService', 'AppCache',
  'BaseReportService', 'reportData', 'SessionService',
];

/**
 * @function EmployeeStandingController
 *
 * @description
 */
function EmployeeStandingController($state, $sce, Notify, AppCache, SavedReports, reportData, Session) {
  const vm = this;
  const cache = new AppCache('configure_employee_standing');

  vm.previewGenerated = false;
  vm.reportDetails = {};

  checkCachedConfiguration();

  // custom filter employee_uuid
  vm.onSelectEmployee = function onSelectEmployee(employee) {
    vm.reportDetails.employee_uuid = employee.uuid;
  };

  vm.setCurrency = function setCurrency(currency) {
    vm.reportDetails.currency_id = currency.id;
  };

  let reportUrl;

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

  vm.onSelectMode = function onSelectMode(modeReport) {
    vm.reportDetails.modeReport = modeReport;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.RECORD_ERROR');
      return 0;
    }

    if (vm.reportDetails.allEmployee) {
      delete vm.reportDetails.employee_uuid;
      delete vm.reportDetails.includeMedicalCare;
      reportUrl = '/reports/finance/all_employees_standing';
    } else if (!vm.reportDetails.allEmployee && vm.reportDetails.employee_uuid) {
      reportUrl = '/reports/finance/employee_standing';
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

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  function checkCachedConfiguration() {
    vm.reportDetails = angular.copy(cache.reportDetails || {});

    // Set the defaults
    if (!angular.isDefined(vm.reportDetails.currency_id)) {
      vm.reportDetails.currency_id = Session.enterprise.currency_id;
    }

    vm.reportDetails.modeReport = 'summary';
  }
}
