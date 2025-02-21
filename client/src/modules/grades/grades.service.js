angular.module('bhima.services')
  .service('GradeService', GradeService);

GradeService.$inject = ['PrototypeApiService'];

/**
 * @class GradeService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /grades/ URL.
 */
function GradeService(Api) {
  return new Api('/grades/');
}
