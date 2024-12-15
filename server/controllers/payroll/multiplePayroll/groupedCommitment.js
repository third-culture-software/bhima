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

const moment = require('moment');
const util = require('../../../lib/util');
const db = require('../../../lib/db');
const commitmentFunction = require('./commitmentFunction');
const CostCenter = require('../../finance/cost_center');

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

  const descriptionCommitment = `ENGAGEMENT DE PAIE [${periodPayroll}]/ ${labelPayroll}`;
  const descriptionWithholding = `RETENUE DU PAIEMENT [${periodPayroll}]/ ${labelPayroll}`;
  const descriptionPensionFund = `RÉPARTITION DU FONDS DE RETRAITE [${periodPayroll}]/ ${labelPayroll}`;

  // create uuids to link
  const voucherCommitmentUuid = db.bid(util.uuid());
  const voucherWithholdingUuid = db.bid(util.uuid());
  const voucherChargeRemunerationUuid = db.bid(util.uuid());
  const voucherPensionFundAllocationUuid = db.bid(util.uuid());

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
  let rubricsBenefits = [];
  let rubricsWithholdings = [];
  let chargesRemunerations = [];
  let pensionFunds = [];
  let rubricsWithholdingsNotAssociat = [];
  let voucherChargeRemuneration = {};
  let voucherPensionFund = {};
  let voucherWithholding = {};
  let totalCommitments = 0;
  let totalChargesRemuneration = 0;
  let totalPensionFund = 0;
  let totalWithholdings = 0;

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

  // Get Rubrics benefits
  rubricsBenefits = rubricsConfig.filter(item => (item.is_discount !== 1 && item.totals > 0));

  // Get Expenses borne by the employees
  rubricsWithholdings = rubricsConfig.filter(item => (item.is_discount && item.is_employee && item.totals > 0));

  // Get the list of payment Rubrics Not associated with the identifier
  rubricsWithholdingsNotAssociat = rubricsConfig.filter(item => (
    item.is_discount && item.is_employee && item.totals > 0 && item.is_associated_employee !== 1));

  // Get Enterprise charge on remuneration
  chargesRemunerations = rubricsConfig.filter(
    item => (item.is_employee !== 1 && item.is_discount === 1 && item.totals > 0 && item.is_linked_pension_fund === 0),
  );

  // Get Pension Found
  pensionFunds = rubricsConfig.filter(
    item => (item.is_employee !== 1 && item.is_discount === 1 && item.totals > 0 && item.is_linked_pension_fund === 1),
  );

  // Assign Cost Center Params
  rubricsBenefits = CostCenter.assignCostCenterParams(accountsCostCenter, rubricsBenefits, 'expense_account_id');

  chargesRemunerations = CostCenter.assignCostCenterParams(
    accountsCostCenter, chargesRemunerations, 'expense_account_id',
  );

  pensionFunds = CostCenter.assignCostCenterParams(
    accountsCostCenter, pensionFunds, 'expense_account_id',
  );

  rubricsWithholdingsNotAssociat = CostCenter.assignCostCenterParams(
    accountsCostCenter, rubricsWithholdingsNotAssociat, 'debtor_account_id',
  );

  chargesRemunerations.forEach(charge => {
    totalChargesRemuneration += charge.totals;
  });

  pensionFunds.forEach(charge => {
    totalPensionFund += charge.totals;
  });

  rubricsWithholdings.forEach(charge => {
    totalWithholdings += charge.totals;
  });

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

  totalCommitments = util.roundDecimal(dataCommitment.totalCommitments, DECIMAL_PRECISION);

  const voucherCommitment = {
    uuid : voucherCommitmentUuid,
    date : datePeriodTo,
    project_id : projectId,
    currency_id : currencyId,
    user_id : userId,
    type_id : COMMITMENT_TYPE_ID,
    description : descriptionCommitment,
    amount : totalCommitments,
  };

  SalaryByCostCenter.forEach(item => {
    employeesBenefitsItem.push([
      db.bid(util.uuid()),
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
        db.bid(util.uuid()),
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
      uuid : voucherChargeRemunerationUuid,
      date : datePeriodTo,
      project_id : projectId,
      currency_id : currencyId,
      user_id : userId,
      type_id : CHARGES_TYPE_ID,
      description : `CHARGES SOCIALES SUR REMUNERATION [${periodPayroll}]/ ${labelPayroll}`,
      amount : util.roundDecimal(totalChargesRemuneration, 2),
    };

    chargesRemunerations.forEach(chargeRemuneration => {
      enterpriseChargeRemunerations.push([
        db.bid(util.uuid()),
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
          db.bid(util.uuid()),
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
      uuid : voucherPensionFundAllocationUuid,
      date : datePeriodTo,
      project_id : projectId,
      currency_id : currencyId,
      user_id : userId,
      type_id : TRANSACTION_TYPE,
      description : `RÉPARTITION DU FONDS DE RETRAITE [${periodPayroll}]/ ${labelPayroll}`,
      amount : util.roundDecimal(totalPensionFund, 2),
    };

    pensionFundCostBreakDown.forEach(item => {
      if (item.value_cost_center_id) {
        employeesPensionFundsItem.push([
          db.bid(util.uuid()),
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
      uuid : voucherWithholdingUuid,
      date : datePeriodTo,
      project_id : projectId,
      currency_id : currencyId,
      user_id : userId,
      type_id : WITHHOLDING_TYPE_ID,
      description : descriptionWithholding,
      amount : util.roundDecimal(totalWithholdings, 2),
    };

    rubricsWithholdingsNotAssociat.forEach(withholding => {
      employeesWithholdingItem.push([
        db.bid(util.uuid()),
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
