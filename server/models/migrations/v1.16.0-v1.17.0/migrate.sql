/**
 * Migration from the version 1.16.1 to v1.17.0
 */

/*
 * @author: jmcameron
 * @date: 2020-11-18
 * @pull-release: 5129
 * @description: Fix typo in menu report name "System Usage Statistics"
 */
UPDATE unit SET name = 'System Usage Statistics', description = 'System Usage Statistics'
WHERE id = 250;

INSERT INTO unit VALUES
(292, '[Stock] Changes Report', 'REPORT.STOCK_CHANGES.TITLE', 'Stock Changes Report', 282, '/reports/stock_changes');

INSERT INTO report (report_key, title_key) VALUES
('stock_changes', 'REPORT.STOCK_CHANGES.TITLE');

/*
 * @author: jmcameron
 * @date: 2020-11-23
 * @pull-release: TBD
 * @description: Rename reports to use underscores
 */
UPDATE report SET report_key = 'unpaid_invoice_payments'
WHERE report_key = 'unpaid-invoice-payments';
UPDATE report SET report_key = 'annual_clients_report'
WHERE report_key = 'annual-clients-report';

UPDATE report SET report_key = 'employee_standing'
WHERE report_key = 'employeeStanding';
UPDATE report SET report_key = 'debtor_summary'
WHERE report_key = 'debtorSummary';
UPDATE report SET report_key = 'client_debts'
WHERE report_key = 'clientDebts';
UPDATE report SET report_key = 'client_support'
WHERE report_key = 'clientSupport';
UPDATE report SET report_key = 'recovery_capacity'
WHERE report_key = 'recoveryCapacity';
UPDATE report SET report_key = 'invoiced_received_stock'
WHERE report_key = 'invoicedReceivedStock';
UPDATE report SET report_key = 'system_usage_stat'
WHERE report_key = 'systemUsageStat';
UPDATE report SET report_key = 'indicators_report'
WHERE report_key = 'indicatorsReport';
UPDATE report SET report_key = 'patient_standing'
WHERE report_key = 'patientStanding';
UPDATE report SET report_key = 'cashflow_by_service'
WHERE report_key = 'cashflowByService';
UPDATE report SET report_key = 'fee_center'
WHERE report_key = 'feeCenter';
UPDATE report SET report_key = 'break_even'
WHERE report_key = 'breakEven';
UPDATE report SET report_key = 'break_even_fee_center'
WHERE report_key = 'breakEvenFeeCenter';
UPDATE report SET report_key = 'monthly_balance'
WHERE report_key = 'monthlyBalance';
UPDATE report SET report_key = 'analysis_auxiliary_cashboxes'
WHERE report_key = 'analysisAuxiliaryCash';
UPDATE report SET report_key = 'data_kit'
WHERE report_key = 'dataKit';
UPDATE report SET report_key = 'purchase_order_analysis'
WHERE report_key = 'purchaseOrderAnalysis';
UPDATE report SET report_key = 'inventory_changes'
WHERE report_key = 'inventoryChanges';
UPDATE report SET report_key = 'monthly_consumption_report'
WHERE report_key = 'monthlyConsumptionReport';


-- update the unit pats
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
-- UPDATE `unit` SET `path` = '/reports/break_even_fee_center' WHERE id = 233;
-- UPDATE `unit` SET `path` = '/reports/break_even_fee_center' WHERE id = 232
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


/*
 * @author: lomamech
 * @date: 2020-11-23
 * @subject : Stock Dashboard
 */
INSERT INTO unit VALUES
(291, '[Stock] Dashboard', 'TREE.STOCK_DASHBOARD', 'Stock Dashboard', 160, '/stock/dashboard');
