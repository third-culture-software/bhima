angular.module('bhima.controllers')
  .controller('EmailReportController', EmailReportController);

EmailReportController.$inject = [
  '$uibModalInstance', 'NotifyService', 'BaseReportService', 'options',
  'SessionService',
];

/**
 *
 * @param ModalInstance
 * @param Notify
 * @param SavedReports
 * @param options
 * @param Session
 */
function EmailReportController(ModalInstance, Notify, SavedReports, options, Session) {
  const vm = this;

  vm.reportName = options.reportName;

  vm.params = {
    email : Session.user.email,
  };

  vm.submit = function submit(EmailForm) {
    if (EmailForm.$invalid) { return 1; }

    return SavedReports.emailReport(options.uuid, vm.params.email)
      .then(() => {
        ModalInstance.close({ sent : true });
      })
      .catch(Notify.handleError);
  };

  vm.dismiss = function dismiss() {
    ModalInstance.close({ sent : false });
  };
}
