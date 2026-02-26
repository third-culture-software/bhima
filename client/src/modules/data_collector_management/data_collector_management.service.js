angular.module('bhima.services')
  .service('DataCollectorManagementService', DataCollectorManagementService);

DataCollectorManagementService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class DataCollectorManagementService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /data_collector_management/ URL.
 */
function DataCollectorManagementService(Api) {
  const service = new Api('/data_collector_management/');

  return service;
}
