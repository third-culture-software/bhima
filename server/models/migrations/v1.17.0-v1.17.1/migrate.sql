/**
 * Migration from the version 1.17.0 to v1.17.1
 */

-- fix typo in name
UPDATE report SET report_key = 'recovery_capacity'
WHERE id = 50;

-- update the unit paths
UPDATE unit SET path = '/reports/cashflow_by_service'
WHERE id = 153;
UPDATE unit SET path = '/reports/annual_clients_report'
WHERE id = 199;
UPDATE unit SET path = '/reports/employee_standing'
WHERE id = 201;
UPDATE unit SET path = '/reports/patient_standing'
WHERE id = 202;
UPDATE unit SET path = '/reports/unpaid_invoice_payments'
WHERE id = 210;
UPDATE unit SET path = '/reports/fee_center'
WHERE id = 222;
UPDATE unit SET path = '/reports/break_even'
WHERE id = 231;
UPDATE unit SET path = '/reports/break_even_fee_center'
WHERE id = 232;
UPDATE unit SET path = '/reports/indicators_report'
WHERE id = 238;
UPDATE unit SET path = '/reports/monthly_balance'
WHERE id = 244;
UPDATE unit SET path = '/reports/debtor_summary'
WHERE id = 245;
UPDATE unit SET path = '/reports/client_debts'
WHERE id = 246;
UPDATE unit SET path = '/reports/client_support'
WHERE id = 247;
UPDATE unit SET path = '/reports/analysis_auxiliary_cashboxes'
WHERE id = 248;
UPDATE unit SET path = '/reports/realized_profit'
WHERE id = 249;
UPDATE unit SET path = '/reports/system_usage_stat'
WHERE id = 250;
UPDATE unit SET path = '/reports/data_kit'
WHERE id = 261;
UPDATE unit SET path = '/reports/purchase_order_analysis'
WHERE id = 265;
UPDATE unit SET path = '/reports/inventory_changes'
WHERE id = 266;
UPDATE unit SET path = '/reports/monthly_consumption_report'
WHERE id = 267;
UPDATE unit SET path = '/reports/invoiced_received_stock'
WHERE id = 270;
UPDATE unit SET path = '/reports/recovery_capacity'
WHERE id = 271;
