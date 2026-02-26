angular.module('bhima.services')
  .service('ProjectService', ProjectService);

ProjectService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @function ProjectService
 * @description
 * This service implements basic CRUD functionality on the project table in the
 * backend database.
 */
function ProjectService(Api) {
  const service = new Api('/projects/');
  return service;
}
