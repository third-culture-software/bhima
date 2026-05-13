/*
 * @author: jniles
 * @date 2021-08-09
 * @description: adds report on inventory prices
 */
INSERT IGNORE INTO `report` (`report_key`, `title_key`) VALUES
  ('purchase_prices', 'REPORT.PURCHASE_PRICES.TITLE');

INSERT IGNORE INTO `unit` VALUES
  (301, 'Purchase Prices Report','REPORT.PURCHASE_PRICES.TITLE','Report on purchase prices over time', 285,'/reports/purchase_prices');

/* @author: mbayopanda
 * @date: 2021-08-24
 * @desc: set to decimal the min months of security stock
 */
ALTER TABLE `stock_setting` MODIFY COLUMN `default_min_months_security_stock` DECIMAL(19,4) NOT NULL DEFAULT 2;
ALTER TABLE `depot` MODIFY COLUMN `min_months_security_stock` DECIMAL(19,4) NOT NULL DEFAULT 2;
ALTER TABLE `depot` MODIFY COLUMN `default_purchase_interval` DECIMAL(19,4) NOT NULL DEFAULT 2;

/* migrate v1.21.0 to next */

/**
author: @jniles
date: 2021-08-30
description: adds cost columns and indices to relevant tables
*/

DROP TABLE IF EXISTS `cost_center_aggregate`;
CREATE TABLE `cost_center_aggregate` (
  `period_id`       MEDIUMINT(8) UNSIGNED NOT NULL,
  `debit`           DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `credit`          DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `cost_center_id`  MEDIUMINT(8) UNSIGNED NOT NULL,
  KEY `cost_center_id` (`cost_center_id`),
  KEY `period_id` (`period_id`),
  CONSTRAINT `cost_center_aggregate__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
  CONSTRAINT `cost_center_aggregate__cost_center_id` FOREIGN KEY (`cost_center_id`) REFERENCES `fee_center` (`id`)
) ENGINE=InnoDB;

CALL add_column_if_missing('posting_journal', 'cost_center_id', 'MEDIUMINT(8) UNSIGNED NULL');
CALL add_constraint_if_missing('posting_journal', 'posting_journal__cost_center_1', 'FOREIGN KEY (`cost_center_id`) REFERENCES `fee_center` (`id`) ON UPDATE CASCADE');

CALL add_column_if_missing('general_ledger', 'cost_center_id', 'MEDIUMINT(8) UNSIGNED NULL');
CALL add_constraint_if_missing('general_ledger', 'general_ledger__cost_center_1', 'FOREIGN KEY (`cost_center_id`) REFERENCES `fee_center` (`id`) ON UPDATE CASCADE');

/**
author: @jmcameron
date: 2021-09-01
description: adds allocation basis data to cost centers
*/
CREATE TABLE IF NOT EXISTS `cost_center_basis` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY  (`name`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `cost_center_basis_value` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `quantity` DECIMAL(19,4) NOT NULL DEFAULT 0,
  `cost_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `basis_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `cost_center_basis_value__fee_center` FOREIGN KEY (`cost_center_id`) REFERENCES `fee_center` (`id`),
  CONSTRAINT `cost_center_basis_value__basis` FOREIGN KEY (`basis_id`) REFERENCES `cost_center_basis` (`id`)
) ENGINE=InnoDB;

/**
author: @jmcameron
date: 2021-09-07
description: Edit cost center allocation basis
*/
CALL add_column_if_missing('cost_center_basis', 'units', "VARCHAR(30) DEFAULT '' AFTER `name`");

/*
 * @author: mbayopanda
 * @date: 2021-09-02
 * @desc: fee center report tables and test data
 */
CALL add_column_if_missing('fee_center', 'step_order', 'SMALLINT(5) NOT NULL DEFAULT 0');
CALL add_column_if_missing('fee_center', 'allocation_basis_id', 'MEDIUMINT(8) UNSIGNED');
CALL add_column_if_missing('fee_center', 'allocation_method', "VARCHAR(14) NOT NULL DEFAULT 'proportional'");

INSERT IGNORE INTO `unit` VALUES
  (298, 'Cost Center Step-down','TREE.COST_CENTER_STEPDOWN','The cost center report with step-down algorithm', 286,'/reports/cost_center_step_down');

ALTER TABLE `cost_center_basis` MODIFY COLUMN `name` VARCHAR(200) NOT NULL;

/**
author: @jmcameron
date: 2021-09-09, updated 2021-09-15
description: Create cost basis items
*/
CALL add_column_if_missing('cost_center_basis', 'description', 'TEXT DEFAULT NULL AFTER `name`');
CALL add_column_if_missing('cost_center_basis', 'is_predefined', 'BOOLEAN NOT NULL DEFAULT 0 AFTER `description`');

/**
 * THE USE OF RENAME IMPLY THAT TABLES EXISTS BEFORE TO RENAME
 * AFTER A FRESH BUILD (yarn build:db) THIS CODES ARE NOT NECESSARY
 */
RENAME TABLE fee_center TO cost_center,
             reference_fee_center TO reference_cost_center,
             fee_center_distribution TO cost_center_allocation,
             service_fee_center TO service_cost_center,
             distribution_key TO allocation_key;

ALTER TABLE `cost_center_allocation` RENAME COLUMN `auxiliary_fee_center_id` TO `auxiliary_cost_center_id`;
ALTER TABLE `service_cost_center` RENAME COLUMN `fee_center_id` TO `cost_center_id`;
ALTER TABLE `reference_cost_center` RENAME COLUMN `fee_center_id` TO `cost_center_id`;
ALTER TABLE `allocation_key` RENAME COLUMN `auxiliary_fee_center_id` TO `auxiliary_cost_center_id`;

/**
author: mbayopanda
date: 2021-09-14
description: rename allocation tables
*/
RENAME TABLE cost_center_basis TO cost_center_allocation_basis,
             cost_center_basis_value TO cost_center_allocation_basis_value;

UPDATE `unit` SET `path` = '/cost_center', `key` = 'TREE.COST_CENTER_MANAGEMENT' WHERE id = 218;
UPDATE `unit` SET `path` = '/cost_center', `key` = 'TREE.COST_CENTER' WHERE id = 219;
UPDATE `unit` SET `path` = '/allocation_center' WHERE id = 220;
UPDATE `unit` SET `path` = '/allocation_center/update' WHERE id = 221;
UPDATE `unit` SET `path` = '/allocation_center/allocation_key', `key` = 'TREE.ALLOCATION_KEYS' WHERE id = 223;
UPDATE `unit` SET `path` = '/reports/cost_center', `key` = 'TREE.COST_CENTER_REPORT' WHERE id = 222;
UPDATE `unit` SET `path` = '/reports/break_even_cost_center', `key` = 'TREE.BREAK_EVEN_COST_CENTER_REPORT' WHERE id = 232;
UPDATE `unit` SET `path` = '/cost_center/reports' WHERE id = 286;
UPDATE `unit` SET `path` = '/reports/cost_center_step_down', `key` = 'TREE.COST_CENTER_STEPDOWN'  WHERE id = 298;

UPDATE `report` SET `report_key` = 'cost_center', `title_key` = 'REPORT.COST_CENTER.TITLE' WHERE `report_key` = 'fee_center' OR `report_key` = 'cost_center';
UPDATE `report` SET `report_key` = 'break_even_cost_center', `title_key` = 'TREE.BREAK_EVEN_COST_CENTER_REPORT'  WHERE `report_key` = 'break_even_fee_center' OR `report_key` = 'break_even_cost_center';
UPDATE `report` SET `report_key` = 'cost_center_step_down', `title_key` = 'TREE.COST_CENTER_STEPDOWN'  WHERE `report_key` = 'fee_center_step_down' OR `report_key` = 'cost_center_step_down';


/**
author: @jmcameron
date: 2021-09-15
description: Add cost basis items
*/
INSERT IGNORE INTO `cost_center_allocation_basis` (`id`, `name`, `units`, `description`, `is_predefined`) VALUES
  (1, 'ALLOCATION_BASIS_DIRECT_COST', '', 'ALLOCATION_BASIS_DIRECT_COST_DESCRIPTION', 1),
  (2, 'ALLOCATION_BASIS_NUM_EMPLOYEES', '', 'ALLOCATION_BASIS_NUM_EMPLOYEES_DESCRIPTION', 1),
  (3, 'ALLOCATION_BASIS_AREA_USED', 'm²', 'ALLOCATION_BASIS_AREA_USED_DESCRIPTION', 1),
  (4, 'ALLOCATION_BASIS_ELECTRICITY_CONSUMED', 'kWh', 'ALLOCATION_BASIS_ELECTRICITY_CONSUMED_DESCRIPTION', 1),
  (5, 'ALLOCATION_BASIS_NUM_COMPUTERS', '', 'ALLOCATION_BASIS_NUM_COMPUTERS_DESCRIPTION', 1),
  (6, 'ALLOCATION_BASIS_NUM_LABOR_HOURS', 'h', 'ALLOCATION_BASIS_NUM_LABOR_HOURS_DESCRIPTION', 1);

/*
 * @author: mbayopanda
 * @date: 2021-09-12
 * @desc: cost center allocation registry
 */
INSERT IGNORE INTO `unit` VALUES
  (299, 'Allocation Keys','TREE.COST_CENTER_ALLOCATION_KEYS','List cost center allocation keys with values', 218,'/cost_center/allocation_keys');

ALTER TABLE `cost_center_allocation_basis_value`
  ADD CONSTRAINT unique_allocation_cost_center_basis UNIQUE (`cost_center_id`, `basis_id`);


/**
author: @lomamech
date: 2021-09-16
description: Add column cost_center_id  in Voucher Item
*/
CALL add_column_if_missing('voucher_item', 'cost_center_id', 'MEDIUMINT(8) UNSIGNED NULL');

CALL add_constraint_if_missing('voucher_item', 'voucher_item__cost_center_1', 'FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`) ON UPDATE CASCADE');

