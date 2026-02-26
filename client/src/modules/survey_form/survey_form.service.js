angular.module('bhima.services')
  .service('SurveyFormService', SurveyFormService);

SurveyFormService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class SurveyFormService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /survey_form/ URL.
 */
function SurveyFormService(Api) {
  const service = new Api('/survey_form/');
  service.listSurveyformtype = listSurveyformtype;
  service.validVariable = validVariable;

  /**
   *
   */
  function listSurveyformtype() {
    const url = ''.concat('listSurveyformtype');
    return Api.read.call(service, url);
  }

  /**
   *
   * @param variable
   */
  function validVariable(variable) {
    // Regular expression to check if a variable starts only with a string of characters
    const startString = /^[a-zA-Z]/;

    // Regular expression to check if a variable does not have special characters
    const haventSpecial = /^[\w -]+$/;

    // Regular expression to check if Matches a blank (this includes space, tab, line break, or page break).
    const haveSpaceTabulation = /[\s]/;

    return (startString.test(variable) && haventSpecial.test(variable) && !(haveSpaceTabulation.test(variable)));
  }

  return service;
}
