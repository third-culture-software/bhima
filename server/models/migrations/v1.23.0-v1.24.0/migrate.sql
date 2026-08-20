/* migration v1.23.0 - v1.24.0 */

/*
 * @author: jmcameron
 * @description: Reformat reports
 * @date: 2022-05-23
 */
UPDATE report SET report_key = 'analysis_auxiliary_cashboxes'
WHERE title_key = 'REPORT.ANALYSIS_AUX_CASHBOX.TITLE';

/*
 * @author: jniles
 * @description: Remove Profit & Loss Statements
 * @date: 2022-05-31
 */
DELETE FROM saved_report
WHERE report_id IN (
        SELECT id FROM report
        WHERE report_key IN ('income_expense', 'income_expense_by_month', 'income_expense_by_year')
    );
DELETE FROM report
WHERE report_key IN ('income_expense', 'income_expense_by_month', 'income_expense_by_year');
DELETE FROM role_unit
WHERE unit_id IN (180, 211, 216);
DELETE FROM unit
WHERE id IN (180, 211, 216);

/*
 * @author: jniles
 * @description: Remove old break even and cost center modules.
 * @date: 2022-06-01
 */
DELETE FROM saved_report
WHERE report_id IN (
        SELECT id FROM report
        WHERE report_key IN ('break_even', 'break_even_cost_center', 'break_even_fee_center', 'cost_center')
    );
DELETE FROM report
WHERE report_key IN ('break_even', 'break_even_cost_center', 'break_even_fee_center', 'cost_center');
DELETE FROM role_unit
WHERE unit_id IN (220, 221, 222, 223, 230, 231, 232);
DELETE FROM unit
WHERE id IN (220, 221, 222, 223, 230, 231, 232);
