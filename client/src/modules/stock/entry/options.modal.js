
angular.module('bhima.controllers')
  .controller('StockEntryOptionsModalController', StockEntryOptionsModalController);

StockEntryOptionsModalController.$inject = [
  '$uibModalInstance', 'AppCache', 'bhConstants'
];

/**
 *
 * @param Modal
 * @param Session
 * @param Data
 * @param AppCache
 * @param bhConstants
 * @param Instance
 */
function StockEntryOptionsModalController(Modal, AppCache, bhConstants) {
  const vm = this;

  const cache = new AppCache('StockEntryModal');

  // save the configuration options in appcache
  vm.local_options = cache.local_options || {};

  vm.bhConstants = bhConstants;
  vm.cancel = () => Modal.close();

  vm.submit = (form) => {
    if (form.$invalid) { return; }

    // save the local_options to the cache
    cache.local_options = vm.local_options;

    Modal.close(vm.options);
  }
};
