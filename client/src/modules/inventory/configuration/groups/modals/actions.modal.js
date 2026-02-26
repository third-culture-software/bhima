angular.module('bhima.controllers')
  .controller('InventoryGroupsActionsModalController', InventoryGroupsActionsModalController);
InventoryGroupsActionsModalController.$inject = [
  'InventoryGroupService', 'NotifyService', '$uibModalInstance', 'data', 'SessionService', 'bhConstants',
];

/**
 *
 * @param InventoryGroups
 * @param Notify
 * @param Instance
 * @param Data
 * @param Session
 * @param Constants
 */
function InventoryGroupsActionsModalController(InventoryGroups, Notify, Instance, Data, Session, Constants) {
  const vm = this;

  vm.INCOME_ACCOUNT_TYPE_ID = Constants.accounts.INCOME;
  vm.EXPENSE_ACCOUNT_TYPE_ID = Constants.accounts.EXPENSE;
  vm.ASSET_ACCOUNT_TYPE_ID = Constants.accounts.ASSET;
  vm.EQUITY_ACCOUNT_TYPE_ID = Constants.accounts.EQUITY;

  // session
  vm.session = {};
  vm.enableAutoStockAccounting = Session.stock_settings.enable_auto_stock_accounting;

  vm.isCreateState = (Data.action === 'add');
  vm.isUpdateState = (Data.action === 'edit');

  // expose to the view
  vm.submit = submit;
  vm.cancel = cancel;

  vm.onSelectCOGSAccount = onSelectCOGSAccount;
  vm.onSelectStockAccount = onSelectStockAccount;
  vm.onSelectSalesAccount = onSelectSalesAccount;

  // startup
  startup();

  /* submit data */
  /**
   *
   * @param form
   */
  function submit(form) {
    const record = cleanForSubmit(vm.session);

    if (form.$invalid) { return 0; }

    let promise;
    if (vm.isCreateState) {
      promise = InventoryGroups.create(record);
    } else {
      promise = InventoryGroups.update(Data.identifier, record);
    }

    return promise
      .then(res => Instance.close(res))
      .catch(Notify.handleError);
  }

  /**
   *
   * @param account
   */
  function onSelectCOGSAccount(account) {
    vm.session.cogs_account = account.id;
  }

  /**
   *
   * @param account
   */
  function onSelectStockAccount(account) {
    vm.session.stock_account = account.id;
  }

  /**
   *
   * @param account
   */
  function onSelectSalesAccount(account) {
    vm.session.sales_account = account.id;
  }

  /* cancel action */
  /**
   *
   */
  function cancel() {
    Instance.dismiss();
  }

  /**
   * format data to data structure in the db
   * @param o
   */
  function cleanForSubmit(o) {
    return {
      name : o.name,
      code : o.code,
      sales_account : o.sales_account,
      stock_account : o.stock_account,
      cogs_account  : o.cogs_account,
      unique_item : o.unique_item,
      tracking_consumption : o.tracking_consumption,
      tracking_expiration : o.tracking_expiration,
      depreciation_rate : o.depreciation_rate,
    };
  }

  /* startup */
  /**
   *
   */
  function startup() {
    if (Data.identifier) {
      InventoryGroups.read(Data.identifier)
        .then((group) => {
          vm.session = group;
        })
        .catch(Notify.handleError);
    }

    if (vm.isCreateState) {
      // by default all inventory (for a group) expires and doesn't have a unique item
      vm.session.tracking_expiration = 1;
      vm.session.tracking_consumption = 1;
      vm.session.unique_item = 0;
    }
  }
}
