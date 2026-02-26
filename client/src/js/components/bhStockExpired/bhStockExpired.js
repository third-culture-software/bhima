angular.module('bhima.components')
  .component('bhStockExpired', {
    templateUrl : 'js/components/bhStockExpired/bhStockExpired.html',
    controller  : bhStockExpiredController,
    bindings    : {
      depotUuid : '<',
      date : '<?',
    },
  });

bhStockExpiredController.$inject = [
  'StockService', 'moment', 'NotifyService', 'DepotService', '$filter', '$q',
];

/**
 * Stock Expired component
 * @param Stock
 * @param moment
 * @param Notify
 * @param Depots
 * @param $filter
 * @param $q
 */
function bhStockExpiredController(Stock, moment, Notify, Depots, $filter, $q) {
  const $ctrl = this;
  const $date = $filter('date');

  $ctrl.$onInit = () => {
    $ctrl.loading = true;
    $ctrl.expiredInventories = [];

    $q.all([
      fetchExpiredStock(),
      getDepot(),
    ])
      .finally(() => { $ctrl.loading = false; });
  };

  $ctrl.$onChanges = () => {
    $ctrl.loading = true;
    $q.all([
      fetchExpiredStock(),
      getDepot(),
    ])
      .finally(() => { $ctrl.loading = false; });
  };

  /**
   *
   */
  function getDepot() {
    if (!$ctrl.depotUuid) return 0;

    return Depots.read($ctrl.depotUuid)
      .then(depot => {
        $ctrl.depot = depot;
      });
  }

  /**
   * @function fetchExpiredStock()
   * @description
   * Gets expired inventories for a depot
   */
  function fetchExpiredStock() {
    if (!$ctrl.depotUuid) return 0;

    const dateTo = $ctrl.date || new Date();

    // format date into a cacheable format
    const dateToFormatted = $date(dateTo, 'yyyy-MM-dd');

    return Depots.getExpiredStockForDate($ctrl.depotUuid, dateToFormatted)
      .then((inventories) => {
        inventories.forEach(inventory => {
          inventory.expiration_date_raw = $date(inventory.expiration_date);
          inventory.expiration_date_parsed = moment(inventory.expiration_date).fromNow();
        });

        $ctrl.expiredInventories = inventories;
      })
      .catch(Notify.handleError);
  }

}
