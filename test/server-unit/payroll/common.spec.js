const chai = require('chai');

const { expect } = chai;
const common = require('../../../server/controllers/payroll/multiplePayroll/common');

describe('test/server-unit/payroll/common', () => {
  const costCenters = [{
    account_id : 215,
    cost_center_id : 4,
  }, {
    account_id : 220,
    cost_center_id : 4,
  }, {
    account_id : 242,
    cost_center_id : 1,
  }, {
    account_id : 243,
    cost_center_id : 6,
  }, {
    account_id : 246,
    cost_center_id : 1,
  }, {
    account_id : 249,
    cost_center_id : 1,
  }, {
    account_id : 256,
    cost_center_id : 5,
  }, {
    account_id : 258,
    cost_center_id : 3,
  }, {
    account_id : 343,
    cost_center_id : 4,
  }, {
    account_id : 345,
    cost_center_id : 4,
  }, {
    account_id : 347,
    cost_center_id : 4,
  }, {
    account_id : 347,
    cost_center_id : 1,
  }, {
    account_id : 350,
    cost_center_id : 4,
  }, {
    account_id : 353,
    cost_center_id : 4,
  }, {
    account_id : 354,
    cost_center_id : 4,
    rincipal_center_id : null,
  }, {
    account_id : 355,
    cost_center_id : 4,
  }];

  const rubrics = [{
    configId : 5,
    config_rubric_id : 1,
    rubric_payroll_id : 5,
    PayrollConfig : 'Septembre 2021',
    id : 5,
    label : 'Transport',
    abbr : 'TPR',
    is_employee : 0,
    is_percent : 0,
    is_discount : 0,
    is_tax : 0,
    is_social_care : 1,
    is_defined_employee : 1,
    is_membership_fee : 0,
    debtor_account_id : 179,
    expense_account_id : 358,
    is_ipr : 0,
    is_associated_employee : 0,
    is_seniority_bonus : 0,
    is_family_allowances : 0,
    is_monetary_value : 1,
    position : 0,
    is_indice : 0,
    indice_type : null,
    indice_to_grap : 0,
    value : null,
    totals : 10,
  }, {
    configId : 7,
    config_rubric_id : 1,
    rubric_payroll_id : 7,
    PayrollConfig : 'Septembre 2021',
    id : 7,
    label : 'Indemnité vie chère',
    abbr : 'v_cher',
    is_employee : 0,
    is_percent : 0,
    is_discount : 0,
    is_tax : 0,
    is_social_care : 0,
    is_defined_employee : 1,
    is_membership_fee : 0,
    debtor_account_id : 179,
    expense_account_id : 343,
    is_ipr : 0,
    is_associated_employee : 0,
    is_seniority_bonus : 0,
    is_family_allowances : 0,
    is_monetary_value : 1,
    position : 0,
    is_indice : 0,
    indice_type : null,
    indice_to_grap : 0,
    value : null,
    totals : 15,
  }, {
    configId : 9,
    config_rubric_id : 1,
    rubric_payroll_id : 9,
    PayrollConfig : 'Septembre 2021',
    id : 9,
    label : 'Logement',
    abbr : 'logm',
    is_employee : 0,
    is_percent : 1,
    is_discount : 0,
    is_tax : 0,
    is_social_care : 1,
    is_defined_employee : 0,
    is_membership_fee : 0,
    debtor_account_id : 179,
    expense_account_id : 350,
    is_ipr : 0,
    is_associated_employee : 0,
    is_seniority_bonus : 0,
    is_family_allowances : 0,
    is_monetary_value : 1,
    position : 0,
    is_indice : 0,
    indice_type : null,
    indice_to_grap : 0,
    value : 30,
    totals : 180,
  }];

  it('#sumRubricValues() returns 0 for an empty array', () => {
    expect(common.sumRubricValues([])).to.equal(0);
  });

  it('#sumRubricValues() to return to sum of rubrics\' value field', () => {
    const firstRubric = rubrics[0];
    expect(common.sumRubricValues([firstRubric])).to.equal(0);

    // total value is 30.
    expect(common.sumRubricValues(rubrics)).to.equal(30);
  });

  it('#sumRubricTotals() returns 0 for an empty array', () => {
    expect(common.sumRubricTotals([])).to.equal(0);
  });

  it('#sumRubricTotals() to return to sum of rubrics\' totals field', () => {
    const firstRubric = rubrics[0];

    // first rubric has a total of 10
    expect(common.sumRubricTotals([firstRubric])).to.equal(10);

    // total value is 180 + 10 + 15 = 205
    expect(common.sumRubricTotals(rubrics)).to.equal(205);
  });

  // TODO(@jniles) - Note, we should diversify our test rubrics to include an example of each kind of rubric.

  it('#isBenefitRubric() detects the benefits rubrics', () => {
    const firstRubric = rubrics[0];
    expect(common.isBenefitRubric(firstRubric)).to.equal(true);

    const benefits = rubrics.filter(common.isBenefitRubric);

    expect(benefits).to.have.length(3);
  });

  it('#isWithholdingRubric() detects the withholding rubrics', () => {
    const firstRubric = rubrics[0];
    expect(common.isWithholdingRubric(firstRubric)).to.equal(false);

    const withholdings = rubrics.filter(common.isWithholdingRubric);

    expect(withholdings).to.have.length(0);
  });

  it('#isPayrollTaxRubric() detects the withholding rubrics', () => {
    const firstRubric = rubrics[0];
    expect(common.isPayrollTaxRubric(firstRubric)).to.equal(false);

    const withholdings = rubrics.filter(common.isPayrollTaxRubric);

    expect(withholdings).to.have.length(0);
  });

  it('#isPensionFundRubric() detects the withholding rubrics', () => {
    const firstRubric = rubrics[0];
    expect(common.isPensionFundRubric(firstRubric)).to.equal(false);

    const pensions = rubrics.filter(common.isPensionFundRubric);

    expect(pensions).to.have.length(0);
  });

  it('#matchCostCenters() matches cost centers on the appropriate keys', () => {
    const matcher = common.matchCostCenters(costCenters, 'expense_account_id');

    const result = rubrics.map(matcher);
    expect(result[0].cost_center_id).to.equal(undefined);
    expect(result[1].cost_center_id).to.equal(4);
    expect(result[2].cost_center_id).to.equal(4);
  });

  it('#matchCostCenters() fails gracefully in error cases', () => {
    const emptyCostCenters = common.matchCostCenters([], 'expense_account_id');

    const emptyCostCenterMatches = rubrics.map(emptyCostCenters);
    expect(emptyCostCenterMatches).to.have.length(3);
    expect(emptyCostCenterMatches[1].cost_center_id).to.equal(undefined);

    const nonExistantAccountId = common.matchCostCenters(costCenters, 'nonexistant_account_property');

    const nonExistantAccountIdMatches = rubrics.map(nonExistantAccountId);
    expect(nonExistantAccountIdMatches).to.have.length(3);
    expect(nonExistantAccountIdMatches[1].cost_center_id).to.equal(undefined);
  });

});
