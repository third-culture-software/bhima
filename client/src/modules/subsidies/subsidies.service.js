angular.module('bhima.services')
  .service('SubsidyService', SubsidyService);

SubsidyService.$inject = ['$http', 'util'];

/**
 *
 * @param $http
 * @param util
 */
function SubsidyService($http, util) {
  const service = this;
  const baseUrl = '/subsidies/';

  service.read = read;
  service.create = create;
  service.update = update;
  service.delete = del;

  /**
   * @description Get an id (optionnal) and return back a list of subsidies or an subsidy
   * @param {Integer} id, the id of the subsidy (optionnal)
   * @param id
   * @param params
   * @returns {object} a promise object, with the response.body inside.
   * @example
   * service.read()
   * .then(function (subsidies){
   *   your code here
   *  });
   */
  function read(id, params) {
    const url = baseUrl.concat(id || '');
    return $http.get(url, { params })
      .then(util.unwrapHttpResponse);
  }

  /**
   * @description It create an subsidy
   * @param {object} subsidy, subsidy to create
   * @param subsidy
   * @example
   * service.create(subsidy)
   * .then(function (res){
   *   your code here
   *  });
   */
  function create(subsidy) {
    return $http.post(baseUrl, subsidy)
      .then(util.unwrapHttpResponse);
  }

  /**
   * @description It updates an subsidy
   * @param {Integer} id, subsidy id to update
   * @param {object} subsidy, subsidy to update
   * @param id
   * @param subsidy
   * @example
   * service.update(id, subsidy)
   * .then(function (res){
   *   your code here
   *  });
   */
  function update(id, subsidy) {
    const subsidyClean = {
      label : subsidy.label,
      value : subsidy.value,
      account_id : subsidy.account_id,
      description : subsidy.description,
    };

    return $http.put(baseUrl.concat(id), subsidyClean)
      .then(util.unwrapHttpResponse);
  }

  /**
   * @description It Delete a subsidy
   * @param {Integer} id, subsidy id to delete
   * @example
   * service.del(id)
   * .then(function (res){
   *   your code here
   *  });
   */

  /**
   *
   * @param id
   */
  function del(id) {
    return $http.delete(baseUrl + id)
      .then(util.unwrapHttpResponse);
  }

  return service;
}
