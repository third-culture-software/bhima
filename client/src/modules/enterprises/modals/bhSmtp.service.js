angular.module('bhima.services')
  .service('SMTPService', SMTPService);

SMTPService.$inject = ['PrototypeApiService', '$uibModal'];

function SMTPService(Api, Modal) {
  const baseUrl = '/smtp/';
  const service = new Api(baseUrl);

  // allows the user to test the SMTP connection before
  // saving to the database.
  service.testConnection = (body) => {
    return service.$http.post(`${baseUrl}test-connection`, body)
      .then(service.util.unwrapHttpResponse);
  };

  // opens the SMTP modal to configure the SMTP settings.
  service.openSMTPModal = () => {
    return Modal.open({
      templateUrl : 'modules/enterprises/modals/bhSmtp-modal.html',
      controller  : 'SMTPModalController as ModalCtrl',
    }).result;
  };

  return service;
}
