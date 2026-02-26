angular.module('bhima.services')
  .service('GradeService', GradeService);

GradeService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class GradeService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /grades/ URL.
 */
function GradeService(Api) {
  return new Api('/grades/');
}
