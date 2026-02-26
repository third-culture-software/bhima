angular.module('bhima.controllers')
  .controller('PatientDocumentsModalController', PatientDocumentsModalController);

PatientDocumentsModalController.$inject = [
  '$uibModalInstance', 'Upload', 'patientUuid', 'PatientService', 'NotifyService',
];

/**
 *
 * @param Instance
 * @param Upload
 * @param patientUuid
 * @param PatientService
 * @param Notify
 */
function PatientDocumentsModalController(Instance, Upload, patientUuid, PatientService, Notify) {
  const vm = this;

  // globals defaults
  vm.thumbnail = 'assets/placeholder.gif';

  // expose to the view
  vm.setThumbnail = setThumbnail;
  vm.dismiss = dismiss;
  vm.submit = submit;
  vm.close = close;

  // init require data
  PatientService.read(patientUuid)
    .then((patient) => {
      vm.patient = patient;
    })
    .catch(Notify.handleError);

  /** submit data on server */
  function submit() {
    // send data only when a file is selected
    if (vm.file) {
      uploadFile(vm.file);
    } else {
      vm.documentError = true;
    }
  }

  /** close the modal */
  function close() {
    Instance.dismiss('cancel');
  }

  /** dismiss picture */
  function dismiss() {
    vm.file = null;
    vm.uploadState = null;
    setThumbnail();
  }

  /**
   * set thumbnail for the selected image
   * @param file
   */
  function setThumbnail(file) {
    vm.thumbnail = file || 'assets/placeholder.gif';
    vm.documentError = !file;
    vm.isImage = file.type.includes('image/');
  }

  /**
   * upload the file to server
   * @param file
   */
  function uploadFile(file) {
    vm.uploadState = 'uploading';

    const title = vm.title || file.name;
    // rename the file name
    Upload.rename(file, title);

    // upload the file to the server
    Upload.upload({
      url : `/patients/${patientUuid}/documents`,
      data : { documents : file },
    })
      .then(handleSuccess, Notify.handleError, handleProgress);

    // success upload handler
    /**
     *
     */
    function handleSuccess() {
      vm.uploadState = 'uploaded';
      Notify.success('PATIENT_DOCUMENT.UPLOAD_SUCCESS');
      Instance.close();
    }

    // progress handler
    /**
     *
     * @param evt
     */
    function handleProgress(evt) {
      file.progress = Math.min(100, parseInt((100.0 * evt.loaded) / evt.total, 10));
    }
  }
}
