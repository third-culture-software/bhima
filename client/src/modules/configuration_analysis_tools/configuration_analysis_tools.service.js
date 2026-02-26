angular.module('bhima.services')
  .service('ConfigurationAnalysisToolsService', ConfigurationAnalysisToolsService);

ConfigurationAnalysisToolsService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class ConfigurationAnalysisToolsService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /configuration_analysis_tools/ URL.
 */
function ConfigurationAnalysisToolsService(Api) {
  const service = new Api('/configuration_analysis_tools/');
  service.readType = readType;

  /**
   *
   */
  function readType() {
    return service.$http.get('analysis_tools_type')
      .then(service.util.unwrapHttpResponse);
  }

  return service;
}