-- Update label in table account_reference_type
UPDATE account_reference_type AS art SET art.label = 'FORM.LABELS.COST_CENTER' WHERE art.id = 1;

/**
 * @author: mbayopanda
 * @desc: extend column for account_reference table
 */
ALTER TABLE `account_reference` MODIFY COLUMN `abbr` VARCHAR(200) NOT NULL;
ALTER TABLE `account_reference` MODIFY COLUMN `description` VARCHAR(200) NOT NULL;

/**
 * @author: mbayopanda
 * @desc: stock setting for cost center to use in case of stock loss
 */
CALL add_column_if_missing('stock_setting', 'default_cost_center_for_loss', 'MEDIUMINT(8) DEFAULT NULL');
/* WAS: ALTER TABLE `stock_setting` ADD COLUMN `default_cost_center_for_loss` MEDIUMINT(8) NULL; */

/**
* author: @jmcameron
* date: 2021-09-24
* description: Add lost stock report menu item
*/
INSERT IGNORE INTO `unit` VALUES
  (300, 'Lost Stock Report', 'TREE.LOST_STOCK_REPORT', 'Report on stock lost during depot transfers', 282, '/reports/lost_stock_report');

INSERT IGNORE INTO `report` (`report_key`, `title_key`) VALUES
   ('lost_stock_report', 'LOST_STOCK_REPORT');

