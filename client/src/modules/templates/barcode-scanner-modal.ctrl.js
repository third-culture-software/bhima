angular.module('bhima.controllers')
  .controller('BarcodeModalController', BarcodeModalController);

BarcodeModalController.$inject = ['options', '$uibModalInstance'];

/**
 *
 * @param options
 * @param ModalInstance
 */
function BarcodeModalController(options, ModalInstance) {
  const vm = this;
  vm.dismiss = ModalInstance.dismiss;
  vm.options = options;
  vm.title = options.title || 'BARCODE.SCAN_BARCODE';
  vm.label = options.label || 'BARCODE.SCAN_BARCODE';
  vm.onScanCallback = (result) => ModalInstance.close(result);
}
