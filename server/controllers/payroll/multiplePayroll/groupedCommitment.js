/**
 * @method groupedCommitment
 *
 * This method makes it possible to edit the transactions relating to the payroll of the employees
 * while grouping the expense accounts by Cost Center,
 * with this method the system will generate only three transactions for the whole institution.
 *
 * @requires lib/util
 * @requires lib/db
 * @requires moment
 */

/**
 * Some additional terminology:
 *   * Repartition du fonds de retraite - pension fund allocation
 *   * Charges Sociales sur la remuneration - payroll taxes.
 */

const moment = require('moment');
const debug = require('debug')('payroll:groupedCommitments');
const util = require('../../../lib/util');
const db = require('../../../lib/db');
const commitmentFunction = require('./commitmentFunction');
const common = require('./common');

const COMMITMENT_TYPE_ID = 15;
const WITHHOLDING_TYPE_ID = 16;
const CHARGES_TYPE_ID = 17;
const DECIMAL_PRECISION = 2;

function groupedCommitments(employees, rubrics, rubricsConfig, configuration,
  projectId, userId, exchangeRates, currencyId, accountsCostCenter,
  costBreakDown, SalaryByCostCenter, pensionFundCostBreakDown, postingPensionFundTransactionType) {
  const TRANSACTION_TYPE = postingPensionFundTransactionType;
  const accountPayroll = configuration[0].account_id;

  const periodPayroll = moment(configuration[0].dateTo).format('MM-YYYY');
  const datePeriodTo = moment(configuration[0].dateTo).format('YYYY-MM-DD');
  const labelPayroll = configuration[0].label;

  // helper function to add voucher metadata
  const mkVoucher = () => ({
    date : datePeriodTo,
    project_id : projectId,
    currency_id : currencyId,
    user_id : userId,
  });

  const descriptionCommitment = `ENGAGEMENT DE PAIE [${periodPayroll}]/ ${labelPayroll}`;
  const descriptionWithholding = `RETENUE DU PAIEMENT [${periodPayroll}]/ ${labelPayroll}`;
  const descriptionPensionFund = `RÉPARTITION DU FONDS DE RETRAITE [${periodPayroll}]/ ${labelPayroll}`;
  // this description is for pension funds
  // description : `RÉPARTITION DU FONDS DE RETRAITE [${periodPayroll}]/ ${labelPayroll}`,
  // this description is for charge remunerations
  // description : `CHARGES SOCIALES SUR REMUNERATION [${periodPayroll}]/ ${labelPayroll}`,

  // create uuids to link
  const voucherCommitmentUuid = db.uuid();
  const voucherWithholdingUuid = db.uuid();
  const voucherChargeRemunerationUuid = db.uuid();
  const voucherPensionFundAllocationUuid = db.uuid();

  const identificationCommitment = {
    voucherCommitmentUuid,
    voucherWithholdingUuid,
    voucherChargeRemunerationUuid,
    descriptionCommitment,
    descriptionWithholding,
    voucherPensionFundAllocationUuid,
    descriptionPensionFund,
  };

  const enterpriseChargeRemunerations = [];
  let voucherChargeRemuneration = {};
  let voucherPensionFund = {};
  let voucherWithholding = {};

  // NOTE(@jniles) both commitment.js and groupedCommitment.js use the .totals
  // key to accummulate rubric values.
  // However, commitmentByEmployee does not use an accumulator and instead
  // uses the rubic values directly.
  rubricsConfig.forEach(item => {
    item.totals = 0;
    rubrics.forEach(rubric => {
      let exchangeRate = 1;
      // {{ exchangeRates }} contains a matrix containing the current exchange rate of all currencies
      // against the currency of the Enterprise
      exchangeRates.forEach(exchange => {
        exchangeRate = parseInt(exchange.currency_id, 10) === parseInt(rubric.currency_id, 10)
          ? exchange.rate : exchangeRate;
      });

      if (item.id === rubric.id) {
        rubric.value /= exchangeRate;
        item.totals += rubric.value;
      }
    });
  });

  // for each set of rubrics, we will go through and classify them as "benefits", "withholdings",
  // "withoutholdings not associated", "payroll taxes" and pension funds
  //  Then we assign cost centers based on their expense accounts or employee accounts, depending on the rubric type

  // associate rubrics with cost centers using the "matchAccountId" property on the rubrics.
  const matchCostCenters = (matchAccountId) => ((rubric) => {
    const matchingCostCenter = accountsCostCenter.find(cc => cc.account_id === rubric[matchAccountId]);
    rubric.cost_center_id = matchingCostCenter?.cost_center_id;
    return rubric;
  });

  // Get Rubrics benefits
  const rubricsBenefits = rubricsConfig.filter(common.isBenefitRubric)
    // associate cost centers with these rubrics, if they exist.
    .map(matchCostCenters('expense_account_id'));

  // Get Expenses borne by the employees
  const rubricsWithholdings = rubricsConfig.filter(common.isWitholdingRubric);

  // Get the list of payment Rubrics Not associated with the identifier
  // TODO(@jniles) - figure out what this kind of rubric might be.
  const rubricsWithholdingsNotAssociat = rubricsConfig
    .filter(rubric => (common.isWitholdingRubric(rubric) && rubric.is_associated_employee !== 1))
    // associate cost centers with these rubrics, if they exist.
    .map(matchCostCenters('debtor_account_id'));

  // Get payroll taxes
  const payrollTaxes = rubricsConfig.filter(common.isPayrollTaxRubric)
    // associate cost centers with these rubrics, if they exist.
    .map(matchCostCenters('expense_account_id'));

  // Get Enterprise Pension funds
  const pensionFunds = rubricsConfig.filter(common.isPensionFundRubric)
    // associate cost centers with these rubrics, if they exist.
    .map(matchCostCenters('expense_account_id'));

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

  // get the base data for commitment
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

  const totalCommitments = util.roundDecimal(dataCommitment.totalCommitments, DECIMAL_PRECISION);

  const voucherCommitment = {
    ...mkVoucher(),
    uuid : voucherCommitmentUuid,
    type_id : COMMITMENT_TYPE_ID,
    description : descriptionCommitment,
    amount : totalCommitments,
  };

  SalaryByCostCenter.forEach(item => {
    employeesBenefitsItem.push([
      db.uuid(),
      accountPayroll,
      util.roundDecimal(item.salary_service, DECIMAL_PRECISION),
      0,
      voucherCommitmentUuid,
      null,
      voucherCommitment.description,
      item.cost_center_id,
    ]);
  });

  if (rubricsBenefits.length) {
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
  }

  if (chargesRemunerations.length) {
    // Social charge on remuneration
    voucherChargeRemuneration = {
      ...mkVoucher(),
      uuid : voucherChargeRemunerationUuid,
      type_id : CHARGES_TYPE_ID,
      description : `CHARGES SOCIALES SUR REMUNERATION [${periodPayroll}]/ ${labelPayroll}`,
      amount : util.roundDecimal(totalChargesRemuneration, 2),
    };

    chargesRemunerations.forEach(chargeRemuneration => {
      enterpriseChargeRemunerations.push([
        db.uuid(),
        chargeRemuneration.debtor_account_id,
        0,
        chargeRemuneration.totals,
        voucherChargeRemunerationUuid,
        null,
        null,
      ]);
    });

    costBreakDown.forEach(item => {
      if (item.value_cost_center_id) {
        enterpriseChargeRemunerations.push([
          db.uuid(),
          item.account_expense_id,
          item.value_cost_center_id,
          0,
          voucherChargeRemunerationUuid,
          null,
          item.cost_center_id,
        ]);
      }
    });
  }

  if (pensionFunds.length) {
    // Pension Fund
    voucherPensionFund = {
      ...mkVoucher(),
      uuid : voucherPensionFundAllocationUuid,
      type_id : TRANSACTION_TYPE,
      description : `RÉPARTITION DU FONDS DE RETRAITE [${periodPayroll}]/ ${labelPayroll}`,
      amount : util.roundDecimal(totalPensionFund, 2),
    };

    pensionFundCostBreakDown.forEach(item => {
      if (item.value_cost_center_id) {
        employeesPensionFundsItem.push([
          db.uuid(),
          item.account_expense_id,
          item.value_cost_center_id, // debit
          0, // credit
          voucherPensionFundAllocationUuid,
          null,
          descriptionPensionFund,
          item.cost_center_id,
        ]);
      }
    });
  }

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
        0, // debit
        util.roundDecimal(withholding.totals, 2), // credit
        voucherWithholdingUuid,
        null,
        voucherWithholding.description,
        withholding.cost_center_id,
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

  if (chargesRemunerations.length) {
    transactions.push({
      query : 'INSERT INTO voucher SET ?',
      params : [voucherChargeRemuneration],
    }, {
      query : `INSERT INTO voucher_item
        (uuid, account_id, debit, credit, voucher_uuid, entity_uuid, cost_center_id) VALUES ?`,
      params : [enterpriseChargeRemunerations],
    }, {
      query : 'CALL PostVoucher(?);',
      params : [voucherChargeRemuneration.uuid],
    });
  }

  if (pensionFunds.length) {
    transactions.push({
      query : 'INSERT INTO voucher SET ?',
      params : [voucherPensionFund],
    }, {
      query : `INSERT INTO voucher_item (
        uuid, account_id, debit, credit, voucher_uuid, entity_uuid,
        description, cost_center_id
      ) VALUES ?`,
      params : [employeesPensionFundsItem],
    }, {
      query : 'CALL PostVoucher(?);',
      params : [voucherPensionFund.uuid],
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

  return transactions;
}

exports.groupedCommitments = groupedCommitments;
