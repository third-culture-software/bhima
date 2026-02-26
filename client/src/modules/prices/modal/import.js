angular.module('bhima.controllers')
  .controller('ImportPriceListModalController', ImportPriceListModalController);

ImportPriceListModalController.$inject = [
  'data', '$uibModalInstance', 'InventoryService',
  'Upload', 'NotifyService', 'PriceListService',
];

/**
 *
 * @param data
 * @param Instance
 * @param Inventory
 * @param Upload
 * @param Notify
 * @param PriceList
 */
function ImportPriceListModalController(data, Instance, Inventory, Upload, Notify, PriceList) {
  const vm = this;

  vm.downloadTemplate = Inventory.downloadInventoriesTemplate;
  vm.cancel = Instance.close;
  vm.priceList = data;
  vm.select = (file) => {
    vm.noSelectedFile = !file;
  };

  vm.downloadTemplate = PriceList.downloadTemplate;

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
   * @param file
   */
  function uploadFile(file) {
    vm.uploadState = 'uploading';

    const params = {
      url : '/prices/item/import',
      data : { file, pricelist_uuid : data.uuid },
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
      Notify.success('INVENTORY.UPLOAD_SUCCESS');
      Instance.close();
    }

    // progress handler
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
