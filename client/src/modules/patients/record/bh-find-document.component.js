angular.module('bhima.components')
  .component('bhFindDocument', {
    controller   : FindDocumentComponent,
    controllerAs : '$ctrl',
    templateUrl  : 'modules/patients/record/bh-find-document.html',
    bindings     : {
      enablePatientDetails : '<', // bind boolean  Enable patient details option
      enableOptionBar      : '<', // bind boolean  Enable option for add, display list or display thumbnail in a bar
      enableSearch         : '<', // bind boolean  Enable search bar option
      display              : '@', // bind (list|thumbnail)  Display either in list or thumbnail mode
      height               : '@', // bind the height of list of contents
      patientUuid          : '<', // Required patient uuid
    },
  });

FindDocumentComponent.$inject = [
  'PatientService', 'ModalService', 'DocumentService', 'NotifyService', 'util',
];

/**
 * Find Document Component
 * This component is responsible for displaying documents for specific patient given
 * @param Patient
 * @param Modal
 * @param Document
 * @param Notify
 * @param util
 */
function FindDocumentComponent(Patient, Modal, Document, Notify, util) {
  const vm = this;

  /** expose to the view */
  vm.switchDisplay = switchDisplay;
  vm.addDocument = addDocument;
  vm.deleteDocument = deleteDocument;
  vm.mimeIcon = util.mimeIcon;

  this.$onInit = function $onInit() {
    vm.session = {
      patientUuid          : this.patientUuid,
      enablePatientDetails : Boolean(this.enablePatientDetails),
      enableOptionBar      : Boolean(this.enableOptionBar),
      enableSearch         : Boolean(this.enableSearch),
      display              : this.display,
      height               : this.height,
      showAction           : false,
    };

    startup();
  };

  /**
   * function switchDisplay
   * @param mode
   */
  function switchDisplay(mode) {
    vm.session.display = mode;
  }

  /** function add documents modal */
  function addDocument() {
    Modal.openUploadDocument({ patient_uuid : vm.session.patientUuid })
      .then(startup);
  }

  /**
   * delete document
   * @param uuid
   * @param pattern
   */
  function deleteDocument(uuid, pattern) {
    const request = {
      pattern,
      patternName : 'FORM.PATTERNS.DOCUMENT_NAME',
    };

    Modal.openConfirmDialog(request)
      .then((ans) => {
        if (!ans) { return; }

        Document.remove(vm.session.patientUuid, uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            startup();
          });
      })
      .catch(Notify.handleError);
  }

  /** getting patient document */
  function startup() {
    if (!vm.session.patientUuid) { return; }

    Patient.read(vm.session.patientUuid)
      .then((patient) => {
        vm.session.patient = patient;
      })
      .catch(Notify.handleError);

    Document.read(vm.session.patientUuid)
      .then((documents) => {
        vm.session.patientDocuments = documents;

        vm.session.patientDocuments.forEach((doc) => {
          doc.downloadLink = doc.label + util.mimeIcon(doc.mimetype).ext;
          doc.icon = util.mimeIcon(doc.mimetype).icon;
          doc.type = util.mimeIcon(doc.mimetype).label;
        });
      })
      .catch(Notify.handleError);
  }
}
