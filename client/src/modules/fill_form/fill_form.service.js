angular.module('bhima.services')
  .service('FillFormService', FillFormService);

FillFormService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class FillFormService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /fill_form/ URL.
 */
function FillFormService(Api) {
  const service = new Api('/fill_form/');

  service.formatData = formatData;
  service.restoreImage = restoreImage;
  service.formatConstraint = formatConstraint;

  /**
   *
   * @param form
   * @param data
   */
  function formatData(form, data) {
    const dataSurveyForm = {};
    // Here we check the occurrence of existing data
    // If they are multiple in order to assign them in tables
    form.forEach(f => {
      data.forEach(d => {
        if ((f.id === d.survey_form_id) && (f.type === '4')) {
          dataSurveyForm[f.name] = [];
        }
      });
    });

    form.forEach(f => {
      data.forEach(d => {
        // For the identifiers of the lists of choices, it is essential to transform it into Integer
        if ((f.id === d.survey_form_id) && (f.type === '4')) {
          // Multiple choice list management
          dataSurveyForm[f.name].push(parseInt(d.value, 10));
        } else if ((f.id === d.survey_form_id) && (f.type !== '4') && (f.type !== '7')) {
          dataSurveyForm[f.name] = parseDataValue(d.value, f.type);
        } else if ((f.id === d.survey_form_id) && (f.type === '7')) {
          // format time
          const newDate = new Date();
          const timeSplit = d.value.split(':');
          dataSurveyForm[f.name] = newDate.setHours(timeSplit[0], timeSplit[1]);
        }
      });
    });

    return dataSurveyForm;
  }

  /**
   *
   * @param data
   */
  function restoreImage(data) {
    return service.$http.post(`/fill_form/restoreImage`, { data })
      .then(service.util.unwrapHttpResponse);
  }

  /**
   *
   * @param value
   * @param type
   */
  function parseDataValue(value, type) {
    switch (type) {
    case '1':
      return parseFloat(value);
    case '3':
      return parseInt(value, 10);
    case '6':
      return new Date(value);
    default:
      return value;
    }
  }

  /*
    * This function is used to format the value of the constraint
    * to a valid angular expression, the value encapsulate in. {} Must be transformed into
    * FillFormModalCtrl.form. and if the eval function
    * is incorrectly evaluates the return function a null value
  */

  /**
   *
   * @param constraint
   */
  function formatConstraint(constraint) {
    let constaintFormated;

    // valueA format the constaint for input type text and number
    let valueA = constraint.replace(/.{/g, `FillFormModalCtrl.form.`);
    valueA = valueA.replace(/}/g, '');

    // valueB format the contraint for input type select one
    let valueB = constraint.replace(/.{/g, `FillFormModalCtrl.containtValue.`);
    valueB = valueB.replace(/}/g, '');

    const checkValidConstraint = /.{/;

    if (checkValidConstraint.test(constraint)) {
      constaintFormated = `(${valueA}) || (${valueB})`;
    } else {
      constaintFormated = null;
    }

    return constaintFormated;
  }

  return service;
}
