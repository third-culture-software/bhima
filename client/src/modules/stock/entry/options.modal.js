
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

  vm.options = {
    enableFastInsert : Data.enableFastInsert,
    editExpirationDates : Data.editExpirationDates,
  };

  vm.cancel = () => Modal.close();

  vm.submit = (form) => {
    Instance.close(vm.options);
  }
};
