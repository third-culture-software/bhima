angular.module('bhima.components')
  .component('bhStockOut', {
    templateUrl : 'js/components/bhStockOut/bhStockOut.html',
    controller  : bhStockOutController,
    bindings    : {
      depotUuid : '<',
      date : '<?',
    },
  });

bhStockOutController.$inject = ['DepotService', 'moment', 'NotifyService', '$filter', '$q'];

/**
 * @param Depots
 * @param moment
 * @param Notify
 * @param $filter
 * @param $q
 * @function bhStockOutController
 * @description
 * Displays a list of out of stock items given a depot and date.
 */
function bhStockOutController(Depots, moment, Notify, $filter, $q) {
  const $ctrl = this;
  const $date = $filter('date');

  $ctrl.$onInit = () => {
    $ctrl.loading = false;
    $ctrl.stockOutInventories = [];

    fetchStockOuts();
  };

  $ctrl.$onChanges = () => {
    fetchStockOuts();
  };

  /**
   * @function fetchStockOuts
   * Get stock out inventories for a depot on a particular date.
   */
  function fetchStockOuts() {
    if (!$ctrl.depotUuid) return;

    const dateTo = $ctrl.date || new Date();
    $ctrl.loading = true;

    // format date
    const dateToFormatted = $date(dateTo, 'yyyy-MM-dd');

    $q.all([
      Depots.getStockOutsForDate($ctrl.depotUuid, dateToFormatted),
      Depots.read($ctrl.depotUuid),
    ])
      .then(([inventories, depot]) => {

        inventories.forEach(inventory => {
          inventory.stock_out_date_raw = $date(inventory.date);
          inventory.stock_out_date_parsed = moment(inventory.date).fromNow();
        });

        $ctrl.depot = depot;
        $ctrl.stockOutInventories = inventories;
      })
      .catch(Notify.handleError)
      .finally(() => {
        $ctrl.loading = false;
      });
  }
}
