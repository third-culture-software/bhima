angular.module('bhima.services')
  .service('SystemService', SystemService);

SystemService.$inject = ['$http', 'util'];

/**
 * System Service
 */
function SystemService($http, util) {
  const service = this;
  const baseUrl = '/system';

  // exposed API
  service.information = information;

  function information() {
    return $http.get(baseUrl.concat('/information'))
      .then(util.unwrapHttpResponse);
  }

  return service;
}
