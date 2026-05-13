-- @jniles: remove tables that aren't supposed to be created or have been removed;
DROP TABLE IF EXISTS tmp_invoice_balances;
DROP TABLE IF EXISTS tmp_invoices_1;
DROP TABLE IF EXISTS tmp_invoices_2;
DROP TABLE IF EXISTS tmp_records;
DROP TABLE IF EXISTS tmp_references;

-- @jniles: remove 1.x tables (finally!)
DROP TABLE IF EXISTS mod_snis_zs;
DROP TABLE IF EXISTS consumption_loss;
DROP TABLE IF EXISTS consumption_patient;
DROP TABLE IF EXISTS consumption_service;
DROP TABLE IF EXISTS consumption;
DROP TABLE IF EXISTS journal_log;

DROP TABLE IF EXISTS cost_center_assignation_item;
DROP TABLE IF EXISTS cost_center_assignation;

-- foriegn key on account_ibfk_3
ALTER TABLE account DROP FOREIGN KEY `account_ibfk_3`;
ALTER TABLE account DROP COLUMN cc_id;

ALTER TABLE posting_journal DROP FOREIGN KEY `posting_journal_ibfk_7` ;
ALTER TABLE posting_journal DROP COLUMN cc_id;
ALTER TABLE posting_journal DROP FOREIGN KEY `posting_journal_ibfk_8` ;
ALTER TABLE posting_journal DROP COLUMN pc_id;

ALTER TABLE general_ledger DROP FOREIGN KEY `general_ledger_ibfk_7` ;
ALTER TABLE general_ledger DROP COLUMN cc_id;
ALTER TABLE general_ledger DROP FOREIGN KEY `general_ledger_ibfk_8` ;
ALTER TABLE general_ledger DROP COLUMN pc_id;

-- UNIQUE KEY on service's cost_center and profit_center
ALTER TABLE service DROP KEY `service_2`;
ALTER TABLE service DROP FOREIGN KEY `service_ibfk_2`;
ALTER TABLE service DROP COLUMN cost_center_id;
ALTER TABLE service DROP FOREIGN KEY `service_ibfk_3`;
ALTER TABLE service DROP COLUMN profit_center_id;

DROP TABLE IF EXISTS profit_center;
DROP TABLE IF EXISTS cost_center;

/*
 @author: mbayopanda
 @date: 2019-08-22
 @description: issue #3856
*/
INSERT INTO `unit` VALUES 
  (246, 'Client debts report', 'TREE.CLIENT_DEBTS_REPORT', 'Client debts report', 144, '/modules/reports/clientDebts', '/reports/clientDebts'),
  (247, 'Client support report', 'TREE.CLIENT_SUPPORT_REPORT', 'Client support report', 144, '/modules/reports/clientSupport', '/reports/clientSupport');

INSERT INTO `report` (`id`, `report_key`, `title_key`) VALUES 

  (36, 'clientDebts', 'REPORT.CLIENT_SUMMARY.TITLE'),
  (37, 'clientSupport', 'REPORT.CLIENT_SUPPORT.TITLE');

-- author: lomamech
-- date: 2019-08-30
-- Analysis of auxiliary cashboxes.
INSERT INTO unit VALUES
  (248, 'Analysis of cashboxes', 'REPORT.ANALYSIS_AUX_CASHBOXES.TITLE', 'Analysis of auxiliary cashboxes', 144, '/modules/reports/analysisAuxiliaryCash', '/reports/analysisAuxiliaryCash');

INSERT INTO report (id, report_key, title_key) VALUES
  (38, 'analysisAuxiliaryCash', 'REPORT.ANALYSIS_AUX_CASHBOXES.TITLE');
  (37, 'clientDebts', 'REPORT.CLIENT_SUMMARY.TITLE'),
  (38, 'clientSupport', 'REPORT.CLIENT_SUPPORT.TITLE');
  
