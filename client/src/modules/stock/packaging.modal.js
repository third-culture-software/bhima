angular.module('bhima.controllers')
  .controller('StockDefinePackagingModalController', StockDefinePackagingModalController);

StockDefinePackagingModalController.$inject = [
  '$uibModalInstance', 'data', 'SessionService', 'CurrencyService', 'NotifyService',
  'StockEntryModalForm', 'bhConstants',
];

/**
 *
 * @param Instance
 * @param Data
 * @param Session
 * @param Currencies
 * @param Notify
 * @param EntryForm
 * @param bhConstants
 */
function StockDefinePackagingModalController(
  Instance, Data, Session, Currencies, Notify,
  EntryForm, bhConstants,
) {
  const vm = this;

  // const cache = new AppCache('PackagingModal');

  vm.form = new EntryForm({
    item : Data.item,
  });

  vm.bhConstants = bhConstants;

  vm.enterprise = Session.enterprise;
  vm.stockSettings = Session.stock_settings;
  vm.packaging = angular.copy(Data.item);
  vm.basic = Data.basic;

  if (vm.packaging.package_size) {
    vm.packaging.box_unit_price = vm.packaging.unit_price * vm.packaging.package_size;
    vm.packaging.number_packages = vm.packaging.quantity / vm.packaging.package_size;
  }

  vm.currencyId = Data.currency_id !== undefined
    ? Data.currency_id : vm.enterprise.currency_id;

  // exposing method to the view
  vm.submit = submit;
  vm.cancel = cancel;

  vm.onChangePackageManagement = onChangePackageManagement;

  /**
   *
   */
  function init() {
    // Load the currency info
    Currencies.read()
      .then((currencies) => {
        vm.currency = currencies.find(curr => curr.id === vm.currencyId);
        vm.currency.label = Currencies.format(vm.currencyId);
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function onChangePackageManagement() {
    vm.packaging.quantity = vm.packaging.number_packages * vm.packaging.package_size;
    vm.packaging.unit_price = vm.packaging.box_unit_price / vm.packaging.package_size;
  }

  /**
   *
   */
  function cancel() {
    Instance.close();
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    // unfortunately, a negative number will not trigger the onChange() function
    // on the quantity, since the "min" property is set on the input.  So, we
    // need to through a generic error here.
    if (form.$invalid) {
      return null;
    }

    const promises = [];

    return Promise.all(promises)
      .then(() => {
        Instance.close({
          unit_price : vm.packaging.unit_price,
          quantity : vm.packaging.quantity,
          number_packages : vm.packaging.number_packages,
          package_size : vm.packaging.package_size,
          box_unit_price : vm.packaging.box_unit_price,
        });
      })
      .catch(Notify.handleError);
  }

  init();
}
