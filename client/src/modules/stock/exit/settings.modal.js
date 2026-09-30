
angular.module('bhima.controllers')
  .controller('StockExitSettingsModalController', StockExitSettingsModalController);

StockExitSettingsModalController.$inject = ['$uibModalInstance', 'SessionService'];

/**
 *
 * @param Modal
 * @param Session
 */
function StockExitSettingsModalController(Modal, Session) {
  const vm = this;

  vm.settings = Session.stock_settings;

  vm.onChangeEnableExpiredStock = (value) => {
    vm.settings.enable_expired_stock= value;
  }

  vm.onChangeEnableOutOfStock = (value) => {
    vm.settings.enable_out_of_stock= value;
  }

  vm.cancel = () => Modal.close();

  vm.submit = (form) => {
    if (form.$invalid) { return; }

    return Modal.close();
  }
};