/*
 * @author: lomamech
 * @date: 2019-08-28
 * @description: bhima_data_collector
*/
DROP TABLE IF EXISTS `data_collector_management`;
CREATE TABLE `data_collector_management` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT, 
  `label` VARCHAR(100) NOT NULL, 
  `description` TEXT, 
  `version_number` INT(11) UNSIGNED NOT NULL,
  `color` VARCHAR(8) NULL, 
  `is_related_patient` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`), 
  UNIQUE KEY `data_collector_management_1` (`label`, `version_number`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `choices_list_management`;
CREATE TABLE `choices_list_management` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT, 
  `name` VARCHAR(100) NOT NULL, 
  `label` VARCHAR(100) NOT NULL, 
  `fixed` tinyint(1) DEFAULT 0, 
  `parent` MEDIUMINT(8) UNSIGNED DEFAULT 0,
  `group_label` MEDIUMINT(8) UNSIGNED DEFAULT 0, 
  `is_group` tinyint(1) NOT NULL DEFAULT 0,
  `is_title` tinyint(1) NOT NULL DEFAULT 0, 
  PRIMARY KEY (`id`), 
  UNIQUE KEY `choices_list_management_1` (`label`, `name`, `parent`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `survey_form`;
CREATE TABLE `survey_form` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `data_collector_management_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `choice_list_id` MEDIUMINT(8) UNSIGNED NULL,
  `filter_choice_list_id` MEDIUMINT(8) UNSIGNED NULL,
  `other_choice` tinyint(1) DEFAULT 0,
  `name` VARCHAR(100) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `hint` TEXT,
  `required` tinyint(1) DEFAULT 0,
  `constraint` VARCHAR(100) NULL,
  `default` VARCHAR(100) NULL,
  `calculation` VARCHAR(100) NULL,
  `rank` SMALLINT(5) UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `survey_form_1` (`data_collector_management_id`, `name`, `label`),
  KEY `data_collector_management_id` (`data_collector_management_id`),
  FOREIGN KEY (`data_collector_management_id`) REFERENCES `data_collector_management` (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `survey_form_type`;
CREATE TABLE `survey_form_type` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `is_list` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `survey_data`;
CREATE TABLE `survey_data` (
  `uuid` BINARY(16),
  `data_collector_management_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`uuid`),
  KEY `data_collector_management_id` (`data_collector_management_id`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`data_collector_management_id`) REFERENCES `data_collector_management` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `survey_data_item`;
CREATE TABLE `survey_data_item` (
  `uuid` BINARY(16),
  `survey_form_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `survey_form_label` VARCHAR(100),
  `survey_data_uuid` BINARY(16) NOT NULL,
  `value` text,
  PRIMARY KEY (`uuid`),
  KEY `survey_form_id` (`survey_form_id`),
  KEY `survey_data_uuid` (`survey_data_uuid`),
  FOREIGN KEY (`survey_form_id`) REFERENCES `survey_form` (`id`),
  FOREIGN KEY (`survey_data_uuid`) REFERENCES `survey_data` (`uuid`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `survey_data_log`;
CREATE TABLE `survey_data_log` (
  `uuid` BINARY(16),
  `log_uuid` BINARY(16),
  `survey_form_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `survey_form_label` VARCHAR(100),
  `survey_data_uuid` BINARY(16) NOT NULL,
  `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  `status` VARCHAR(20),
  `value` text,
  PRIMARY KEY (`uuid`),
  KEY `survey_form_id` (`survey_form_id`),
  KEY `survey_data_uuid` (`survey_data_uuid`),
  FOREIGN KEY (`survey_form_id`) REFERENCES `survey_form` (`id`),
  FOREIGN KEY (`survey_data_uuid`) REFERENCES `survey_data` (`uuid`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `medical_sheet`;
CREATE TABLE `medical_sheet` (
  `survey_data_uuid` BINARY(16),
  `patient_uuid` BINARY(16),
  FOREIGN KEY (`survey_data_uuid`) REFERENCES `survey_data` (`uuid`),
  FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`)
) ENGINE=InnoDB;


INSERT INTO `unit` VALUES
  (246, 'Data Kit', 'TREE.DATA_KIT', 'Data Kit', 0, '/modules/data_kit', '/data_kit'),
  (247, 'Data Collector Management', 'TREE.FORMS_MANAGEMENT', '', 246, '/modules/data_collector_management', '/data_collector_management'),
  (248, 'Choices list management', 'TREE.CHOICES_LIST_MANAGEMENT', '', 246, '/modules/choices_list_management', '/choices_list_management'),
  (249, 'Survey Form', 'TREE.FORMS_CONFIGURATION', '', 246, '/modules/survey_form', '/survey_form'),
  (250, 'Data Collection', 'TREE.DATA_COLLECTION', '', 0, '/modules/data_collection', '/data_collection'),
  (251, 'Fill Form', 'TREE.FILL_FORM', '', 250, '/modules/fill_form', '/fill_form'),
  (252, 'Display Metadata', 'TREE.DISPLAY_METADATA', '', 250, '/modules/display_metadata', '/display_metadata'),
  (253, 'Data Kit Report', 'TREE.DATA_KIT_REPORT', 'Data Kit Report', 144, '/modules/reports/dataKit', '/reports/dataKit');

INSERT INTO `report` (`id`, `report_key`, `title_key`) VALUES
  (36, 'dataKit', 'TREE.DATA_KIT_REPORT');

-- Survey Form Type
INSERT INTO `survey_form_type` (`label`, `type`, `is_list`) VALUES
  ('FORM.LABELS.NUMBER', 'number', 0),
  ('FORM.LABELS.TEXT', 'text', 0),
  ('FORM.LABELS.SELECT_ONE', 'select_one', 1),
  ('FORM.LABELS.SELECT_MULTIPLE', 'select_multiple', 1),
  ('FORM.LABELS.NOTE', 'note', 0),
  ('FORM.LABELS.DATE', 'date', 0),
  ('FORM.LABELS.TIME', 'time', 0),
  ('FORM.LABELS.IMAGE', 'image', 0),
  ('FORM.LABELS.CALCULATION', 'calculation', 0),
  ('FORM.LABELS.TEXT_AREA', 'text_area', 0);

-- BHIMA DATA COLLECTOR
