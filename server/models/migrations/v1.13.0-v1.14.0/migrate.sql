/* migration script from the version 1.13.0 to v1.14.0 */
ALTER TABLE unit DROP COLUMN url;

-- update units to make sure they are in the right category
UPDATE unit SET parent = 57
WHERE id = 183;
UPDATE unit SET parent = 57
WHERE id = 184;

/**
 * @author: mbayopanda
 * @date: 2020-06-11
 */
DELETE FROM role_unit
WHERE unit_id = 162;
DELETE FROM unit
WHERE id = 162;

/**
 * @author: mbayopanda
 * @date: 2020-06-23
 */
INSERT INTO unit VALUES
(271, 'Collection Capacity Report', 'TREE.COLLECTION_CAPACITY_REPORT', 'Collection Capacity Report', 144, '/reports/collectionCapacity');

INSERT INTO report (report_key, title_key) VALUES
('collectionCapacity', 'REPORT.COLLECTION_CAPACITY.TITLE');

/**
* @author: jniles
* @date: 2020-07-06
* @description: migrates the services columns from SMALLINT id -> BINARY uuid.
*/

CREATE TEMPORARY TABLE service_map AS SELECT
    service.id,
    service.uuid
FROM service;

ALTER TABLE employee ADD COLUMN service_uuid BINARY(16) DEFAULT NULL;
UPDATE employee AS t INNER JOIN service_map AS sm ON t.service_id = sm.id SET t.service_uuid = sm.uuid;
ALTER TABLE employee DROP FOREIGN KEY employee_ibfk_2;
ALTER TABLE employee DROP COLUMN service_id;
ALTER TABLE employee ADD FOREIGN KEY (service_uuid) REFERENCES service (uuid);

ALTER TABLE patient_visit ADD COLUMN last_service_uuid BINARY(16) DEFAULT NULL;
UPDATE patient_visit AS t INNER JOIN service_map AS sm ON t.last_service_id = sm.id SET t.last_service_uuid = sm.uuid;
ALTER TABLE patient_visit DROP FOREIGN KEY patient_visit_ibfk_2;
ALTER TABLE patient_visit DROP COLUMN last_service_id;
ALTER TABLE patient_visit ADD FOREIGN KEY (last_service_uuid) REFERENCES service (uuid);

ALTER TABLE patient_visit_service ADD COLUMN service_uuid BINARY(16) DEFAULT NULL;
UPDATE patient_visit_service AS t INNER JOIN service_map AS sm ON t.service_id = sm.id SET t.service_uuid = sm.uuid;
ALTER TABLE patient_visit_service DROP FOREIGN KEY patient_visit_service_ibfk_2;
ALTER TABLE patient_visit_service DROP COLUMN service_id;
ALTER TABLE patient_visit_service ADD FOREIGN KEY (service_uuid) REFERENCES service (uuid);

ALTER TABLE invoice ADD COLUMN service_uuid BINARY(16) DEFAULT NULL;
UPDATE invoice AS t INNER JOIN service_map AS sm ON t.service_id = sm.id SET t.service_uuid = sm.uuid;
ALTER TABLE invoice DROP FOREIGN KEY invoice_ibfk_3;
ALTER TABLE invoice DROP COLUMN service_id;
ALTER TABLE invoice ADD FOREIGN KEY (service_uuid) REFERENCES service (uuid);

ALTER TABLE ward ADD COLUMN service_uuid BINARY(16) DEFAULT NULL;
UPDATE ward AS t INNER JOIN service_map AS sm ON t.service_id = sm.id SET t.service_uuid = sm.uuid;
ALTER TABLE ward DROP FOREIGN KEY ward_ibfk_1;
ALTER TABLE ward DROP COLUMN service_id;
ALTER TABLE ward ADD FOREIGN KEY (service_uuid) REFERENCES service (uuid);

ALTER TABLE service_fee_center ADD COLUMN service_uuid BINARY(16) DEFAULT NULL;
UPDATE service_fee_center AS t INNER JOIN service_map AS sm ON t.service_id = sm.id SET t.service_uuid = sm.uuid;
ALTER TABLE service_fee_center DROP FOREIGN KEY service_fee_center_ibfk_1;
ALTER TABLE service_fee_center DROP COLUMN service_id;
ALTER TABLE service_fee_center ADD FOREIGN KEY (service_uuid) REFERENCES service (uuid);

ALTER TABLE indicator ADD COLUMN service_uuid BINARY(16) DEFAULT NULL;
UPDATE indicator AS t INNER JOIN service_map AS sm ON t.service_id = sm.id SET t.service_uuid = sm.uuid;
ALTER TABLE indicator DROP COLUMN service_id;
ALTER TABLE indicator ADD FOREIGN KEY (service_uuid) REFERENCES service (uuid);


