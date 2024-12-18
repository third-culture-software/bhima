/**
 * @method commitment
 *
 * This method allows you to browse the list of employees as well as the different Rubrics
 * associated with its employees to return transactions to executes in order to pass
 * the accounting transactions for the wage commitments.
 *
 * @requires debug
 * @requires lib/util
 * @requires lib/db
 */

const debug = require('debug')('payroll:commitments');
const util = require('../../../lib/util');
const db = require('../../../lib/db');

const commitmentFunction = require('./commitmentFunction');
const common = require('./common');

const DECIMAL_PRECISION = 2;
const COMMITMENT_TYPE_ID = 15;
const WITHHOLDING_TYPE_ID = 16;
const PAYROLL_TAXES_TYPE_ID = 17;

/**
 * @function commitments
 *
 * @description
 * This is the default commitment function for configuring payroll.  It is called by the makeCommitment()
 * function.
 *
 * NOTE(@jniles):
 *  - rubrics are all the rubrics for this payment period JOINED on the employees table.
 *  - rubrics config are config_rubric_items attached to the current payroll.
 */
function commitments(employees, rubrics, rubricsConfig, configuration,
  exchangeRates, accountsCostCenter) {

  debug('Using default commitments() handler.');

  const accountPayroll = configuration.account_id;
  const labelPayroll = configuration.label;

  // unwrap configuration object
  const {
    periodPayroll, datePeriodTo,
    currencyId, userId, projectId, postingPensionFundTransactionType,
  } = configuration;

  const descriptionCommitment = `ENGAGEMENT DE PAIE [${periodPayroll}]/ ${labelPayroll}`;
  const descriptionWithholding = `RETENUE DU PAIEMENT [${periodPayroll}]/ ${labelPayroll}`;
  const descriptionPensionFund = `RÉPARTITION DU FONDS DE RETRAITE [${periodPayroll}]/ ${labelPayroll}`;

  const voucherCommitmentUuid = db.uuid();
  const voucherWithholdingUuid = db.uuid();
  const voucherPensionFundAllocationUuid = db.uuid();

  const identificationCommitment = {
    voucherCommitmentUuid,
    voucherWithholdingUuid,
    descriptionCommitment,
    descriptionWithholding,
    voucherPensionFundAllocationUuid,
    descriptionPensionFund,
  };

  // Create a map of exchange rates
  const exchangeRateMap = exchangeRates.reduce((map, exchange) => {
    map[exchange.currency_id] = exchange.rate;
    return map;
  }, {});

  // NOTE(@jniles) both commitment.js and groupedCommitment.js use the .totals
  // key to accummulate rubric values.
  // However, commitmentByEmployee does not use an accumulator and instead
  // uses the rubric values directly.
  rubricsConfig.forEach(item => {
    item.totals = 0;
    rubrics
      .filter(rubric => item.id === rubric.id)
      .forEach(rubric => {
        const exchangeRate = exchangeRateMap[rubric.currency_id] || 1;
        rubric.value /= exchangeRate;
        item.totals += rubric.value;
      });
  });

  // Here we assign for the elements that will constitute the transaction
  // the identifiers of the main and auxiliary centers
  // TODO(@jniles) - shouldn't this be done in the accounts module itself?
  let costCenterPayroll = null;
  accountsCostCenter.forEach(refCostCenter => {
    if (accountPayroll === refCostCenter.account_id) {
      costCenterPayroll = refCostCenter.cost_center_id;
    }
  });

  debug(`Using cost center id ${costCenterPayroll} as the payroll cost center.`);

  // for each set of rubrics, we will go through and classify them as "benefits", "withholdings",
  // "withoutholdings not associated", "payroll taxes" and pension funds
  //  Then we assign cost centers based on their expense accounts or employee accounts, depending on the rubric type

  // only use a subset of rubrics with a positive "totals" field
  const subset = rubricsConfig.filter(rubric => rubric.totals > 0);

  // get rubrics benefits
  const rubricsBenefits = subset.filter(common.isBenefitRubric)
    // associate cost centers with these rubrics, if they exist.
    .map(common.matchCostCenters(accountsCostCenter, 'expense_account_id'));

  // Get Expenses borne by the employees
  const rubricsWithholdings = subset.filter(common.isWithholdingRubric);

  // Get the list of payment Rubrics Not associated with the identifier
  // TODO(@jniles) - figure out what this kind of rubric might be.
  const rubricsWithholdingsNotAssociat = subset
    .filter(rubric => (common.isWithholdingRubric(rubric) && rubric.is_associated_employee !== 1))
    // associate cost centers with these rubrics, if they exist.
    .map(common.matchCostCenters(accountsCostCenter, 'debtor_account_id'));

  // Get payroll taxes
  const payrollTaxes = subset.filter(common.isPayrollTaxRubric)
    // associate cost centers with these rubrics, if they exist.
    .map(common.matchCostCenters(accountsCostCenter, 'expense_account_id'));

  // get enterprise pension funds
  const pensionFunds = subset.filter(common.isPensionFundRubric)
    // associate cost centers with these rubrics, if they exist.
    .map(common.matchCostCenters(accountsCostCenter, 'expense_account_id'));

  debug(`Located applicable rubrics:`);
  debug(`Additional Benefits : ${rubricsBenefits.length} rubrics.`);
  debug(`Salary Withholdings : ${rubricsWithholdings.length} rubrics.`);
  debug(`Withholding (not associated w/ employee): ${rubricsWithholdingsNotAssociat.length} rubrics.`);
  debug(`Payroll Taxes : ${payrollTaxes.length} rubrics.`);
  debug(`Pension Fund Allocation : ${pensionFunds.length} rubrics.`);

  // Compute totals for each rubric categories by adding up the totals.
  const totalPayrollTaxes = common.sumRubricTotals(payrollTaxes);
  const totalPensionFunds = common.sumRubricTotals(pensionFunds);
  const totalWithholdings = common.sumRubricTotals(rubricsWithholdings);

  debug(`Computed total value of associated rubrics:`);
  debug(`Enterprise Charge on Remuneration : ${totalPayrollTaxes}.`);
  debug(`Pension Fund : ${totalPensionFunds} .`);
  debug(`Withholdings : ${totalWithholdings} .`);

  debug(`Running dataCommitment() function`);
  const dataCommitment = commitmentFunction.dataCommitment(
    employees,
    exchangeRates,
    rubrics,
    identificationCommitment,
  );

  const {
    transactions,
    employeesBenefitsItem,
    employeesWithholdingItem,
    employeesPensionFundsItem,
  } = dataCommitment;

  // accumulates the total commitments for all employees.
  const totalCommitments = util.roundDecimal(dataCommitment.totalCommitments, DECIMAL_PRECISION);
  const totalBasicSalaries = util.roundDecimal(dataCommitment.totalBasicSalaries, DECIMAL_PRECISION);
  debug(`Computed total commitments for employees: ${totalCommitments}.`);
  debug(`Computed total basic salaries: ${totalBasicSalaries}.`);

  // helper function to make a clean voucher
  const mkVoucher = () => ({
    date : datePeriodTo,
    project_id : projectId,
    currency_id : currencyId,
    user_id : userId,
  });

  const voucherCommitment = {
    ...mkVoucher(),
    uuid : voucherCommitmentUuid,
    type_id : COMMITMENT_TYPE_ID,
    description : descriptionCommitment,
    amount : totalCommitments,
  };

  // NOTE(@jniles) - why are we adding to the employee benefits items?
  employeesBenefitsItem.push([
    db.uuid(),
    accountPayroll,
    totalBasicSalaries,
    0,
    voucherCommitmentUuid,
    null,
    voucherCommitment.description,
    costCenterPayroll,
  ]);

  rubricsBenefits.forEach(benefits => {
    employeesBenefitsItem.push([
      db.uuid(),
      benefits.expense_account_id,
      benefits.totals,
      0,
      voucherCommitmentUuid,
      null,
      voucherCommitment.description,
      benefits.cost_center_id,
    ]);
  });

  // deal with payroll taxes
  let voucherPayrollTax = {};
  const enterprisePayrollTaxes = [];

  if (payrollTaxes.length) {
    voucherPayrollTax = {
      ...mkVoucher(),
      uuid : db.uuid(),
      type_id : PAYROLL_TAXES_TYPE_ID,
      description : `CHARGES SOCIALES SUR REMUNERATION [${periodPayroll}]/ ${labelPayroll}`,
      amount : util.roundDecimal(totalPayrollTaxes, 2),
    };

    payrollTaxes.forEach(chargeRemuneration => {
      enterprisePayrollTaxes.push([
        db.uuid(),
        chargeRemuneration.debtor_account_id,
        0,
        chargeRemuneration.totals,
        voucherPayrollTax.uuid,
        null,
        null,
      ], [
        db.uuid(),
        chargeRemuneration.expense_account_id,
        chargeRemuneration.totals,
        0,
        voucherPayrollTax.uuid,
        null,
        chargeRemuneration.cost_center_id,
      ]);
    });
  }

  let voucherWithholding = {};
  if (rubricsWithholdings.length) {
    voucherWithholding = {
      ...mkVoucher(),
      uuid : voucherWithholdingUuid,
      type_id : WITHHOLDING_TYPE_ID,
      description : descriptionWithholding,
      amount : util.roundDecimal(totalWithholdings, 2),
    };

    rubricsWithholdingsNotAssociat.forEach(withholding => {
      employeesWithholdingItem.push([
        db.uuid(),
        withholding.debtor_account_id,
        0,
        util.roundDecimal(withholding.totals, 2),
        voucherWithholdingUuid,
        null,
        voucherWithholding.description,
        withholding.cost_center_id,
      ]);
    });
  }

  let voucherPensionFunds = {};
  if (pensionFunds.length) {
    voucherPensionFunds = {
      ...mkVoucher(),
      uuid : voucherPensionFundAllocationUuid,
      type_id : postingPensionFundTransactionType,
      description : descriptionPensionFund,
      amount : util.roundDecimal(totalPensionFunds, 2),
    };

    pensionFunds.forEach(pensionFund => {
      employeesPensionFundsItem.push([
        db.uuid(),
        pensionFund.expense_account_id,
        util.roundDecimal(totalPensionFunds, 2),
        0,
        voucherPensionFundAllocationUuid,
        null,
        voucherPensionFunds.description,
        pensionFund.cost_center_id,
      ]);
    });
  }

  // initialise the transaction handler
  transactions.push({
    query : 'INSERT INTO voucher SET ?',
    params : [voucherCommitment],
  }, {
    query : `INSERT INTO voucher_item (
        uuid, account_id, debit, credit, voucher_uuid, entity_uuid, description, 
        cost_center_id
      ) VALUES ?`,
    params : [employeesBenefitsItem],
  }, {
    query : 'CALL PostVoucher(?);',
    params : [voucherCommitment.uuid],
  });

  if (payrollTaxes.length) {
    transactions.push({
      query : 'INSERT INTO voucher SET ?',
      params : [voucherPayrollTax],
    }, {
      query : `INSERT INTO voucher_item (
        uuid, account_id, debit, credit, voucher_uuid, entity_uuid, cost_center_id) VALUES ?`,
      params : [enterprisePayrollTaxes],
    }, {
      query : 'CALL PostVoucher(?);',
      params : [voucherPayrollTax.uuid],
    });
  }

  if (rubricsWithholdings.length) {
    transactions.push({
      query : 'INSERT INTO voucher SET ?',
      params : [voucherWithholding],
    }, {
      query : `INSERT INTO voucher_item (
          uuid, account_id, debit, credit, voucher_uuid, entity_uuid,
          description, cost_center_id
        ) VALUES ?`,
      params : [employeesWithholdingItem],
    }, {
      query : 'CALL PostVoucher(?);',
      params : [voucherWithholding.uuid],
    });
  }

  if (pensionFunds.length) {
    transactions.push({
      query : 'INSERT INTO voucher SET ?',
      params : [voucherPensionFunds],
    }, {
      query : `INSERT INTO voucher_item (
        uuid, account_id, debit, credit, voucher_uuid, entity_uuid,
        description, cost_center_id
      ) VALUES ?`,
      params : [employeesPensionFundsItem],
    }, {
      query : 'CALL PostVoucher(?);',
      params : [voucherPensionFunds.uuid],
    });
  }

  return transactions;
}

exports.commitments = commitments;