/**
 * @author: mbayopanda
 * @desc: fix allocation bases link and report
 */
UPDATE `unit` SET `path` = '/cost_center/allocation_bases' WHERE id = 299;
INSERT IGNORE INTO `report` (`report_key`, `title_key`) VALUES
  ('cost_center_step_down', 'TREE.COST_CENTER_STEPDOWN');


/*
 * @author: jmcameron
 * @date: 2021-09-29
 * @desc: improvements to cost center allocation basis items
 */
CALL add_column_if_missing('cost_center_allocation_basis', 'is_currency', 'BOOLEAN DEFAULT 0 AFTER `is_predefined`');
CALL add_column_if_missing('cost_center_allocation_basis', 'decimal_places', 'TINYINT(2) DEFAULT 0 AFTER `is_currency`');
ALTER TABLE `cost_center_allocation_basis` MODIFY COLUMN `units` VARCHAR(200) DEFAULT '';

UPDATE `cost_center_allocation_basis` SET `decimal_places` = 2, `is_currency` = 1 WHERE id = 1;
UPDATE `cost_center_allocation_basis` SET `decimal_places` = 1, `units` = 'ALLOCATION_BASIS_AREA_USED_UNITS' WHERE id = 3;
UPDATE `cost_center_allocation_basis` SET `decimal_places` = 1, `units` = 'ALLOCATION_BASIS_ELECTRICITY_CONSUMED_UNITS' WHERE id = 4;
UPDATE `cost_center_allocation_basis` SET `decimal_places` = 1, `units` = 'ALLOCATION_BASIS_NUM_LABOR_HOURS_UNITS'  WHERE id = 6;

UPDATE `unit` SET `key` = 'TREE.DISTRIBUTION_KEYS_MANAGEMENT' WHERE id = 223;
UPDATE `unit` SET `name` = 'Allocation Bases', `key` = 'TREE.COST_CENTER_ALLOCATION_KEYS', `description` = 'List cost center allocation bases with values' WHERE `id` = 299;


/*
 * @author: mbayopanda
 * @desc: cost_center_id column in the account table
 */
CALL add_column_if_missing('account', 'cost_center_id', 'MEDIUMINT(8) UNSIGNED NULL');
CALL add_constraint_if_missing('account', 'account__cost_center', 'FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`)');


/*
 * @author: jmcameron
 * @date: 2021-10-01
 * @desc: auto generation of number of employees
 */
