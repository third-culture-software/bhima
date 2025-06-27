angular.module('bhima.controllers')
  .controller('DocumentViewController', DocumentViewController);

DocumentViewController.$inject = [
  'ModalService', '$state', 'DocumentService', 'NotifyService',
];

function DocumentViewController(Modal, $state, Document, Notify) {
  const vm = this;

  // global objects
  vm.patientUuid = $state.params.patient_uuid;

  // expose to the view
  vm.addDocument = addDocument;
  vm.deleteDocument = deleteDocument;

  // startup the view
  listDocument();

  /** function add documents modal */
  function addDocument() {
    Modal.openUploadDocument({ patient_uuid : vm.patientUuid })
      .then(listDocument);
  }

  /** delete document */
  function deleteDocument(uuid) {
    Document.remove(vm.patientUuid, uuid)
      .then(() => {
        Notify.success('FORM.INFO.DELETE_SUCCESS');
        listDocument();
      })
      .catch(Notify.handleError);
  }

  /** getting patient document */
  function listDocument() {
    Document.read(vm.patientUuid)
      .then((documents) => {
        vm.patientDocuments = documents;
      })
      .catch(Notify.handleError);
  }

}
