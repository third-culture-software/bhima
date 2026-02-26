angular.module('bhima.controllers')
  .controller('MultiPayrollIndiceImportModalController', MultiPayrollIndiceImportModalController);

MultiPayrollIndiceImportModalController.$inject = [
  'data', 'NotifyService', '$uibModalInstance', 'Upload', '$state', 'LanguageService',
];

/**
 *
 * @param data
 * @param Notify
 * @param Instance
 * @param Upload
 * @param $state
 * @param Language
 */
function MultiPayrollIndiceImportModalController(data, Notify, Instance, Upload, $state, Language) {
  const vm = this;

  vm.close = Instance.close;
  vm.param = {};
  vm.configuration = data;

  vm.select = (file) => {
    vm.noSelectedFile = !file;
  };

  vm.submit = () => {
    // send data only when a file is selected
    if (!vm.file) {
      vm.noSelectedFile = true;
      return;
    }

    uploadFile(vm.file);
  };

  /**
   * upload the file to server
   * @param {string} file - name of file to upload
   */
  function uploadFile(file) {
    vm.uploadState = 'uploading';
    const params = {
      url : `/multiple_payroll_indice/upload/${vm.configuration.payroll_configuration_id}?lang=${Language.key}`,
      data : { file },
    };

    // upload the file to the server
    Upload.upload(params)
      .then(handleSuccess, Notify.handleError, handleProgress);

    // success upload handler
    /**
     *
     */
    function handleSuccess() {
      vm.uploadState = 'uploaded';
      Notify.success('FORM.INFO.OPERATION_SUCCESS');
      $state.go('multiple_payroll_indice', null, { reload : true });
      Instance.close();
    }

    // progress handler
    // @TODO : does this work ???  Is it necessary?
    /**
     *
     * @param evt
     */
    function handleProgress(evt) {
      file.progress = Math.min(100, parseInt((100.0 * evt.loaded) / evt.total, 10));
      vm.progressStyle = { width : String(file.progress).concat('%') };
    }
  }
}
