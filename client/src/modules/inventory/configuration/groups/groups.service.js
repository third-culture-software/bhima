angular.module('bhima.services')
  .service('InventoryGroupService', InventoryGroupService);

/** Dependencies infection */
InventoryGroupService.$inject = ['$http', 'util'];

/**
 * Inventory Group Service
 * @param $http
 * @param util
 */
function InventoryGroupService($http, util) {
  const service = this;

  const baseUrl = '/inventory/groups/';

  // exposed methods
  service.read = read;
  service.update = update;
  service.create = create;
  service.remove = remove;
  service.count = count;

  /**
   * create inventory group
   * @param record
   */
  function create(record) {
    return $http.post(baseUrl, record)
      .then(util.unwrapHttpResponse);
  }

  /**
   * get inventory groups
   * @param uuid
   * @param options
   */
  function read(uuid, options) {
    const url = baseUrl.concat(uuid || '');
    return $http.get(url, { params : options })
      .then(util.unwrapHttpResponse);
  }

  /**
   * udate an existing inventory group
   * @param uuid
   * @param record
   */
  function update(uuid, record) {
    return $http.put(baseUrl.concat(uuid || ''), record)
      .then(util.unwrapHttpResponse);
  }

  /**
   * delete an existing inventory group
   * @param uuid
   */
  function remove(uuid) {
    return $http.delete(baseUrl.concat(uuid))
      .then(util.unwrapHttpResponse);
  }

  /**
   * count inventory in groups
   * @param uuid
   */
  function count(uuid) {
    return $http.get(baseUrl.concat(uuid, '/count'))
      .then(util.unwrapHttpResponse);
  }
}
