angular.module('bhima.controllers')
  .controller('StockAMCModalController', StockAMCModalController);

StockAMCModalController.$inject = [
  'StockService', 'NotifyService', '$uibModalInstance', 'data', 'moment', 'bhConstants',
];

/**
 *
 * @param Stock
 * @param Notify
 * @param Instance
 * @param data
 * @param moment
 * @param Constants
 */
function StockAMCModalController(Stock, Notify, Instance, data, moment, Constants) {
  const vm = this;

  vm.close = () => Instance.dismiss();

  vm.DATE_FORMAT = Constants.dates.format;

  /**
   *
   */
  function startup() {
    vm.loading = true;

    Stock.inventories.loadAMCForInventory(data.inventory_uuid, data.depot_uuid)
      .then(articles => {
        vm.data = articles;

        vm.settings = vm.data.settings;
        vm.inventory = articles.inventory;
        vm.depot = articles.depot;

        vm.data.avg_consumption = vm.data[vm.settings.average_consumption_algo];

        // calculate date when the stock will run out at current consumption rate
        // NOTE(@jniles): momentjs does not accept decimals as of 2.12.0.  We need to use days, not
        // months
        const daysOfStockLeft = (vm.data.quantity_in_stock / vm.data.avg_consumption) * 30.5;
        vm.data.stock_out_date = moment().add(daysOfStockLeft, 'days').toDate();

        // nicer aliases to use in the HTML
        vm.isAlgoDef = vm.settings.average_consumption_algo === 'algo_def';
        vm.isAlgoMSH = vm.settings.average_consumption_algo === 'algo_msh';
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  startup();
}