CALL add_column_if_missing('cost_center_allocation_basis', 'is_computed', 'BOOLEAN NOT NULL DEFAULT 0 AFTER `decimal_places`');
UPDATE `cost_center_allocation_basis` SET `is_computed` = 1 WHERE id = 2;

/*
 * @author: jmcameron
 * @date: 2021-10-12
 * @desc: Added more predefined cost center allocation basis items
 */
INSERT IGNORE INTO `cost_center_allocation_basis`
  (`id`, `name`, `units`, `description`, `is_predefined`, `is_currency`, `decimal_places`, `is_computed`)
VALUES
  (7, 'ALLOCATION_BASIS_NUM_PATIENTS', '', 'ALLOCATION_BASIS_NUM_PATIENTS_DESCRIPTION', 1, 0, 0, 0),
  (8, 'ALLOCATION_BASIS_NUM_LAB_TESTS', '', 'ALLOCATION_BASIS_NUM_LAB_TESTS_DESCRIPTION', 1, 0, 0, 0);

/*
 * @author: jmcameron
 * @date: 2021-10-15
 * @desc: Delete service_cost_center entries when referenced service or cost_center is deleted
 * NOTE: Had to to use drop_foreign_key() since it will not delete a constraint if it does not exist.
 *       Older databases might have used the old table name 'fee_center' instead of 'cost_center',
 *       so to be safe, we delete both the old and new names before re-adding the modified constraint.
 */

CALL drop_foreign_key('service_cost_center', 'service_fee_center__service');   -- old constraint name
CALL drop_foreign_key('service_cost_center', 'service_cost_center__service');
CALL add_constraint_if_missing('service_cost_center', 'service_cost_center__service', 'FOREIGN KEY (`service_uuid`) REFERENCES `service` (`uuid`) ON DELETE CASCADE');

CALL drop_foreign_key('service_cost_center', 'service_fee_center__fee_center');   -- old constraint name
CALL drop_foreign_key('service_cost_center', 'service_cost_center__cost_center');
CALL add_constraint_if_missing('service_cost_center', 'service_cost_center__cost_center', 'FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`) ON DELETE CASCADE');

/*
 * @author: mbayopanda
 * @desc: add is_income column in the cost_center_aggregate table
 */
CALL add_column_if_missing('cost_center_aggregate', 'is_income', 'TINYINT(1) NOT NULL DEFAULT 0');

/*
 * @author: lomamech
 * @date: 2021-10-20
 * @desc: base_index_growth_rate column in the enterprise_setting table
 */
CALL add_column_if_missing('enterprise_setting', 'base_index_growth_rate', 'TINYINT(3) UNSIGNED NOT NULL DEFAULT 0');

/*
 * @author: mbayopanda
 * @date: 2021-10-12
 */
INSERT INTO `unit` VALUES 
  (302, 'Cost Centers Accounts Report','TREE.COST_CENTER_ACCOUNTS_REPORT','Report of cc accounts values', 286,'/reports/cost_center_accounts');

INSERT INTO `report` (`report_key`, `title_key`) VALUES
  ('cost_center_accounts', 'TREE.COST_CENTER_ACCOUNTS_REPORT');
  
/**
 * @author: mbayopanda
 * @date: 2021-06-23
 */
DROP TABLE IF EXISTS `stock_value`;
CREATE TABLE  `stock_value` (
    `inventory_uuid` BINARY(16) NOT NULL,
    `date` DATE NOT NULL,
    `quantity` INT(11) NOT NULL,
    `wac` DECIMAL(19,4) NOT NULL,
    KEY `inventory_uuid` (`inventory_uuid`),
    INDEX `date` (`date`),
    CONSTRAINT `stock_value__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`)
) ENGINE=InnoDB;

/** Recompute stock values for all depots */
/** All databases in production must run this script */
CALL RecomputeStockValue(NULL);

/*
 * @author: mbayopanda
 * @date: 2021-10-21
 */
INSERT INTO `unit` VALUES 
  (303, 'Cost Centers Balance Report','TREE.COST_CENTER_INCOME_EXPENSE_REPORT','Report of cc balance', 286,'/reports/cost_center_income_and_expense');

INSERT INTO `report` (`report_key`, `title_key`) VALUES
  ('cost_center_income_and_expense', 'TREE.COST_CENTER_INCOME_EXPENSE_REPORT');

/*
 * @author: lomamech
 * @date: 2021-10-19
 * @desc: Payroll Settings
 */
INSERT IGNORE INTO `unit` VALUES
  (304, '[SETTINGS] Settings', 'TREE.PAYROLL_SETTINGS', 'Payroll Settings', 57, '/payroll/setting');

