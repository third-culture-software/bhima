angular.module('bhima.services')
  .service('InstallService', InstallService);

InstallService.$inject = ['$http', 'util'];

// service definition
/**
 *
 * @param $http
 * @param util
 */
function InstallService($http, util) {
  const service = this;

  const baseUrl = '/install';

  /**
   * @function checkStartInstall
   * @description
   * call the server API for checking
   * if the application is already installed or not
   * @returns {boolean}
   */
  service.checkBasicInstallExist = function checkBasicInstallExist() {
    return $http.get(baseUrl).then(util.unwrapHttpResponse);
  };

  /**
   * @param data
   * @function proceedInstall
   * @description
   * proceed to the effective data insertion for the new installation
   */
  service.proceedInstall = function proceedInstall(data) {
    return $http.post(baseUrl, data).then(util.unwrapHttpResponse);
  };
}
