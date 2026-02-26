angular.module('bhima.controllers')
  .controller('EditLotModalController', EditLotModalController);

// dependencies injections
EditLotModalController.$inject = [
  'data', 'SessionService', 'LotService', 'InventoryService', 'NotifyService', '$uibModalInstance',
];

/**
 *
 * @param Data
 * @param Session
 * @param Lots
 * @param Inventory
 * @param Notify
 * @param Instance
 */
function EditLotModalController(Data, Session, Lots, Inventory, Notify, Instance) {
  const vm = this;
  vm.model = {};

  vm.enterprise = Session.enterprise;
  vm.onDateChange = onDateChange;
  vm.onSelectTags = onSelectTags;
  vm.onSelectFundingSource = onSelectFundingSource;
  vm.cancel = Instance.dismiss;
  vm.submit = submit;
  vm.stockSettings = Session.stock_settings;

  vm.trackingExpiration = true;

  /**
   *
   */
  function startup() {
    Lots.read(Data.uuid)
      .then(lot => {
        vm.model = lot;
        return Inventory.read(lot.inventory_uuid);
      }).then(inventory => {
        vm.trackingExpiration = inventory.tracking_expiration;
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param date
   */
  function onDateChange(date) {
    vm.model.expiration_date = date;
  }

  /**
   *
   * @param tags
   */
  function onSelectTags(tags) {
    vm.model.tags = tags;
  }

  /**
   *
   * @param fundingSource
   */
  function onSelectFundingSource(fundingSource) {
    vm.fundingSource = fundingSource;
    vm.model.funding_source_uuid = fundingSource.uuid;
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return 0; }

    return Lots.update(Data.uuid, vm.model)
      .then(() => {
        Notify.success('LOTS.SUCCESSFULLY_EDITED');
        Instance.close(true);
      })
      .catch(Notify.handleError);
  }

  startup();
}
