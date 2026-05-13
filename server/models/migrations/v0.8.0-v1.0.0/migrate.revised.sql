/* #############################################################################
  Update bhima database for the version 0.9.0
 ############################################################################ */

/**
 * =============================================================================
 * STRUCTURE
 * =============================================================================
*/

-- the stock assign table
DROP TABLE IF EXISTS `stock_assign`;
CREATE TABLE `stock_assign` (
  `uuid`              BINARY(16) NOT NULL,
  `lot_uuid`          BINARY(16) NOT NULL,
  `entity_uuid`       BINARY(16) NOT NULL,
  `depot_uuid`        BINARY(16) NOT NULL,
  `quantity`          INT(11) NOT NULL DEFAULT 1,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `description`       TEXT NULL,
  `user_id`           SMALLINT(5) UNSIGNED NOT NULL,
  `updated_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  KEY `lot_uuid` (`lot_uuid`),
  KEY `entity_uuid` (`entity_uuid`),
  KEY `depot_uuid` (`depot_uuid`),
  FOREIGN KEY (`lot_uuid`) REFERENCES `lot` (`uuid`),
  FOREIGN KEY (`entity_uuid`) REFERENCES `entity` (`uuid`),
  FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`)
) ENGINE=InnoDB;


-- entity and entity_type table
DROP TABLE IF EXISTS `entity_type`;
CREATE TABLE `entity_type` (
  `id` SMALLINT(5) NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(190) NOT NULL,
  `translation_key` VARCHAR(190) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `entity`;
CREATE TABLE `entity` (
  `uuid`               BINARY(16) NOT NULL,
  `display_name`       VARCHAR(190) NOT NULL,
  `gender`             CHAR(1) NOT NULL,
  `email`              VARCHAR(150) NULL,
  `phone`              VARCHAR(50) NULL,
  `address`            VARCHAR(190) NULL,
  `entity_type_id`     SMALLINT(5) UNSIGNED NOT NULL,
  `reference`          INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reference`),
  UNIQUE KEY `entity_uuid` (`uuid`),
  UNIQUE KEY `display_name` (`display_name`),
  KEY `entity_type_id` (`entity_type_id`)
) ENGINE=InnoDB;

-- debtor_group_history table
DROP TABLE IF EXISTS `debtor_group_history`;
CREATE TABLE `debtor_group_history` (
  `uuid` BINARY(16) NOT NULL,
  `debtor_uuid` BINARY(16) DEFAULT NULL,
  `previous_debtor_group` BINARY(16) DEFAULT NULL,
  `next_debtor_group` BINARY(16) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` smallINT(5) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `debtor_uuid` (`debtor_uuid`),
  KEY `previous_debtor_group` (`previous_debtor_group`),
  KEY `next_debtor_group` (`next_debtor_group`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`debtor_uuid`) REFERENCES `debtor` (`uuid`),
  FOREIGN KEY (`previous_debtor_group`) REFERENCES `debtor_group` (`uuid`),
  FOREIGN KEY (`next_debtor_group`) REFERENCES `debtor_group` (`uuid`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB;


-- Remove the credit_balance and debit_balance property
ALTER TABLE `account_reference_item` DROP COLUMN `credit_balance`;
ALTER TABLE `account_reference_item` DROP COLUMN `debit_balance`;

-- department management
DROP TABLE IF EXISTS `department`;
CREATE TABLE `department`(
  `uuid` BINARY(16),
  `name` VARCHAR(100) NOT NULL,
  `enterprise_id` smallINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `enterprise_name` (`enterprise_id`, `name`),
  FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB;

-- tags table
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags`(
  `uuid` BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  UNIQUE KEY  (`name`)
) ENGINE=InnoDB;

-- remove project from role
ALTER TABLE role DROP INDEX project_role_label;
ALTER TABLE role DROP FOREIGN KEY `role_ibfk_1`;
ALTER TABLE role DROP column project_id;

-- add Unique Key in rubric_paiement
ALTER TABLE rubric_paiement ADD UNIQUE KEY `rubric_paiement_1` (`paiement_uuid`, `rubric_payroll_id`);

-- fee center modules
DROP TABLE IF EXISTS `fee_center`;
CREATE TABLE `fee_center` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(190) NOT NULL,
  `is_principal` tinyint(1) UNSIGNED DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fee_center_1` (`label`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `reference_fee_center`;
CREATE TABLE `reference_fee_center` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `account_reference_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `is_cost` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference_fee_center_1` (`account_reference_id`),
  KEY `fee_center_id` (`fee_center_id`),
  KEY `account_reference_id` (`account_reference_id`),
  FOREIGN KEY (`fee_center_id`) REFERENCES `fee_center` (`id`),
  FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `fee_center_distribution`;
CREATE TABLE `fee_center_distribution` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `row_uuid` BINARY(16) NOT NULL,
  `trans_id` VARCHAR(100) NOT NULL,
  `account_id` INT(10) UNSIGNED NOT NULL,
  `is_cost` tinyint(1) DEFAULT 0,
  `auxiliary_fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `principal_fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `debit_equiv` DECIMAL(19,8) NOT NULL DEFAULT 0.00,
  `credit_equiv` DECIMAL(19,8) NOT NULL DEFAULT 0.00,
  `date_distribution` DATETIME NOT NULL,
  `user_id`           SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  INDEX `row_uuid` (`row_uuid`),
  INDEX `account_id` (`account_id`),
  INDEX `trans_id` (`trans_id`),
  INDEX `auxiliary_fee_center_id` (`auxiliary_fee_center_id`),
  INDEX `principal_fee_center_id` (`principal_fee_center_id`),
  FOREIGN KEY (`row_uuid`) REFERENCES `general_ledger` (`uuid`),
  FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  FOREIGN KEY (`auxiliary_fee_center_id`) REFERENCES `fee_center` (`id`),
  FOREIGN KEY (`principal_fee_center_id`) REFERENCES `fee_center` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `service_fee_center`;
CREATE TABLE `service_fee_center` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `service_id` SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_fee_center_1` (`service_id`),
  KEY `fee_center_id` (`fee_center_id`),
  KEY `service_id` (`service_id`),
  FOREIGN KEY (`service_id`) REFERENCES `service` (`id`),
  FOREIGN KEY (`fee_center_id`) REFERENCES `fee_center` (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `distribution_key`;
CREATE TABLE `distribution_key` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `auxiliary_fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `principal_fee_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `auxiliary_fee_center_id` (`auxiliary_fee_center_id`),
  INDEX `principal_fee_center_id` (`principal_fee_center_id`),
  FOREIGN KEY (`auxiliary_fee_center_id`) REFERENCES `fee_center` (`id`),
  FOREIGN KEY (`principal_fee_center_id`) REFERENCES `fee_center` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- alter account table
ALTER TABLE account DROP COLUMN `classe`;

-- alter the lot table
ALTER TABLE lot ADD COLUMN `is_assigned` TINYINT(1) NULL DEFAULT 0;

-- alter the patient group table
ALTER TABLE `patient_group` MODIFY COLUMN `note` TEXT NULL;

-- missed from migrate
-- add account reference type table
DROP TABLE IF EXISTS `account_reference_type`;
CREATE TABLE `account_reference_type` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `fixed` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_reference_type_1` (`label`)
) ENGINE=InnoDB;

-- alter account reference table
ALTER TABLE `account_reference` ADD COLUMN `reference_type_id` MEDIUMINT(8) UNSIGNED NULL;


/**
 * =============================================================================
 * DATA
 * =============================================================================
*/

-- default entity types
INSERT INTO `entity_type` (`label`, `translation_key`) VALUES
  ('person', 'ENTITY.TYPE.PERSON'),
  ('service', 'ENTITY.TYPE.SERVICE'),
  ('office', 'ENTITY.TYPE.OFFICE'),
  ('enterprise', 'ENTITY.TYPE.ENTERPRISE');

-- Default Account Reference Type
INSERT INTO `account_reference_type` (`id`, `label`, `fixed`) VALUES
  (1, 'FORM.LABELS.COST_CENTER', 1),
  (2, 'FORM.LABELS.BALANCE_SHEET', 1),
  (3, 'FORM.LABELS.PROFIT_LOSS', 1);

-- Populate new reference numbers using the existing String equivalent
UPDATE posting_journal SET trans_id_reference_number = SUBSTR(trans_id, 4);
UPDATE general_ledger SET trans_id_reference_number = SUBSTR(trans_id, 4);

-- units
INSERT INTO unit VALUES
  (214, 'Department management','TREE.DEPARTMENT_MANAGEMENT','Department Management', 1,'/modules/department/','/departments'),
  (215, 'Income Expenses by Year', 'TREE.INCOME_EXPENSE_BY_YEAR', 'The Report of income and expenses', 144, '/modules/finance/income_expense_by_year', '/reports/income_expense_by_year'),
  (217, 'Tags','TREE.TAGS','', 1,'/modules/tags/tags','/tags'),
  (218, 'Fee Center Management','TREE.COST_CENTER_MANAGEMENT','', 0,'/modules/fee_center','/fee_center'),
  (219, 'Fee Center Management','TREE.COST_CENTER','', 218,'/modules/fee_center','/fee_center'),
  (220, 'Distributions fees Centers','TREE.DITRIBUTION_AUX_FEES_CENTERS','', 218,'/modules/distribution_center','/distribution_center'),
  (221, 'Update Distributions','TREE.UPDATE_DISTRIBUTION','', 218,'/modules/distribution_center/update','/distribution_center/update'),
  (222, 'Fee Center Report', 'TREE.COST_CENTER_REPORT', 'Fee Center Report', 144, '/modules/reports/feeCenter', '/reports/feeCenter'),
  (223, 'Distribution keys', 'TREE.DISTRIBUTION_KEYS', 'Distribution keys', 218, '/modules/distribution_center/distribution_key', '/distribution_center/distribution_key'),
  (224, 'Stock Assignment','ASSIGN.STOCK_ASSIGN','', 160,'/modules/stock/assign','/stock/assign'),
  (225, 'Account Reference Type','TREE.ACCOUNT_REFERENCE_TYPE','Account Reference Type', 1,'/modules/account_reference_type','/account_reference_type');

INSERT INTO `report` ( `report_key`, `title_key`) VALUES
  ('income_expense_by_year', 'REPORT.PROFIT_AND_LOSS_BY_YEAR'),
  ('feeCenter', 'REPORT.COST_CENTER.TITLE');

-- combine the two client reports into a single report
UPDATE report SET `report_key` = 'annual-clients-report', title_key = 'REPORT.CLIENTS.TITLE' WHERE id = 17;
UPDATE unit SET name = 'Annual Clients Report', `key` = 'REPORT.CLIENTS.TITLE',
  description = 'Annual Clients Report', parent = 144, url = '/modules/reports/clients', path = '/reports/annual-clients-report'
WHERE id = 199;

UPDATE role_unit SET unit_id = 199 WHERE unit_id = 159;
DELETE FROM unit WHERE id = 159;
DELETE FROM report WHERE id = 9;

-- Add new transaction type
INSERT INTO `transaction_type` (`text`, `type`, `fixed`) VALUES
  ('VOUCHERS.SIMPLE.TRANSFER_AUXILIARY', 'expense', 1),
  ('VOUCHERS.SIMPLE.RECEPTION_FUNDS_AUXILIARY', 'income', 1),
  ('VOUCHERS.SIMPLE.PROVISIONING_PRINCIPAL', 'income', 1),
  ('VOUCHERS.SIMPLE.TRANSFER_FUNDS_BANKS', 'expense', 1),
  ('VOUCHERS.SIMPLE.EXIT_FUNDS_BANK', 'expense', 1),
  ('VOUCHERS.SIMPLE.BANK_CASH_APPROVALS', 'income', 1);

UPDATE unit SET `key` = 'REPORT.PROFIT_AND_LOSS' WHERE id = 180;
UPDATE unit SET `key` = 'REPORT.PROFIT_AND_LOSS_BY_MONTH' WHERE id = 211;
UPDATE unit SET `key` = 'REPORT.PROFIT_AND_LOSS_BY_YEAR' WHERE id = 215;

UPDATE report SET title_key = 'REPORT.PROFIT_AND_LOSS' WHERE id = 3;
UPDATE report SET title_key = 'REPORT.PROFIT_AND_LOSS_BY_MONTH' WHERE id = 24;

UPDATE report SET
  `report_key`='unpaid-invoice-payments', `title_key`='REPORT.UNPAID_INVOICE_PAYMENTS_REPORT.TITLE'
WHERE id = 23;

UPDATE unit SET
  `name`='Unpaid Invoice Payments', `key`='REPORT.UNPAID_INVOICE_PAYMENTS_REPORT.TITLE', `url`='/modules/reports/unpaid-invoice-payments', `path`='/reports/unpaid-invoice-payments'
WHERE id = 213;

-- delete unbalanced invoice paiement entry
DELETE FROM role_unit WHERE unit_id = 210;
DELETE FROM unit WHERE id = 210;
