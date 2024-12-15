/**
 * @method commitmentByEmployee
 *
 * This method makes it possible to edit the transactions relating to the payroll of employees
 * individually by employee, these are the transactions below the engagement,
 * the withholding as well as the social charges on the remuneration.
 *
 * @requires lib/util
 * @requires lib/db
 * @requires moment
 */

const moment = require('moment');
const debug = require('debug')('payroll:commitments');
const util = require('../../../lib/util');
const db = require('../../../lib/db');

const COMMITMENT_TYPE_ID = 15;
const WITHHOLDING_TYPE_ID = 16;
const CHARGES_TYPE_ID = 17;
const DECIMAL_PRECISION = 2;

function commitmentByEmployee(
  employees, rubrics,
  configuration,
  projectId, userId, exchangeRates, currencyId,
  postingPensionFundTransactionType) {

  debug('Setting up transactions for salary commitments, withholdings, and credits by employee.');

  const TRANSACTION_TYPE = postingPensionFundTransactionType;
  const transactions = [];

  const accountPayroll = configuration[0].account_id;
  const periodPayroll = moment(configuration[0].dateTo).format('MM-YYYY');
  const datePeriodTo = moment(configuration[0].dateTo).format('YYYY-MM-DD');
  const labelPayroll = configuration[0].label;

  // Create a map of exchange rates
  const exchangeRateMap = exchangeRates.reduce((map, exchange) => {
    map[exchange.currency_id] = exchange.rate;
    return map;
  }, {});

  // Convert rubric values using the exchange rate map
  rubrics.forEach(rubric => {
    const exchangeRate = exchangeRateMap[rubric.currency_id] || 1;
    rubric.value /= exchangeRate;
  });

  debug(`Processing ${employees.length} employees.`);

  // loop through employees and make salary commitments.
  employees.forEach(employee => {
    let employeeRubricsBenefits = [];
    let employeeRubricsWithholdings = [];
    let employeeChargesRemunerations = [];
    let employeePensionFund = [];

    let totalChargeRemuneration = 0;
    let totalPensionFund = 0;
    let voucherWithholding;
    let voucherChargeRemuneration;
    let voucherPensionFund;

    const paymentUuid = db.bid(employee.payment_uuid);
    const rubricsForEmployee = rubrics.filter(item => (item.employee_uuid === employee.employee_uuid));

    debug(`Employee ${employee.displayName} has ${rubricsForEmployee.length} rubrics to allocate.`);

    // sets the "payment" row status as "waiting for payment"
    transactions.push({
      query : 'UPDATE payment SET status_id = 3 WHERE uuid = ?',
      params : [paymentUuid],
    });

    // the "commitments" are payments to the employees account
    // TODO(@jniles): include the rubric.label in this description.  It should read something like:
    // "Payroll commitment for ${employee.display_name} (${employee.reference}) for ${rubric.label} in payment period ${periodPayroll}."
    const descriptionCommitment = `ENGAGEMENT DE PAIE [${periodPayroll}]/ ${labelPayroll}/ ${employee.display_name}`;

    // the "withholdings" are amounts deducted from the employees account.
    // TODO(@jniles): include the rubric.label in this description.  It should read something like:
    // "Salary withholding for ${employee.display_name} (${employee.reference}) for ${rubric.label} in payment period ${periodPayroll}."
    const descriptionWithholding = `RETENUE DU PAIEMENT [${periodPayroll}]/ ${labelPayroll}/ ${employee.display_name}`;

    // Get Rubrics benefits
    employeeRubricsBenefits = rubricsForEmployee.filter(item => (item.is_discount !== 1 && item.value > 0));
    debug(`Employee ${employee.displayName} has ${employeeRubricsBenefits.length} rubric benefits.`);

    // Get Expenses borne by the employees
    employeeRubricsWithholdings = rubricsForEmployee.filter(item => (
      item.is_discount && item.is_employee && item.value > 0));
    debug(`Employee ${employee.displayName} has ${employeeRubricsWithholdings.length} rubric withholdings.`);

    // Get Enterprise charge on remuneration
    employeeChargesRemunerations = rubricsForEmployee.filter(
      item => (item.is_employee !== 1 && item.is_discount === 1 && item.value > 0 && item.is_linked_pension_fund === 0),
    );

    debug(`Employee ${employee.displayName} has ${employeeRubricsWithholdings.length} rubric charge remunerations.`);

    // Get Pension Fund
    employeePensionFund = rubricsForEmployee.filter(
      item => (item.is_employee !== 1 && item.is_discount === 1 && item.value > 0 && item.is_linked_pension_fund === 1),
    );

    debug(`Employee ${employee.displayName} has ${employeePensionFund.length} rubric pension lines.`);

    const commitmentUuid = util.uuid();
    const voucherCommitmentUuid = db.bid(commitmentUuid);
    const withholdingUuid = util.uuid();
    const voucherWithholdingUuid = db.bid(withholdingUuid);

    const employeeBenefitsItem = [];
    const employeeWithholdingItem = [];
    const enterpriseChargeRemunerations = [];
    const enterprisePensionFund = [];

    // BENEFITS ITEM
    const voucherCommitment = {
      uuid : voucherCommitmentUuid,
      date : datePeriodTo,
      project_id : projectId,
      currency_id : currencyId,
      user_id : userId,
      type_id : COMMITMENT_TYPE_ID,
      description : descriptionCommitment,
      amount : employee.gross_salary,
    };

    //
    employeeBenefitsItem.push([
      db.bid(util.uuid()),
      employee.account_id,
      0, // debit
      employee.gross_salary, // credit
      // TODO(@jniles): this description should make reference to the fact that it is the employee's Net Salary.
      // It should read somethign like:
      // "Net salary commitment for ${employee.display_name} (${employee.reference}) in payment period ${periodPayroll}."
      db.bid(voucherCommitment.uuid),
      db.bid(employee.creditor_uuid),
      descriptionCommitment,
      null,
    ]);

    employeeBenefitsItem.push([
      db.bid(util.uuid()),
      accountPayroll,
      employee.basic_salary, // debit
      0, // credit
      db.bid(voucherCommitment.uuid),
      null,
      // TODO(@jniles): this description should make reference to the fact that it is the employee's base salary.
      // It should read somethign like:
      // "Base salary commitment for ${employee.display_name} (${employee.reference}) in payment period ${periodPayroll}."
      descriptionCommitment,
      employee.cost_center_id,
    ]);

    if (employeeRubricsBenefits.length) {
      employeeRubricsBenefits.forEach(rub => {
        employeeBenefitsItem.push([
          db.bid(util.uuid()),
          rub.expense_account_id,
          rub.value, // debit
          0, // credit
          db.bid(voucherCommitment.uuid),
          null,
          descriptionCommitment,
          employee.cost_center_id,
        ]);
      });
    }

    // EMPLOYEE WITHOLDINGS
    if (employeeRubricsWithholdings.length) {
      let totalEmployeeWithholding = 0;

      employeeRubricsWithholdings.forEach(withholding => {
        totalEmployeeWithholding += util.roundDecimal(withholding.value, DECIMAL_PRECISION);
      });

      voucherWithholding = {
        uuid : voucherWithholdingUuid,
        date : datePeriodTo,
        project_id : projectId,
        currency_id : currencyId,
        user_id : userId,
        type_id : WITHHOLDING_TYPE_ID,
        description : descriptionWithholding,
        amount : util.roundDecimal(totalEmployeeWithholding, DECIMAL_PRECISION),
      };

      employeeWithholdingItem.push([
        db.bid(util.uuid()),
        employee.account_id,
        util.roundDecimal(totalEmployeeWithholding, DECIMAL_PRECISION),
        0,
        voucherWithholdingUuid,
        db.bid(employee.creditor_uuid),
        descriptionWithholding,
        null,
      ]);

      employeeRubricsWithholdings.forEach(withholding => {
        const employeeCreditorUuid = withholding.is_associated_employee === 1 ? db.bid(employee.creditor_uuid) : null;

        employeeWithholdingItem.push([
          db.bid(util.uuid()),
          withholding.debtor_account_id,
          0,
          util.roundDecimal(withholding.value, DECIMAL_PRECISION),
          voucherWithholdingUuid,
          employeeCreditorUuid,
          descriptionWithholding,
          null,
        ]);
      });
    }

    // SOCIAL CHARGE ON REMUNERATION
    // TODO(@jniles) - what are charge remunerations?  How are they different from withholdings?
    // Does it have to do with taxes?
    if (employeeChargesRemunerations.length) {
      employeeChargesRemunerations.forEach(chargesRemunerations => {
        totalChargeRemuneration += util.roundDecimal(chargesRemunerations.value, DECIMAL_PRECISION);
      });

      voucherChargeRemuneration = {
        uuid : db.bid(util.uuid()),
        date : datePeriodTo,
        project_id : projectId,
        currency_id : employee.currency_id,
        user_id : userId,
        type_id : CHARGES_TYPE_ID,
        description : `CHARGES SOCIALES SUR REMUNERATION [${periodPayroll}]/ ${employee.display_name}`,
        amount : util.roundDecimal(totalChargeRemuneration, 2),
      };

      employeeChargesRemunerations.forEach(chargeRemuneration => {
        enterpriseChargeRemunerations.push([
          db.bid(util.uuid()),
          chargeRemuneration.debtor_account_id,
          0,
          chargeRemuneration.value,
          voucherChargeRemuneration.uuid,
          null,
          voucherChargeRemuneration.description,
          null,
        ], [
          db.bid(util.uuid()),
          chargeRemuneration.expense_account_id,
          chargeRemuneration.value,
          0,
          voucherChargeRemuneration.uuid,
          null,
          voucherChargeRemuneration.description,
          employee.cost_center_id,
        ]);
      });
    }

    // PENSION FOUND
    if (employeePensionFund.length) {
      employeePensionFund.forEach(pensionFund => {
        totalPensionFund += util.roundDecimal(pensionFund.value, DECIMAL_PRECISION);
      });

      voucherPensionFund = {
        uuid : db.bid(util.uuid()),
        date : datePeriodTo,
        project_id : projectId,
        currency_id : employee.currency_id,
        user_id : userId,
        type_id : TRANSACTION_TYPE,
        description : `RÉPARTITION DU FONDS DE RETRAITE [${periodPayroll}]/ ${employee.display_name}`,
        amount : util.roundDecimal(totalPensionFund, 2),
      };

      employeePensionFund.forEach(pensionFund => {
        enterprisePensionFund.push([
          db.bid(util.uuid()),
          pensionFund.debtor_account_id,
          0,
          pensionFund.value,
          voucherPensionFund.uuid,
          db.bid(employee.creditor_uuid),
          voucherPensionFund.description,
          null,
        ], [
          db.bid(util.uuid()),
          pensionFund.expense_account_id,
          pensionFund.value,
          0,
          voucherPensionFund.uuid,
          null,
          voucherPensionFund.description,
          employee.cost_center_id,
        ]);
      });
    }

    // initialise the transaction handler
    transactions.push({
      query : 'INSERT INTO voucher SET ?',
      params : [voucherCommitment],
    }, {
      query : `INSERT INTO voucher_item (
          uuid, account_id, debit, credit, voucher_uuid, entity_uuid, description, cost_center_id
        ) VALUES ?`,
      params : [employeeBenefitsItem],
    }, {
      query : 'CALL PostVoucher(?);',
      params : [voucherCommitment.uuid],
    });

    if (employeeChargesRemunerations.length) {
      transactions.push({
        query : 'INSERT INTO voucher SET ?',
        params : [voucherChargeRemuneration],
      }, {
        query : `INSERT INTO voucher_item
          (uuid, account_id, debit, credit, voucher_uuid, entity_uuid, description, cost_center_id) VALUES ?`,
        params : [enterpriseChargeRemunerations],
      }, {
        query : 'CALL PostVoucher(?);',
        params : [voucherChargeRemuneration.uuid],
      });
    }

    if (employeeRubricsWithholdings.length) {
      transactions.push({
        query : 'INSERT INTO voucher SET ?',
        params : [voucherWithholding],
      }, {
        query : `INSERT INTO voucher_item (
            uuid, account_id, debit, credit, voucher_uuid, entity_uuid,
            description, cost_center_id
          ) VALUES ?`,
        params : [employeeWithholdingItem],
      }, {
        query : 'CALL PostVoucher(?);',
        params : [voucherWithholding.uuid],
      });
    }

    if (employeePensionFund.length) {
      transactions.push({
        query : 'INSERT INTO voucher SET ?',
        params : [voucherPensionFund],
      }, {
        query : `INSERT INTO voucher_item
          (uuid, account_id, debit, credit, voucher_uuid, entity_uuid, description, cost_center_id) VALUES ?`,
        params : [enterprisePensionFund],
      }, {
        query : 'CALL PostVoucher(?);',
        params : [voucherPensionFund.uuid],
      });
    }

  });

  return transactions;
}

exports.commitmentByEmployee = commitmentByEmployee;
