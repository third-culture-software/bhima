const debug = require('debug')('payroll:commitments:withholdings');
const util = require('../../../lib/util');
const db = require('../../../lib/db');
const common = require('./common');

// @const transaction type for the withholding transactions
const WITHHOLDING_TYPE_ID = 16;
const DECIMAL_PRECISION = 2;

/**
  * @function calculateEmployeeWithholdings
  *
  * @description
  * Filters rubrics for withholding types of rubrics and creates the vouchers and transactions that apply to those
  * kinds of rubrics. Returns an array of transactions.
  *
  * The options field should contain "lang", "sharedI18nProps" and "sharedVoucherProps".
  */
function calculateEmployeeWithholdings(employee, rubrics, options = {}) {
  const employeeRubricsWithholdings = rubrics.filter(common.isWithholdingRubric);
  debug(`Employee ${employee.display_name} has ${employeeRubricsWithholdings.length} rubric withholdings.`);

  // hold the growing list of transactions elements
  const transactions = [];

  // break early if no withholding rubrics apply.
  if (employeeRubricsWithholdings.length === 0) { return transactions; }

  // get the grand total value.
  const totalEmployeeWithholding = common.sumRubricValues(employeeRubricsWithholdings);

  const descriptionWithholding = common.fmtI18nDescription(options.lang, 'PAYROLL_RUBRIC.WITHHOLDING_DESCRIPTION', {
    ...options.sharedI18nProps,
    amount : totalEmployeeWithholding,
  });

  const voucher = {
    ...options.sharedVoucherProps,
    uuid : db.uuid(),
    type_id : WITHHOLDING_TYPE_ID,
    description : descriptionWithholding,
    amount : util.roundDecimal(totalEmployeeWithholding, DECIMAL_PRECISION),
  };

  // add the voucher transaction
  transactions.push({ query : 'INSERT INTO voucher SET ?', params : [voucher] });

  // add the total withholding amount to the employee side of the voucher.  This is the amount that is
  // being withheld (debited from a creditor account) from the employee.
  const voucherItems = [[
    db.uuid(),
    employee.account_id,
    util.roundDecimal(totalEmployeeWithholding, DECIMAL_PRECISION),
    0,
    voucher.uuid,
    db.bid(employee.creditor_uuid),
    voucher.description,
    null,
  ]];

  // enumerate each withholding on the opposite side of the transaction
  employeeRubricsWithholdings.forEach(rubric => {
    const employeeCreditorUuid = rubric.is_associated_employee === 1 ? db.bid(employee.creditor_uuid) : null;

    const voucherItemDescription = common.fmtI18nDescription(
      options.lang, 'PAYROLL_RUBRIC.WITHHOLDING_ITEM_DESCRIPTION', {
        ...options.sharedI18nProps,
        amount : rubric.value,
        rubricLabel : rubric.label,
      });

    debug(`Recording withholdings of ${rubric.value} for ${rubric.label} for ${employee.display_name}.`);

    voucherItems.push([
      db.uuid(),
      rubric.debtor_account_id,
      0,
      util.roundDecimal(rubric.value, DECIMAL_PRECISION),
      voucher.uuid,
      employeeCreditorUuid,
      voucherItemDescription,
      null,
    ]);
  });

  transactions.push({
    query : `INSERT INTO voucher_item (
            uuid, account_id, debit, credit, voucher_uuid, entity_uuid,
            description, cost_center_id
          ) VALUES ?`,
    params : [voucherItems],
  });

  transactions.push({
    query : 'CALL PostVoucher(?);',
    params : [voucher.uuid],
  });

  return transactions;
}

module.exports = { calculateEmployeeWithholdings };
