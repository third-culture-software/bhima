/**
 * @method commitment
 *
 * This method allows you to browse the list of employees as well as the different Rubrics
 * associated with its employees to return transactions to executes in order to pass
 * the accounting transactions for the wage commitments.
 *
 * @requires moment
 * @requires debug
 * @requires lib/util
 * @requires lib/db
 */

const moment = require('moment');
const debug = require('debug')('payroll:commitments');
const util = require('../../../lib/util');
const db = require('../../../lib/db');

const commitmentFunction = require('./commitmentFunction');
const common = require('./common');
const { assignCostCenterParams } = require('../../finance/cost_center');

const DECIMAL_PRECISION = 2;
const COMMITMENT_TYPE_ID = 15;
const WITHHOLDING_TYPE_ID = 16;
const CHARGES_TYPE_ID = 17;

/**
 * @function commitments
 *
 * @description
 * This is the default commitment function for configuring payroll.  It is called by the makeCommitment()
 * function.
 *
 */
function commitments(employees, rubrics, rubricsConfig, configuration,
  projectId, userId, exchangeRates, currencyId, accountsCostCenter, postingPensionFundTransactionType) {

  // this comes from the enterprise settings pension transaction type
  // TODO(@jniles) - this could be looked up (and maybe should be) using the
  // enterpise ID. to reduce the complexity of the function call signature by removing the last parameter.
  const TRANSACTION_TYPE = postingPensionFundTransactionType;

  debug('Using default commitments() handler.');

  const accountPayroll = configuration[0].account_id;
  const periodPayroll = moment(configuration[0].dateTo).format('MM-YYYY');
  const datePeriodTo = moment(configuration[0].dateTo).format('YYYY-MM-DD');
  const labelPayroll = configuration[0].label;

  const descriptionCommitment = `ENGAGEMENT DE PAIE [${periodPayroll}]/ ${labelPayroll}`;
  const descriptionWithholding = `RETENUE DU PAIEMENT [${periodPayroll}]/ ${labelPayroll}`;
  const descriptionPensionFund = `RÉPARTITION DU FONDS DE RETRAITE [${periodPayroll}]/ ${labelPayroll}`;

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

  // NOTE(@jniles) both commitment.js and groupedCommitment.js use the .totals
  // key to accummulate rubric values.
  // However, commitmentByEmployee does not use an accumulator and instead
  // uses the trubic values directly.
  rubricsConfig.forEach(item => {
    item.totals = 0;
    rubrics
      .filter(rubric => item.id === rubric.id)
      .forEach(rubric => {
        let exchangeRate = 1;
        // {{ exchangeRates }} contains a matrix containing the current exchange rate of all currencies
        // against the currency of the Enterprise
        exchangeRates.forEach(exchange => {
          exchangeRate = parseInt(exchange.currency_id, 10) === parseInt(rubric.currency_id, 10)
            ? exchange.rate : exchangeRate;
        });

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
  // "withoutholdings not associated", "Remunerations"
  //  Then we assign cost centers based on their expense accounts or employee accounts.

  // Get Rubrics benefits
  let rubricsBenefits = rubricsConfig.filter(common.isBenefitRubic);

  // Get Expenses borne by the employees
  const rubricsWithholdings = rubricsConfig.filter(common.isWitholdingRubric);

  // Get the list of payment Rubrics Not associated with the identifier
  // TODO(@jniles) - figure out what this kind of rubric might be.
  let rubricsWithholdingsNotAssociat = rubricsConfig
    .filter(rubric => (common.isWitholdingRubric(rubric) && rubric.is_associated_employee !== 1));

  // Get Enterprise charge on remuneration
  let chargesRemunerations = rubricsConfig.filter(common.isPayrollTaxRubric);

  // Get Enterprise Pension funds
  let pensionFunds = rubricsConfig.filter(common.isPensionFundRubric);

  debug(`Located applicable rubrics:`);
  debug(`Additional Benefits : ${rubricsBenefits.length} rubrics.`);
  debug(`Salary Withholdings : ${rubricsWithholdings.length} rubrics.`);
  debug(`Withholding (not associated w/ employee): ${rubricsWithholdingsNotAssociat.length} rubrics.`);
  debug(`Payroll Taxes : ${chargesRemunerations.length} rubrics.`);
  debug(`Pension Fund Allocation : ${pensionFunds.length} rubrics.`);

  // Assign Cost Center Params
  rubricsBenefits = assignCostCenterParams(accountsCostCenter, rubricsBenefits, 'expense_account_id');

  // TODO(@jniles) - combine these cost center allocation function into the main declaration of the array
  // to reduce complexity.  Idealy, it should be .filter().map().
  chargesRemunerations = assignCostCenterParams(
    accountsCostCenter, chargesRemunerations, 'expense_account_id',
  );

  pensionFunds = assignCostCenterParams(
    accountsCostCenter, pensionFunds, 'expense_account_id',
  );

  rubricsWithholdingsNotAssociat = assignCostCenterParams(
    accountsCostCenter, rubricsWithholdingsNotAssociat, 'debtor_account_id',
  );

  // Compute totals for each rubric categories by adding up the totals.
  const totalChargesRemuneration = common.sumRubricTotals(chargesRemunerations);
  const totalPensionFunds = common.sumRubricTotals(pensionFunds);
  const totalWithholdings = common.sumRubricTotals(rubricsWithholdings);

  debug(`Computed total value of associated rubrics:`);
  debug(`Enterprise Charge on Remuneration : ${totalChargesRemuneration}.`);
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

  // Social charge on remuneration
  let voucherChargeRemuneration = {};
  const enterpriseChargeRemunerations = [];

  if (chargesRemunerations.length) {
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
      ], [
        db.uuid(),
        chargeRemuneration.expense_account_id,
        chargeRemuneration.totals,
        0,
        voucherChargeRemunerationUuid,
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
      type_id : TRANSACTION_TYPE,
      description : descriptionPensionFund,
      amount : util.roundDecimal(totalPensionFunds, 2),
    };

    pensionFunds.forEach(pensionFund => {
      employeesPensionFundsItem.push([
        db.uuid(),
        pensionFunds[0].expense_account_id,
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

  if (chargesRemunerations.length) {
    transactions.push({
      query : 'INSERT INTO voucher SET ?',
      params : [voucherChargeRemuneration],
    }, {
      query : `INSERT INTO voucher_item (
        uuid, account_id, debit, credit, voucher_uuid, entity_uuid, cost_center_id) VALUES ?`,
      params : [enterpriseChargeRemunerations],
    }, {
      query : 'CALL PostVoucher(?);',
      params : [voucherChargeRemuneration.uuid],
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