-- update the actual service table
ALTER TABLE service MODIFY id SMALLINT NOT NULL;
ALTER TABLE service DROP PRIMARY KEY;
ALTER TABLE service DROP COLUMN id;


ALTER TABLE service ADD PRIMARY KEY (uuid);

/**
@author: lomamech:
@date: 2020-07-09
*/

ALTER TABLE province DROP INDEX province_1;

ALTER TABLE sector DROP INDEX sector_1;

/* DISABLED: ALTER TABLE `village` DROP INDEX `village_1`;
JMC: Disabled since this fails when using migration script  2020-07-31
*/

/*
@author jmcameron
@date: 2020-07-17
@description Add flag for automatic confirmation of purchase orders to the enterprise settings. [PR 4733]
*/

ALTER TABLE enterprise_setting ADD COLUMN enable_auto_purchase_order_confirmation TINYINT(1) NOT NULL DEFAULT 1;

/**
@author: jmcameron
@date: 2020-07-20
@description: Convert enable_daily_consumption to a 1-bit boolean (from SMALLINT(5)).  [PR 4745]
*/

ALTER TABLE enterprise_setting MODIFY COLUMN enable_daily_consumption TINYINT(1) NOT NULL DEFAULT 0;

/**
 * @author: jeremielodi
 * @date: 2020-07-03
 */
ALTER TABLE inventory_group ADD tracking_consumption TINYINT(1) DEFAULT 1;

ALTER TABLE inventory_group CHANGE expires tracking_expiration TINYINT(1) DEFAULT 1;

/*
Migration of the unit IDs to put reports in proper folders.
*/

INSERT IGNORE INTO unit (id, name, `key`, description, parent, path) VALUES
(280, 'Hospital Reports', 'TREE.REPORTS', 'reports for the hospital modules', 12, '/HOSPITAL_FOLDER/reports'),
(281, 'Finance Reports', 'TREE.REPORTS', 'reports for the accounting/finance module', 5, '/FINANCE_FOLDER/reports'),
(282, 'Stock Reports', 'TREE.REPORTS', 'reports for the stock modules', 160, '/STOCK_FOLDER/reports'),
(283, 'HR Reports', 'TREE.REPORTS', 'reports for the HR/Payroll modules', 57, '/PAYROLL_FOLDER/reports'),
(284, 'Data Kit Reports', 'TREE.REPORTS', 'reports for the data collection modules', 254, '/data_collection/reports'),
(285, 'Purchase Reports', 'TREE.REPORTS', 'reports for the purchasing modules', 154, '/PURCHASE_FOLDER/reports'),
(286, 'Fee Center Reports', 'TREE.REPORTS', 'reports for the fee center modules', 218, '/fee_center/reports'),
(287, 'Inventory Reports', 'TREE.REPORTS', 'reports for the inventory modules', 138, '/inventory/reports');

-- FINANCE

-- Cash Flow
UPDATE unit SET parent = 281
WHERE id = 145;

-- Cash Report
UPDATE unit SET parent = 281
WHERE id = 149;

-- Balance Sheet Report
UPDATE unit SET name = 'Balance Sheet', parent = 281
WHERE id = 150;

-- Aged Debtors Report
UPDATE unit SET name = 'Aged Debtors', parent = 281
WHERE id = 151;

-- Account Report
UPDATE unit SET parent = 281
WHERE id = 152;

-- Cashflow by Service
UPDATE unit SET parent = 281
WHERE id = 153;

-- Open Debtors
UPDATE unit SET parent = 281
WHERE id = 157;

-- Aged Creditors
UPDATE unit SET parent = 281
WHERE id = 168;

-- Account Statement (Simple)
UPDATE unit SET parent = 281
WHERE id = 170;

-- Profit and Loss Statement
UPDATE unit SET name = 'Profit & Loss Statement', parent = 281
WHERE id = 180;

-- Compte d'Exploitation (PCGC P&L)
UPDATE unit SET name = 'Operating Accounts Report', parent = 281
WHERE id = 192;

-- Annual Clients Report
UPDATE unit SET parent = 281
WHERE id = 199;

