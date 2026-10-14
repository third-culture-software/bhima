
angular.module('bhima.controllers')
  .controller('StockEntryOptionsModalController', StockEntryOptionsModalController);

StockEntryOptionsModalController.$inject = ['$uibModalInstance', 'SessionService', 'data', 'bhConstants', '$uibModalInstance'];

/**
 *
 * @param Modal
 * @param Session
 */
function StockEntryOptionsModalController(Modal, Session, Data, bhConstants, Instance) {
  const vm = this;

  vm.bhConstants = bhConstants;
  vm.entryType = Data.entry_type;
  vm.settings = Session.stock_settings;
  vm.settings.num_invoices_displayed  = vm.settings.num_invoices_displayed || 0;

  vm.options = {
    enableFastInsert : Data.enableFastInsert,
    editExpirationDates : Data.editExpirationDates,
  };

  vm.allowMultiplePackagingPurchase = false;
  vm.enablePackaging = false;

  vm.isTransfer = (vm.entryType === 'transfer_reception');

  vm.onChangeEnableExpiredStock = (value) => {
    vm.settings.enable_expired_stock = value;
  }

  vm.onChangeEnableOutOfStock = (value) => {
    vm.settings.enable_out_of_stock = value;
  }

  if (vm.enablePackaging && vm.form.rows.length) {
    let numberPackages = 0;

    vm.stockLine.package_size = vm.form.rows[0].package_size;
    vm.stockLine.box_unit_cost = vm.stockLine.package_size * vm.stockLine.unit_cost;

    vm.form.rows.forEach((row) => {
      numberPackages += row.quantity / row.package_size;
    });

    vm.stockLine.number_packages = numberPackages;
  }

  if (vm.enablePackaging && vm.entryType === 'purchase') {
    vm.lockBoxPurchasePrice = true;
    vm.allowMultiplePackagingPurchase = true;
  }

  vm.cancel = () => Modal.close();

  vm.submit = (form) => {
    Instance.close(vm.options);
  }
};
