-- change the pavillion table to ward table
-- RENAME TABLE pavillion TO ward;

-- insert unit
INSERT INTO unit VALUES
  (227, 'Ward Module', 'TREE.WARD', 'Ward folder', 0, '/modules/ward/configuration', '/WARD_FOLDER'),
  (228, 'Ward Configurations', 'TREE.WARD_CONFIGURATION', 'Ward configuration module', 227, '/modules/ward/configuration', '/ward/configuration'),
  (229, 'Visits Registry', 'TREE.VISITS_REGISTRY', 'Visits registry', 12, '/modules/patient/visits', '/patients/visits');

DROP TABLE IF EXISTS `ward`;
CREATE TABLE `ward`(
 `uuid` BINARY(16) NOT NULL,
 `name` VARCHAR(100) NOT NULL,
 `description` text NULL,
 `service_id` SMALLINT(5) UNSIGNED NULL,
  PRIMARY KEY(`uuid`),
  KEY `name_1` (`name`),
  FOREIGN KEY (`service_id`) REFERENCES `service` (`id`)
)ENGINE=InnoDB ;


-- patient management tables
DROP TABLE IF EXISTS `room_type`;
CREATE TABLE `room_type`(
 `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
 `label` VARCHAR(120) NOT NULL,
  PRIMARY KEY(`id`)
)ENGINE=InnoDB ;

DROP TABLE IF EXISTS `room`;
CREATE TABLE `room`(
 `uuid` BINARY(16) NOT NULL,
 `label` VARCHAR(120) NOT NULL,
 `description` text NULL,
 `ward_uuid` BINARY(16) NOT NULL,
 `room_type_id` SMALLINT(5) UNSIGNED NULL,
  PRIMARY KEY(`uuid`),
  UNIQUE KEY `room_label_0` (`label`, `ward_uuid`),
  FOREIGN KEY (`ward_uuid`) REFERENCES ward (`uuid`),
  FOREIGN KEY (`room_type_id`) REFERENCES room_type (`id`)
)ENGINE=InnoDB ;

DROP TABLE IF EXISTS `bed`;
CREATE TABLE `bed`(
 `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
 `label` VARCHAR(120) NOT NULL,
 `room_uuid` BINARY(16) NOT NULL,
 `is_occupied` TINYINT(1) NOT NULL DEFAULT 0,
 `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY(`id`),
  UNIQUE KEY `bed_label_0` (`label`, `room_uuid`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  FOREIGN KEY (`room_uuid`) REFERENCES room (`uuid`)
)ENGINE=InnoDB ;


DROP TABLE IF EXISTS `discharge_type`;
CREATE TABLE `discharge_type` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `discharge_type_1` (`id`, `label`)
) ENGINE=InnoDB;

-- ALTER TABLE patient visit

ALTER TABLE `patient_visit` ADD COLUMN `hospitalized` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `patient_visit` ADD COLUMN `last_service_id` SMALLINT(5) UNSIGNED NOT NULL;
ALTER TABLE `patient_visit` ADD COLUMN `discharge_type_id` SMALLINT(5) UNSIGNED NULL;
ALTER TABLE `patient_visit` ADD COLUMN `inside_health_zone` TINYINT(1);
ALTER TABLE `patient_visit` ADD COLUMN `is_pregnant` TINYINT(1) DEFAULT 0;
ALTER TABLE `patient_visit` ADD COLUMN `is_refered` TINYINT(1) DEFAULT 0;
ALTER TABLE `patient_visit` ADD COLUMN `is_new_case` TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE `patient_visit` ADD KEY `last_service_id` (`last_service_id`);
ALTER TABLE `patient_visit` ADD KEY `discharge_type_id` (`discharge_type_id`);

DROP TABLE IF EXISTS `patient_visit_service`;
CREATE TABLE `patient_visit_service` (
  `uuid`               BINARY(16) NOT NULL,
  `date`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `patient_visit_uuid` BINARY(16) NOT NULL,
  `service_id`         SMALLINT(5) UNSIGNED NOT NULL,
  `created_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`uuid`),
   FOREIGN KEY (`patient_visit_uuid`) REFERENCES `patient_visit` (`uuid`) ON UPDATE CASCADE,
   FOREIGN KEY (`service_id`) REFERENCES `service` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `patient_hospitalization`;
CREATE TABLE `patient_hospitalization` (
  `uuid`               BINARY(16) NOT NULL,
  `date`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `patient_visit_uuid` BINARY(16) NOT NULL,
  `patient_uuid`       BINARY(16) NOT NULL,
  `room_uuid`          BINARY(16) NOT NULL,
  `bed_id`             SMALLINT(5) UNSIGNED NOT NULL,
  `created_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`uuid`),
   FOREIGN KEY (`patient_visit_uuid`) REFERENCES `patient_visit` (`uuid`) ON UPDATE CASCADE,
   FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`) ON UPDATE CASCADE,
   FOREIGN KEY (`room_uuid`) REFERENCES `room` (`uuid`) ON UPDATE CASCADE,
   FOREIGN KEY (`bed_id`) REFERENCES `bed` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Putting depot to stock module
