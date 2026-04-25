angular.module('bhima.controllers')
  .controller('SMTPModalController', SMTPModalController);

SMTPModalController.$inject = [
  'SessionService', '$uibModalInstance', '$stateParams', 'NotifyService', 'SMTPService',
];

/**
 * @controller SMTPModalController
 * @description Controller for the SMTP configuration modal.
 */
function SMTPModalController(Session, Instance, $stateParams, Notify, SMTP) {
  const vm = this;

  vm.smtp = {};

  /* ------------------------------------------------------------------------ */
  vm.cancel = () => Instance.close(false);
  vm.submit = submit;
  vm.testConnection = testConnection;

  // loads a new set of cashboxes from the server that the user has management right.
  function startup() {
    toggleLoadingIndicator();
    SMTP.read()
      .then(rows => {

        if (rows.length > 0) {
          [vm.smtp] = rows;
        }

        vm.isCreateState = (rows.length === 0);
      })
      .catch(Notify.handleError)
      .finally(toggleLoadingIndicator);
  }

  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  function testConnection() {
    toggleLoadingIndicator();

    SMTP.testConnection(vm.smtp)
      .then(() => {
        Notify.success('SMTP.CONNECTION.SUCCESS');
      })
      .catch(Notify.handleError)
      .finally(toggleLoadingIndicator);
  }

  function submit(form) {
    if (form.$invalid) { return 0; }

    const promise = (vm.isCreateState)
      ? SMTP.create(vm.smtp)
      : SMTP.update(vm.smtp.id, vm.smtp);

    return promise.then(() => {
      const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
      Notify.success(translateKey);
      return Instance.close(true);
    })
      .catch(Notify.handleError);
  }

  // start up the module
  startup();
}
