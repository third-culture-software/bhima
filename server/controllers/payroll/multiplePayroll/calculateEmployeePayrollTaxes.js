const debug = require('debug')('payroll:commitments:taxes');
const util = require('../../../lib/util');
const db = require('../../../lib/db');
const common = require('./common');

// @const transaction type for the payroll tax transactions
const PAYROLL_TAX_TYPE_ID = 17;

/**
  * @function calculateEmployeePayrollTaxes
  *
  * @description
  * Filters rubrics for payroll tax rubrics and creates the vouchers and transactions that apply to those
  * kinds of rubrics. Returns an array of transactions.
  *
  * The options parameter should contain "lang", "sharedI18nProps" and "sharedVoucherProps"
  */
function calculateEmployeePayrollTaxes(employee, rubrics, options = {}) {
  const employeePayrollTaxes = rubrics.filter(common.isPayrollTaxRubric);

  debug(`Employee ${employee.display_name} has ${employeePayrollTaxes.length} applicable payroll taxes.`);

  // hold the growing list of transactions elements
  const transactions = [];

  // break early if no withholding rubrics apply.
  if (employeePayrollTaxes.length === 0) { return transactions; }

  // get the grand total value.
  const totalPayrollTaxes = common.sumRubricValues(employeePayrollTaxes);
  const descriptionPayrollTaxes = common.fmtI18nDescription(options.lang, 'PAYROLL_RUBRIC.TAX_DESCRIPTION', {
    ...options.sharedI18nProps,
    amount : totalPayrollTaxes,
  });

  debug(`Employee ${employee.display_name} has ${totalPayrollTaxes} total value of tax rubrics`);

  const voucher = {
    ...options.sharedVoucherProps,
    uuid : db.uuid(),
    type_id : PAYROLL_TAX_TYPE_ID,
    description : descriptionPayrollTaxes,
    amount : util.roundDecimal(totalPayrollTaxes, 2),
  };

  // add the voucher transaction
  transactions.push({ query : 'INSERT INTO voucher SET ?', params : [voucher] });

  // add voucher items for each tax item.  Unlike withholdings, there may be multiple variable accounts being hit here.
  const voucherItems = employeePayrollTaxes.flatMap(rubric => {
    const voucherItemDescription = common.fmtI18nDescription(options.lang, 'PAYROLL_RUBRIC.TAX_ITEM_DESCRIPTION', {
      ...options.sharedI18nProps,
      amount : rubric.value,
      rubricLabel : rubric.label,
    });

    debug(`Recording payroll taxes of ${rubric.value} for ${rubric.label} for ${employee.display_name}.`);

    return [[
      db.uuid(),
      rubric.debtor_account_id,
      0,
      rubric.value,
      voucher.uuid,
      null,
      voucherItemDescription,
      null,
    ], [
      db.uuid(),
      rubric.expense_account_id,
      rubric.value,
      0,
      voucher.uuid,
      null,
      voucherItemDescription,
      employee.cost_center_id,
    ]];
  });

  transactions.push({
    query : `INSERT INTO voucher_item (
            uuid, account_id, debit, credit, voucher_uuid, entity_uuid,
            description, cost_center_id) VALUES ?`,
    params : [voucherItems],
  });

  transactions.push({
    query : 'CALL PostVoucher(?);',
    params : [voucher.uuid],
  });

  return transactions;
}

module.exports = { calculateEmployeePayrollTaxes };
