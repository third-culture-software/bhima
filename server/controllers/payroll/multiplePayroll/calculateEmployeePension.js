const debug = require('debug')('payroll:commitments:pension');
const util = require('../../../lib/util');
const db = require('../../../lib/db');
const common = require('./common');

/**
  * @function calculateEmployeePension
  *
  * @description
  * Filters rubrics for pension rubrics and creates the vouchers and transactions that apply to those
  * kinds of rubrics. Returns an array of transactions.
  *
  * The options parameter should contain "lang", "sharedI18nProps" and "sharedVoucherProps".
  */
function calculateEmployeePension(employee, rubrics, txnTypeId, options = {}) {
  const employeePension = rubrics.filter(common.isPensionFundRubric);

  debug(`Employee ${employee.display_name} has ${employeePension.length} applicable pension rubrics.`);

  // hold the growing list of transactions elements
  const transactions = [];

  // break early if no withholding rubrics apply.
  if (employeePension.length === 0) { return transactions; }

  // get the grand total value.
  const totalPension = common.sumRubricValues(employeePension);
  const descriptionPension = common.fmtI18nDescription(options.lang, 'PAYROLL_RUBRIC.PENSION_FUND_DESCRIPTION', {
    ...options.sharedI18nProps,
    amount : totalPension,
  });

  debug(`Employee ${employee.display_name} has ${totalPension} total value of pension rubrics`);

  const voucher = {
    ...options.sharedVoucherProps,
    uuid : db.uuid(),
    type_id : txnTypeId,
    description : descriptionPension,
    amount : util.roundDecimal(totalPension, 2),
  };

  // add the voucher transaction
  transactions.push({ query : 'INSERT INTO voucher SET ?', params : [voucher] });

  // add voucher items for each pension item
  const voucherItems = employeePension.flatMap(rubric => {
    const voucherItemDescription = common.fmtI18nDescription(options.lang,
      'PAYROLL_RUBRIC.PENSION_FUND_ITEM_DESCRIPTION', {
        ...options.sharedI18nProps,
        amount : rubric.value,
        rubricLabel : rubric.label,
      });

    debug(`Allocating ${rubric.value} for ${rubric.label} for ${employee.display_name} pension.`);

    return [[
      db.uuid(),
      rubric.debtor_account_id,
      0,
      rubric.value,
      voucher.uuid,
      db.bid(employee.creditor_uuid),
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
    query : `INSERT INTO voucher_item ( uuid, account_id, debit, credit, voucher_uuid, entity_uuid,
            description, cost_center_id) VALUES ?`,
    params : [voucherItems],
  });

  transactions.push({
    query : 'CALL PostVoucher(?);',
    params : [voucher.uuid],
  });

  return transactions;
}

module.exports = { calculateEmployeePension };
