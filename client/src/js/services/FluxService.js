angular.module('bhima.services')
  .service('FluxService', FluxService);

// dependencies injection
FluxService.$inject = ['PrototypeApiService', '$translate'];

// service definition
/**
 *
 * @param Api
 * @param $translate
 */
function FluxService(Api, $translate) {
  const service = new Api('/stock/flux');

  service.translate = {
    1  : 'STOCK_FLUX.FROM_PURCHASE',
    2  : 'STOCK_FLUX.FROM_OTHER_DEPOT',
    3  : 'STOCK_FLUX.FROM_ADJUSTMENT',
    4  : 'STOCK_FLUX.FROM_PATIENT',
    5  : 'STOCK_FLUX.FROM_SERVICE',
    6  : 'STOCK_FLUX.FROM_DONATION',
    7  : 'STOCK_FLUX.FROM_LOSS',
    8  : 'STOCK_FLUX.TO_OTHER_DEPOT',
    9  : 'STOCK_FLUX.TO_PATIENT',
    10 : 'STOCK_FLUX.TO_SERVICE',
    11 : 'STOCK_FLUX.TO_LOSS',
    12 : 'STOCK_FLUX.TO_ADJUSTMENT',
    13 : 'STOCK_FLUX.FROM_INTEGRATION',
    14 : 'STOCK_FLUX.INVENTORY_RESET',
    15 : 'STOCK_FLUX.INVENTORY_ADJUSTMENT',
    16 : 'STOCK_FLUX.AGGREGATE_CONSUMPTION',
  };

  /**
   * @function addI18nLabelToItems
   * @description
   * Translates the "label" property into a human readable "plainText" label.
   * @param {Array} items - an array of fluxes
   * @returns {Array} - an array of fluxes with translation label
   */
  service.addI18nLabelToItems = (items) => {
    return items.map(item => {
      item.plainText = $translate.instant(item.label);
      return item;
    });
  };

  return service;
}
