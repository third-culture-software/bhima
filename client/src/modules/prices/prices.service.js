angular.module('bhima.services')
  .service('PriceListService', PriceListService);

PriceListService.$inject = ['PrototypeApiService', '$translate'];

/**
 * @param Api
 * @param $translate
 * @class PriceListService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /prices/ URL.
 */
function PriceListService(Api, $translate) {
  const baseUrl = '/prices/';
  const service = new Api(baseUrl);

  service.create = create;
  service.createItem = createItem;
  service.update = update;
  service.details = details;
  service.deleteItem = deleteItem;
  service.download = download;
  service.downloadTemplate = downloadTemplate;
  /**
   * @function create
   * @description
   * This method creates a price list in the database.
   * @param {object} priceList - price list to create
   * @param list
   * @example
   * service.create(priceList)
   * .then(function (res){
   *   your code here
   *  });
   */
  function create(list) {
    return Api.create.call(service, { list });
  }

  /**
   *
   * @param data
   */
  function createItem(data) {
    const url = service.url.concat('item');
    return service.$http.post(url, data)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   *
   * @param uuid
   */
  function deleteItem(uuid) {
    const url = service.url.concat('item/', uuid);
    return service.$http.delete(url)
      .then(service.util.unwrapHttpResponse);
  }
  /**
   * @function update
   * @param {string} uuid -  price list uuid to update
   * @param {object} priceList -  price list to update
   * @param list
   * @example
   * service.update(id, priceList)
   * .then(function (res){
   *   your code here
   *  });
   */
  function update(uuid, list) {
    delete list.created_at;

    return Api.update.call(service, uuid, { list });
  }

  /**
   *
   * @param uuid
   */
  function details(uuid) {
    return service.$http.get(baseUrl.concat(uuid))
      .then(service.util.unwrapHttpResponse);
  }

  /**
   *
   * @param params
   */
  function download(params) {
    const url = service.url.concat('download/list');
    return service.$http.get(url, params)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   *
   */
  function downloadTemplate() {
    const url = service.url.concat('download/template');
    return service.$http.get(url)
      .then(response => {
        return service.util.download(response, $translate.instant('PRICE_LIST.ITEM_TEMPLATE'), 'csv');
      });
  }
  return service;
}
