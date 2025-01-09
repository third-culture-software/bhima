angular.module('bhima.services')
  .service('RubricService', RubricService);

RubricService.$inject = ['PrototypeApiService'];

/**
 * @class RubricService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /rubrics/ URL.
*/
function RubricService(Api) {
  const service = new Api('/rubrics/');

  service.importIndexes = (lang) => {
    const url = service.url.concat('import_indexes');
    return service.$http.post(url, { lang })
      .then(service.util.unwrapHttpResponse);
  };

  service.indexesMap = [
    { id : 'is_base_index', label : 'PAYROLL_RUBRIC.IS_BASE_INDEX' },
    { id : 'is_day_index', label : 'PAYROLL_RUBRIC.IS_DAY_INDEX' },
    { id : 'is_reagistered_index', label : 'PAYROLL_RUBRIC.IS_REAGISTERED_INDEX' },
    { id : 'is_responsability', label : 'PAYROLL_RUBRIC.IS_RESPONSABILITY' },
    { id : 'is_other_responsability', label : 'PAYROLL_RUBRIC.IS_OTHER_RESPONSABILITY' },
    { id : 'is_other_profits', label : 'PAYROLL_RUBRIC.IS_OTHER_PROFIT' },
    { id : 'is_total_code', label : 'PAYROLL_RUBRIC.IS_TOTAL_CODE' },
    { id : 'is_day_worked', label : 'PAYROLL_RUBRIC.IS_DAY_WORKED' },
    { id : 'is_extra_day', label : 'PAYROLL_RUBRIC.IS_EXTRA_DAY' },
    { id : 'is_total_days', label : 'PAYROLL_RUBRIC.IS_TOTAL_DAYS' },
    { id : 'is_pay_rate', label : 'PAYROLL_RUBRIC.IS_PAY_RATE' },
    { id : 'is_performance_rate', label : 'PAYROLL_RUBRIC.IS_PERFORMANCE_RATE' },
    { id : 'is_gross_salary', label : 'PAYROLL_RUBRIC.IS_GROSS_SALARY' },
    { id : 'is_number_of_days', label : 'PAYROLL_RUBRIC.IS_NUMBER_OF_DAYS' },
    { id : 'is_seniority_index', label : 'PAYROLL_RUBRIC.SENIORITY_INDEX' },
    { id : 'is_relative_point', label : 'PAYROLL_RUBRIC.RELATIVE_POINT' },
    { id : 'is_fixed_bonus', label : 'PAYROLL_RUBRIC.FIXED_BONUS' },
    { id : 'is_performance_bonus', label : 'PAYROLL_RUBRIC.PERFORMANCE_BONUS' },
    { id : 'is_individual_performance', label : 'PAYROLL_RUBRIC.INDIVIDUAL_PERFORMANCE' },
  ];

  // NOTE(@jniles): these are the same definitions as found in payroll/common.js
  service.isBenefitRubric = (rubric) => rubric.is_discount !== 1;
  service.isWithholdingRubric = (rubric) => rubric.is_discount === 1 && rubric.is_employee === 1;
  service.isPayrollTaxRubric = (rubric) => (
    rubric.is_employee !== 1 && rubric.is_discount === 1 && rubric.is_linked_pension_fund === 0
  );
  service.isPensionFundRubric = (rubric) => (
    rubric.is_employee !== 1 && rubric.is_discount === 1 && rubric.is_linked_pension_fund === 1
  );

  // TODO(@jniles) - document these rubric types.
  service.isSocialCareRubric = (rubric) => rubric.is_social_care === 1;
  service.isTaxRubric = (rubric) => rubric.is_tax === 1;
  service.isIndexRubric = rubric => rubric.is_indice === 1;
  service.isMembershipFeeRubric = rubric => rubric.is_membership_fee === 1;
  service.isOtherRubric = rubric => (
    !rubric.is_tax && !rubric.is_social_care && !rubric.is_membership_fee && !rubric.is_indice
  );

  return service;
}
