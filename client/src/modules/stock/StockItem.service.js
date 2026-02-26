angular.module('bhima.services')
  .service('StockItemService', StockItemService);

StockItemService.$inject = [];

/**
 * @class StockItem
 */
function StockItemService() {
  /**
   * @class StockItem
   */
  function StockItem() {
    this.inventory_uuid = null;
    this.code = null;
    this.label = null;
    this.quantity = 0;
    this.unit_cost = 0;
    this.expiration_date = new Date();
    this.lots = [];
    this.quantity_opening = 0;
    this.total_quantity_entry = 0;
    this.total_quantity_exit = 0;
    this.isValid = false;

    this.validate();
  }

  StockItem.prototype.validate = function validate() {
    this.isValid = this.inventory_uuid && this.lots.length > 0 && this.code;
  };

  // a quick way to merge properties onto the sink if it exists in the source
  /**
   *
   * @param property
   * @param source
   * @param sink
   */
  function mergeIfPropertyExists(property, source, sink) {
    if (angular.isDefined(source[property])) {
      sink[property] = source[property];
    }
  }

  StockItem.prototype.configure = function configure(item) {
    const mergeableProperties = [
      'uuid', 'inventory_uuid', 'code', 'label', 'quantity', 'unit_cost', 'expiration_date', 'lots', 'text',
      'quantity_opening', 'total_quantity_entry', 'total_quantity_exit',
    ];

    mergeableProperties.forEach(prop => mergeIfPropertyExists(prop, item, this));

    this._initialised = true;
  };

  return StockItem;
}
