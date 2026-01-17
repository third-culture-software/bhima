angular.module('bhima.services')
  .service('InventoryGroupService', InventoryGroupService);

/** Dependencies infection */
InventoryGroupService.$inject = ['$http', 'util'];

/** Inventory Group Service */
function InventoryGroupService($http, util) {
  const service = this;

  const baseUrl = '/inventory/groups/';

  // exposed methods
  service.read = read;
  service.update = update;
  service.create = create;
  service.remove = remove;
  service.count = count;
  service.coefficientSetting = coefficientSetting;

  /** create inventory group */
  function create(record) {
    return $http.post(baseUrl, record)
      .then(util.unwrapHttpResponse);
  }

  /** get inventory groups */
  function read(uuid, options) {
    const url = baseUrl.concat(uuid || '');
    return $http.get(url, { params : options })
      .then(util.unwrapHttpResponse);
  }

  /** udate an existing inventory group */
  function update(uuid, record) {
    return $http.put(baseUrl.concat(uuid || ''), record)
      .then(util.unwrapHttpResponse);
  }

  /** delete an existing inventory group */
  function remove(uuid) {
    return $http.delete(baseUrl.concat(uuid))
      .then(util.unwrapHttpResponse);
  }

  /** count inventory in groups */
  function count(uuid) {
    return $http.get(baseUrl.concat(uuid, '/count'))
      .then(util.unwrapHttpResponse);
  }

  function coefficientSetting(data) {
    return $http.post(`/inventory/coefficient_setting`, data)
      .then(util.unwrapHttpResponse);
  }
}