UPDATE unit SET parent = 160, `key` = 'DEPOT.TITLE' WHERE id = 20;
DELETE FROM role_unit WHERE unit_id=196;
DELETE FROM unit WHERE id=196;

-- @lomamech 2019-01-22 Break Even
INSERT INTO `report` (`report_key`, `title_key`) VALUES
  ('breakEven', 'TREE.BREAK_EVEN_REPORT');

-- the Break Even Reference unit
INSERT INTO unit VALUES
  (230, 'Break Even Reference','TREE.BREAK_EVEN_REFERENCE','Break Even Reference', 1,'/modules/break_even_reference','/break_even_reference'),
  (231, 'Break-even Report', 'TREE.BREAK_EVEN_REPORT', 'Break-even Report', 144, '/modules/reports/breakEven', '/reports/breakEven');

DROP TABLE IF EXISTS `break_even_reference`;
CREATE TABLE `break_even_reference` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT, 
  `label` VARCHAR(100) NOT NULL, 
  `is_cost` tinyint(1) DEFAULT 0, 
  `is_variable` tinyint(1) UNSIGNED DEFAULT 0,
  `is_turnover` tinyint(1) UNSIGNED DEFAULT 0,   
  `account_reference_id` MEDIUMINT(8) UNSIGNED NOT NULL, 
  PRIMARY KEY (`id`), 
  UNIQUE KEY `break_even_reference_1` (`label`), 
  KEY `account_reference_id` (`account_reference_id`), 
  FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`)   
) ENGINE=InnoDB;
-- End Break Even

-- @lomamech 2019-02-13
ALTER TABLE `fee_center` CHANGE COLUMN `is_principal` `is_principal` TINYINT(1) UNSIGNED DEFAULT '0';
ALTER TABLE `reference_fee_center` CHANGE COLUMN `is_cost` `is_cost` TINYINT(1) UNSIGNED DEFAULT '0';
ALTER TABLE `fee_center_distribution` CHANGE COLUMN `is_cost` `is_cost` TINYINT(1) UNSIGNED DEFAULT '0';

ALTER TABLE `reference_fee_center` ADD COLUMN `is_variable` TINYINT(1) UNSIGNED DEFAULT '0';
ALTER TABLE `reference_fee_center` ADD COLUMN `is_turnover` TINYINT(1) UNSIGNED DEFAULT '0';

-- Break Even By Fee Center unit
INSERT INTO unit VALUES
(232, 'Break Even By Fee Center', 'TREE.BREAK_EVEN_COST_CENTER_REPORT', 'Break-even By Fee Center Report', 144, '/modules/reports/breakEvenFeeCenter', '/reports/breakEvenFeeCenter');

-- @lomamech 2019-02-21 Break Even
INSERT INTO `report` (`report_key`, `title_key`) VALUES
('breakEvenFeeCenter', 'TREE.BREAK_EVEN_COST_CENTER_REPORT');

-- @lomamech 2019-02-25 fee center distribution
ALTER TABLE `fee_center_distribution` ADD COLUMN `is_variable` TINYINT(1) UNSIGNED DEFAULT '0';
ALTER TABLE `fee_center_distribution` ADD COLUMN `is_turnover` TINYINT(1) UNSIGNED DEFAULT '0';

-- @lomamech 2019-03-07
-- Default Account Reference Type
INSERT INTO `account_reference_type` (`id`, `label`, `fixed`) VALUES 
(4, 'FORM.LABELS.BREAK_EVEN', 1);

-- @lomamech 2019-03-11
ALTER TABLE `voucher` ADD COLUMN `posted` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0;


/**
* dashboard indicators tables
* @author: mbayopanda
* @date: 3/26/2019
**/
DROP TABLE IF EXISTS `indicator_status`;
CREATE TABLE `indicator_status` (
  `id` SMALLINT(5) UNSIGNED NOT NULL,
  `text` VARCHAR(40) NOT NULL,
  `translate_key` VARCHAR(100) NOT NULL,
  PRIMARY KEY(`id`)
)ENGINE=InnoDB;

DROP TABLE IF EXISTS `indicator_type`;
CREATE TABLE `indicator_type` (
  `id` SMALLINT(5) UNSIGNED NOT NULL,
  `text` VARCHAR(40) NOT NULL,
  `translate_key` VARCHAR(100) NOT NULL,
  PRIMARY KEY(`id`)
)ENGINE=InnoDB;

DROP TABLE IF EXISTS `indicator`;
CREATE TABLE `indicator` (
  `uuid` BINARY(16) NOT NULL,
  `service_id`SMALLINT(5) UNSIGNED NULL,
  `status_id` SMALLINT(5) UNSIGNED NOT NULL,
  `period_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  `type_id` SMALLINT(5) UNSIGNED NOT NULL,
  `created_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `unique_indicator_1` (`service_id`, `period_id`),
  FOREIGN KEY (`period_id`) REFERENCES `period` (`id`) ON UPDATE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  FOREIGN KEY (`status_id`) REFERENCES `indicator_status` (`id`) ON UPDATE CASCADE,
  FOREIGN KEY (`type_id`) REFERENCES `indicator_type` (`id`) ON UPDATE CASCADE
)ENGINE=InnoDB;

DROP TABLE IF EXISTS `hospitalization_indicator`;
CREATE TABLE `hospitalization_indicator` (
  `uuid` BINARY(16),
  `total_day_realized` INT DEFAULT 0,
  `total_beds` INT DEFAULT 0,
  `total_hospitalized_patient` INT DEFAULT 0,
  `total_external_patient` INT DEFAULT 0,
  `total_death` INT DEFAULT 0,  
  `indicator_uuid` BINARY(16) NOT NULL,
  PRIMARY KEY (`uuid`),
  FOREIGN KEY (`indicator_uuid`) REFERENCES `indicator` (`uuid`) ON UPDATE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `staff_indicator`;
CREATE TABLE `staff_indicator` (
  `uuid` BINARY(16),
  `total_doctors` INT DEFAULT 0,
  `total_nurses` INT DEFAULT 0,
  `total_caregivers` INT DEFAULT 0,
  `total_staff` INT DEFAULT 0,
  `total_external_visit` INT DEFAULT 0,
  `total_visit` INT DEFAULT 0,
  `total_surgery_by_doctor` INT DEFAULT 0,
  `total_day_realized` INT DEFAULT 0,
  `total_hospitalized_patient` INT DEFAULT 0,
  `indicator_uuid` BINARY(16) NOT NULL,
  PRIMARY KEY (`uuid`),
  FOREIGN KEY (`indicator_uuid`) REFERENCES `indicator` (`uuid`) ON UPDATE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `finance_indicator`;
CREATE TABLE `finance_indicator` (
  `uuid` BINARY(16),
  `total_revenue` INT DEFAULT 0,
  `total_subsidies` INT DEFAULT 0,
  `total_drugs_sale` INT DEFAULT 0,
  `total_expenses` INT DEFAULT 0,
  `total_other_charge` INT DEFAULT 0,
  `total_drugs_purchased` INT DEFAULT 0,
  `total_staff_charge` INT DEFAULT 0,
  `total_operating_charge` INT DEFAULT 0,
  `total_depreciation` INT DEFAULT 0,
  `total_debts` INT DEFAULT 0,
  `total_cash` INT DEFAULT 0,
  `total_stock_value` INT DEFAULT 0,
  `total_staff` INT DEFAULT 0,
  `indicator_uuid` BINARY(16) NOT NULL,
  PRIMARY KEY (`uuid`),
  FOREIGN KEY (`indicator_uuid`) REFERENCES `indicator` (`uuid`) ON UPDATE CASCADE
) ENGINE=InnoDB; 

-- indicators status values
INSERT INTO `indicator_status`(`id`, `text`,`translate_key`)VALUES
  (1, 'incomplete', 'FORM.LABELS.INCOMPLETE'),
  (2, 'complete', 'FORM.LABELS.COMPLETE'),
  (3, 'validated', 'FORM.LABELS.VALIDATED');

-- indicators types
INSERT INTO `indicator_type`(`id`, `text`,`translate_key`)VALUES
  (1, 'hospitalization', 'DASHBOARD.HOSPITALIZATION'),
  (2, 'staff', 'DASHBOARD.STAFF'),
  (3, 'finance', 'DASHBOARD.FINANCE');

-- dashbord folder
INSERT INTO `unit` VALUES 
  (233, 'Dashboards Folder', 'TREE.DASHBOARDS.TITLE', 'Tableaux de bord', 0, '/modules/patient/visits', '/DASHBOARDS_FOLDER'),
  (234, 'Indicators Files Registry', 'TREE.DASHBOARDS.INDICATORS_FILES_REGISTRY', 'Registre des fiches des indicateurs', 233, '/modules/dashboards/indicators_files_registry/', '/dashboards/indicators_files_registry'),
  (235, 'Hospitalization dashboard', 'TREE.DASHBOARDS.HOSPITALIZATION', 'Tableau de bord des hospitalisations', 233, '/modules/dashboards/hospitalization/', '/dashboards/hospitalization'),
  (236, 'Human Resources dashboard', 'TREE.DASHBOARDS.HUMAN_RESOURCES', 'Tableau de bord du Personnel', 233, '/modules/dashboards/staff/', '/dashboards/staff'),
  (237, 'Finances dashboard', 'TREE.DASHBOARDS.FINANCES', 'Tableau de bord des finances', 233, '/modules/dashboards/finances/', '/dashboards/finances');


-- jeremie lodi, indicators report
INSERT INTO `unit` VALUES 
(238, 'Indicators report', 'TREE.INDICATORS_REPORT', 'Rapport sur les indicateurs', 144,'/modules/reports/indicatorsReport', '/reports/indicatorsReport');
INSERT INTO `report` (`id`, `report_key`, `title_key`) 
VALUES  (31, 'indicatorsReport', 'TREE.INDICATORS_REPORT');

-- @lomamech 2019-04-09 Add Property project_id on fee_center table
ALTER TABLE `fee_center` ADD COLUMN `project_id` SMALLINT(5) UNSIGNED NULL;