-- Bilan (OHADA Balance Sheet
UPDATE unit SET parent = 281
WHERE id = 206;

-- Account References Report
UPDATE unit SET parent = 281
WHERE id = 207;

-- Account Statement (Multiple)
UPDATE unit SET parent = 281
WHERE id = 209;

-- Monthly Analysis of Balance
UPDATE unit SET name = 'Monthly Analysis of Balance', parent = 281
WHERE id = 244;

-- Unpaid/Unbalanced Invoices Report
UPDATE unit SET parent = 281
WHERE id = 210;

-- Proft and Loss by Month
UPDATE unit SET name = 'Profit & Loss by Month', parent = 281
WHERE id = 211;

-- Compte de Resultat (OHADA P&L)
UPDATE unit SET parent = 281
WHERE id = 214;

-- Profit and Loss by Year
UPDATE unit SET name = 'Profit & Loss by Year', parent = 281
WHERE id = 216;

-- Monthly Analysis of the Balance Sheet
UPDATE unit SET name = 'Monthly Analysis of Balance', parent = 281
WHERE id = 244;

-- Debtor Summary Report
UPDATE unit SET parent = 281
WHERE id = 245;

-- Client Debts Report
UPDATE unit SET parent = 281
WHERE id = 246;

-- Debtor Summary Report
UPDATE unit SET parent = 281
WHERE id = 245;

-- Client Debts Report
UPDATE unit SET parent = 281
WHERE id = 246;

-- Client Support Report
UPDATE unit SET parent = 281
WHERE id = 247;

-- Analysis of Auxiliary Cashboxes
UPDATE unit SET parent = 281
WHERE id = 248;

-- Realized Profit Report
UPDATE unit SET parent = 281
WHERE id = 249;

-- Recovery Capacity Report
UPDATE unit SET name = 'Recovery Capacity Report', parent = 281
WHERE id = 271;

-- Configurable Analysis Tools Report
UPDATE unit SET parent = 281
WHERE id = 264;

-- HOSPITAL REPORTS

-- Patient Standing Report
UPDATE unit SET parent = 280
WHERE id = 202;

-- Visit Report
UPDATE unit SET parent = 280
WHERE id = 239;

-- System Usage Statistics
UPDATE unit SET parent = 280
WHERE id = 250;

-- STOCK REPORTS

-- stock report
UPDATE unit SET parent = 282
WHERE id = 181;

-- stock sheet report
UPDATE unit SET parent = 282
WHERE id = 182;

-- stock exit report
UPDATE unit SET parent = 282
WHERE id = 197;

-- stock value report
UPDATE unit SET parent = 282
WHERE id = 213;

-- stock entry report
UPDATE unit SET parent = 282
WHERE id = 240;

-- monthly consumption report
UPDATE unit SET parent = 282
WHERE id = 267;

-- Consumption Graph
UPDATE unit SET parent = 282
WHERE id = 268;

-- Compare Invoiced to Received Report
UPDATE unit SET parent = 282
WHERE id = 270;

-- HR REPORTS

-- Employee Standing Report
UPDATE unit SET parent = 283
WHERE id = 201;

-- Data Kit Reports

-- Data Collect Report
UPDATE unit SET parent = 284
WHERE id = 261;

-- PURCHASE REPORTS

-- Purchase Order Analysis
UPDATE unit SET parent = 285
WHERE id = 265;

-- FEE CENTER REPORTS

-- Fee Center Report
UPDATE unit SET parent = 286
WHERE id = 222;

-- Break Even Report
UPDATE unit SET parent = 286
WHERE id = 231;

-- Break Even By Fee Center Report
UPDATE unit SET parent = 286
WHERE id = 232;

-- Indicator Report
UPDATE unit SET parent = 286
WHERE id = 238;

-- INVENTORY REPORTS

-- Inventory Changes Report
UPDATE unit SET parent = 287
WHERE id = 266;


-- remove previous report folder
DELETE FROM role_unit
WHERE unit_id = 144;
DELETE FROM unit
WHERE id = 144;

-- update roles to reflect new permissions
CREATE TEMPORARY TABLE ru AS
SELECT
    role_uuid,
    unit.parent AS unit_id
FROM role_unit INNER JOIN unit ON role_unit.unit_id = unit.id;

-- ALTER TABLE `role_unit` ADD CONSTRAINT `tmp_ru_unique_key` UNIQUE (`role_uuid`, `unit_id`);

INSERT IGNORE INTO role_unit SELECT
    HUID(UUID()),
    role_uuid,
    unit_id
FROM ru;

DROP TEMPORARY TABLE ru;


/**
@author : jeremielodi
date : 13/07/2020
*/
INSERT INTO report (report_key, title_key) VALUES
('stock_movement_report', 'Stock Movement Dashboad');

INSERT INTO unit VALUES
(288, '[Stock] Movement Report', 'TREE.STOCK_MOVEMENT_REPORT', 'Stock Movement Report', 282, '/reports/stock_movement_report');
