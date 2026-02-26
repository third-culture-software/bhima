angular.module('bhima.controllers')
  .controller('ImportBudgetModalController', ImportBudgetModalController);

ImportBudgetModalController.$inject = [
  'data', 'BudgetService', '$uibModalInstance',
  'Upload', 'NotifyService', '$translate',
];

/**
 *
 * @param data
 * @param Budget
 * @param Instance
 * @param Upload
 * @param Notify
 * @param $translate
 */
function ImportBudgetModalController(data, Budget, Instance, Upload, Notify, $translate) {
  const vm = this;

  vm.cancel = Instance.close;
  vm.budget = data;
  vm.select = (file) => {
    vm.noSelectedFile = !file;
  };

  vm.breadcrumb = $translate.instant('BUDGET.IMPORT.MODAL_BREADCRUMB', { fiscalYear : vm.budget.year.label });

  vm.downloadTemplate = Budget.downloadTemplate;

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
      url : `/budget/import/${vm.budget.year.id}`,
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
      // Populate the rest of the budget items
      // (after the base budget data is entered eg period = 0)
      Budget.populateBudget(vm.budget.year.id)
        .then(() => {
          return Budget.fillBudget(vm.budget.year.id);
        })
        .then(() => {
          // Finally alert the user of the success
          vm.uploadState = 'uploaded';
          Notify.success($translate.instant('BUDGET.IMPORT.SUCCESS', { fyName : vm.budget.year.label }));
          Instance.close(true);
        });
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