-- With this function, transactions related to employee payment are done in bulk and require that each expense account be linked to a cost center
CALL add_column_if_missing('enterprise_setting', 'posting_payroll_cost_center_mode', 'VARCHAR(100) NOT NULL DEFAULT "default"');


/*
 * @author: lomamech
 * @date: 2021-11-08
 * @desc: Update label and key and constraint Use payment instead paiement
 */
RENAME TABLE holiday_paiement TO holiday_payment,
  offday_paiement TO offday_payment,
  paiement TO payment,
  paiement_status TO payment_status,
  rubric_paiement TO rubric_payment;
  

ALTER TABLE `holiday_payment` RENAME COLUMN `paiement_uuid` TO `payment_uuid`;
ALTER TABLE `offday_payment` RENAME COLUMN `paiement_uuid` TO `payment_uuid`;
ALTER TABLE `payment` RENAME COLUMN `paiement_date` TO `payment_date`;
ALTER TABLE `rubric_payment` RENAME COLUMN `paiement_uuid` TO `payment_uuid`;

-- HOLIDAY PAYMENT
ALTER TABLE `holiday_payment`
	DROP INDEX `paiement_uuid`,
	ADD INDEX `payment_uuid` (`payment_uuid`) USING BTREE;

ALTER TABLE `holiday_payment`
	DROP FOREIGN KEY `holiday_paiement__holiday`,
	DROP FOREIGN KEY `holiday_paiement__paiment`;
ALTER TABLE `holiday_payment`
	ADD CONSTRAINT `holiday_payment__holiday` FOREIGN KEY (`holiday_id`) REFERENCES `holiday` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
	ADD CONSTRAINT `holiday_payment__paiment` FOREIGN KEY (`payment_uuid`) REFERENCES `payment` (`uuid`) ON UPDATE CASCADE ON DELETE CASCADE;


-- OFFDAY - PAYMENT
ALTER TABLE `offday_payment`
	DROP INDEX `paiement_uuid`,
	ADD INDEX `payment_uuid` (`payment_uuid`) USING BTREE;

ALTER TABLE `offday_payment`
	DROP FOREIGN KEY `offday_paiement__offday`,
	DROP FOREIGN KEY `offday_paiement__paiment`;
ALTER TABLE `offday_payment`
	ADD CONSTRAINT `offday_payment__offday` FOREIGN KEY (`offday_id`) REFERENCES `offday` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
	ADD CONSTRAINT `offday_payment__paiment` FOREIGN KEY (`payment_uuid`) REFERENCES `payment` (`uuid`) ON UPDATE CASCADE ON DELETE CASCADE;

-- PAYMENT
ALTER TABLE `payment`
	DROP INDEX `paiement_1`,
	ADD UNIQUE INDEX `payment_1` (`employee_uuid`, `payroll_configuration_id`) USING BTREE;

ALTER TABLE `payment`
	DROP FOREIGN KEY `paiement__currency`,
	DROP FOREIGN KEY `paiement__employee`,
	DROP FOREIGN KEY `paiement__payroll_configuration`,
	DROP FOREIGN KEY `paiement__pay_status`;
ALTER TABLE `payment`
	ADD CONSTRAINT `payment__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
	ADD CONSTRAINT `payment__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`) ON UPDATE RESTRICT ON DELETE RESTRICT,
	ADD CONSTRAINT `payment__payroll_configuration` FOREIGN KEY (`payroll_configuration_id`) REFERENCES `payroll_configuration` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
	ADD CONSTRAINT `payment__pay_status` FOREIGN KEY (`status_id`) REFERENCES `payment_status` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT;

-- RUBRIC PAYMENT
ALTER TABLE `rubric_payment`
	DROP FOREIGN KEY `rubric_paiement__paiement`,
	DROP FOREIGN KEY `rubric_paiement__rubric_payroll`;
ALTER TABLE `rubric_payment`
	ADD CONSTRAINT `rubric_payment__paiement` FOREIGN KEY (`payment_uuid`) REFERENCES `payment` (`uuid`) ON UPDATE CASCADE ON DELETE CASCADE,
	ADD CONSTRAINT `rubric_payment__rubric_payroll` FOREIGN KEY (`rubric_payroll_id`) REFERENCES `rubric_payroll` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE `rubric_payment`
	DROP INDEX `rubric_paiement_1`,
	ADD UNIQUE INDEX `rubric_payment_1` (`payment_uuid`, `rubric_payroll_id`) USING BTREE,
	DROP INDEX `paiement_uuid`,
	ADD INDEX `payment_uuid` (`payment_uuid`) USING BTREE;
