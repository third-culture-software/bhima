angular.module('bhima.controllers')
  .controller('AssetEditModalController', AssetEditModalController);

// dependencies injections
AssetEditModalController.$inject = [
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
function AssetEditModalController(Data, Session, Lots, Inventory, Notify, Instance) {
  const vm = this;
  vm.model = {};
  vm.loading = false;

  vm.enterprise = Session.enterprise;
  vm.onSelectFundingSource = onSelectFundingSource;
  vm.onDateChange = onDateChange;
  vm.onSelectTags = onSelectTags;
  vm.cancel = Instance.close;
  vm.submit = submit;

  vm.trackingExpiration = true;

  /**
   *
   */
  function startup() {
    vm.loading = true;
    Lots.read(Data.uuid)
      .then(lot => {
        vm.model = lot;
        return Inventory.read(lot.inventory_uuid);
      }).then(inventory => {
        vm.trackingExpiration = inventory.tracking_expiration;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
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
