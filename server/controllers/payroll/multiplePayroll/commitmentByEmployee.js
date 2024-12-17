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
const { sumRubricValues } = require('./common');

const i18n = require('../../../lib/helpers/translate');

const COMMITMENT_TYPE_ID = 15;
const WITHHOLDING_TYPE_ID = 16;
const PAYROLL_TAX_TYPE_ID = 17;
const DECIMAL_PRECISION = 2;

function commitmentByEmployee(
  employees, rubrics,
  configuration,
  projectId, userId, exchangeRates, currencyId,
  postingPensionFundTransactionType, i18nKey) {

  debug('Setting up transactions for salary commitments, withholdings, and credits by employee.');

  const TRANSACTION_TYPE = postingPensionFundTransactionType;
  const transactions = [];

  const accountPayroll = configuration[0].account_id;
  const periodPayroll = moment(configuration[0].dateTo).format('MM-YYYY');
  const datePeriodTo = moment(configuration[0].dateTo).format('YYYY-MM-DD');
  // const labelPayroll = configuration[0].label;

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

  // eslint-disable-next-line
  // "Salary withholdings of {{amount}} for {{employee.displayname}} ({{employee.reference}}) for \"{{rubric.label}}\" in payment period {{paymentPeriod}}.",
  const descriptionWithholdingI18nKey = 'PAYROLL_RUBRIC.WITHHOLDING_DESCRIPTION';
  // eslint-disable-next-line
  // "Payroll commitment of {{amount}} for {{employee.displayname}} ({{employee.reference}}) for \"{{rubric.label}}\" in payment period {{paymentPeriod}}."
  const descriptionCommitmentI18nKey = 'PAYROLL_RUBRIC.COMMITMENT_DESCRIPTION';

  // loop through employees scheduled for payment this pay period and make salary commitments.
  employees.forEach(employee => {
    let employeeRubricsBenefits = [];
    let employeeRubricsWithholdings = [];
    let employeePayrollTaxes = [];
    let employeePensionFund = [];

    let voucherPayrollTaxes;

    const paymentUuid = db.bid(employee.payment_uuid);
    const rubricsForEmployee = rubrics.filter(rubric => (rubric.employee_uuid === employee.employee_uuid));

    debug(`Employee ${employee.displayName} has ${rubricsForEmployee.length} rubrics to allocate.`);

    // FIXME(@jniles) - this gets executed for every employee, even though it is not an employee-specific
    // transaction.  It's linked to the payment period.  It should be instead moved to somewhere that
    // deals with the payment periods, not the employees.
    transactions.push({
      query : 'UPDATE payment SET status_id = 3 WHERE uuid = ?',
      params : [paymentUuid],
    });

    // the "commitments" are payments to the employees account
    // const descriptionCommitment = `ENGAGEMENT DE PAIE [${periodPayroll}]/ ${labelPayroll}/ ${employee.display_name}`;
    const descriptionCommitment = i18n(i18nKey)(descriptionCommitmentI18nKey);

    // the "withholdings" are amounts deducted from the employees account.
    // TODO(@jniles): include the rubric.label in this description.  It should read something like:
    // eslint-disable-next-line
    // const descriptionWithholding = `RETENUE DU PAIEMENT [${periodPayroll}]/ ${labelPayroll}/ ${employee.display_name}`;
    const descriptionWithholding = i18n(i18nKey)(descriptionWithholdingI18nKey);

    // Get Rubrics benefits
    employeeRubricsBenefits = rubricsForEmployee.filter(rubric => (rubric.is_discount !== 1 && rubric.value > 0));
    debug(`Employee ${employee.displayName} has ${employeeRubricsBenefits.length} rubric benefits.`);

    // Get Expenses borne by the employees
    employeeRubricsWithholdings = rubricsForEmployee.filter(rubric => (
      rubric.is_discount && rubric.is_employee && rubric.value > 0));

    debug(`Employee ${employee.displayName} has ${employeeRubricsWithholdings.length} rubric withholdings.`);

    // Get Enterprise charge on remuneration
    employeePayrollTaxes = rubricsForEmployee.filter(
      rubric => (rubric.is_employee !== 1 && rubric.is_discount === 1 && rubric.value > 0 && rubric.is_linked_pension_fund === 0),
    );

    debug(`Employee ${employee.displayName} has ${employeeRubricsWithholdings.length} rubric charge remunerations.`);

    // Get Pension Fund
    employeePensionFund = rubricsForEmployee.filter(
      rubric => (rubric.is_employee !== 1 && rubric.is_discount === 1 && rubric.value > 0 && rubric.is_linked_pension_fund === 1),
    );

    debug(`Employee ${employee.displayName} has ${employeePensionFund.length} rubric pension lines.`);

    const voucherCommitmentUuid = db.uuid();
    const voucherWithholdingUuid = db.uuid();

    const employeeBenefitsItem = [];
    const employeeWithholdingItem = [];
    const enterprisePayrollTaxess = [];
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
      db.uuid(),
      employee.account_id,
      0, // debit
      employee.gross_salary, // credit
      // TODO(@jniles): this description should make reference to the fact that it is the employee's Net Salary.
      // It should read somethign like:
      // eslint-disable-next-line
      // "Net salary commitment for ${employee.display_name} (${employee.reference}) in payment period ${periodPayroll}."
      db.bid(voucherCommitment.uuid),
      db.bid(employee.creditor_uuid),
      descriptionCommitment,
      null,
    ]);

    employeeBenefitsItem.push([
      db.uuid(),
      accountPayroll,
      employee.basic_salary, // debit
      0, // credit
      db.bid(voucherCommitment.uuid),
      null,
      // TODO(@jniles): this description should make reference to the fact that it is the employee's base salary.
      // It should read somethign like:
      // eslint-disable-next-line
      // "Base salary commitment for ${employee.display_name} (${employee.reference}) in payment period ${periodPayroll}."
      descriptionCommitment,
      employee.cost_center_id,
    ]);

    if (employeeRubricsBenefits.length) {
      employeeRubricsBenefits.forEach(rub => {
        employeeBenefitsItem.push([
          db.uuid(),
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
    let voucherWithholding = {};
    if (employeeRubricsWithholdings.length) {
      const totalEmployeeWithholding = sumRubricValues(employeeRubricsWithholdings);

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
        db.uuid(),
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
          db.uuid(),
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
    if (employeePayrollTaxes.length) {
      const totalPayrollTaxes = sumRubricValues(employeePayrollTaxes);

      voucherPayrollTaxes = {
        uuid : db.uuid(),
        date : datePeriodTo,
        project_id : projectId,
        currency_id : employee.currency_id,
        user_id : userId,
        type_id : PAYROLL_TAX_TYPE_ID,
        description : `CHARGES SOCIALES SUR REMUNERATION [${periodPayroll}]/ ${employee.display_name}`,
        amount : util.roundDecimal(totalPayrollTaxes, 2),
      };

      employeePayrollTaxes.forEach(chargeRemuneration => {
        enterprisePayrollTaxess.push([
          db.uuid(),
          chargeRemuneration.debtor_account_id,
          0,
          chargeRemuneration.value,
          voucherPayrollTaxes.uuid,
          null,
          voucherPayrollTaxes.description,
          null,
        ], [
          db.uuid(),
          chargeRemuneration.expense_account_id,
          chargeRemuneration.value,
          0,
          voucherPayrollTaxes.uuid,
          null,
          voucherPayrollTaxes.description,
          employee.cost_center_id,
        ]);
      });
    }

    // PENSION FOUND
    let voucherPensionFund = {};
    if (employeePensionFund.length) {

      const totalPensionFund = sumRubricValues(employeePensionFund);

      voucherPensionFund = {
        uuid : db.uuid(),
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
          db.uuid(),
          pensionFund.debtor_account_id,
          0,
          pensionFund.value,
          voucherPensionFund.uuid,
          db.bid(employee.creditor_uuid),
          voucherPensionFund.description,
          null,
        ], [
          db.uuid(),
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

    if (employeePayrollTaxes.length) {
      transactions.push({
        query : 'INSERT INTO voucher SET ?',
        params : [voucherPayrollTaxes],
      }, {
        query : `INSERT INTO voucher_item
          (uuid, account_id, debit, credit, voucher_uuid, entity_uuid, description, cost_center_id) VALUES ?`,
        params : [enterprisePayrollTaxess],
      }, {
        query : 'CALL PostVoucher(?);',
        params : [voucherPayrollTaxes.uuid],
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
