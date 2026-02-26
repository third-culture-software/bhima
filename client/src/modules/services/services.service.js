angular.module('bhima.services')
  .service('ServiceService', ServiceService);

ServiceService.$inject = ['PrototypeApiService'];

/**
 *
 * @param Api
 */
function ServiceService(Api) {
  const service = new Api('/services/');
  const baseUrl = '/services/';

  service.create = create;
  service.count = count;
  service.update = update;

  /**
   *
   */
  function count() {
    const url = baseUrl.concat('count');
    return service.$http.get(url)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   *
   * @param data
   */
  function create(data) {
    delete data.cost_center_name;
    return Api.create.call(service, data);
  }

  /**
   *
   * @param uuid
   * @param data
   */
  function update(uuid, data) {
    delete data.abbr;
    delete data.uuid;
    delete data.cost_center_name;
    delete data.enterprise_name;
    delete data.profit_center_name;
    delete data.project_name;
    delete data.enterprise_id;

    return Api.update.call(service, uuid, data);
  }

  return service;
}
