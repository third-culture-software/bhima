/* v1.6.1 to v1.7.0 */

ALTER TABLE `stock_consumption` MODIFY `period_id` MEDIUMINT(8) UNSIGNED NOT NULL;

ALTER TABLE `stock_consumption` ADD CONSTRAINT `fk_inventory_uuid_sc` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`);
ALTER TABLE `stock_consumption` ADD CONSTRAINT `fk_depot_uuid_sc` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`);
ALTER TABLE `stock_consumption` ADD CONSTRAINT `fk_period_id_sc` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`);

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
  `include_patient_data` TINYINT(1) NOT NULL DEFAULT 0,
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
  (254, 'Data Collection', 'TREE.DATA_COLLECTION', '', 0, '/modules/data_collection', '/data_collection'),
  (255, 'Fill Form', 'TREE.FILL_FORM', '', 254, '/modules/fill_form', '/fill_form'),
  (256, 'Display Metadata', 'TREE.DISPLAY_METADATA', '', 254, '/modules/display_metadata', '/display_metadata'),
  (257, 'Data Kit', 'TREE.DATA_KIT', 'Data Kit', 254, '/modules/data_kit', '/data_kit'),
  (258, 'Data Collector Management', 'TREE.FORMS_MANAGEMENT', '', 257, '/modules/data_collector_management', '/data_collector_management'),
  (259, 'Choices list management', 'TREE.CHOICES_LIST_MANAGEMENT', '', 257, '/modules/choices_list_management', '/choices_list_management'),
  (260, 'Survey Form', 'TREE.FORMS_CONFIGURATION', '', 257, '/modules/survey_form', '/survey_form'),  
  (261, 'Data Kit Report', 'TREE.DATA_KIT_REPORT', 'Data Kit Report', 144, '/modules/reports/dataKit', '/reports/dataKit');
  
INSERT INTO `report` (`report_key`, `title_key`) VALUES
  ('dataKit', 'TREE.DATA_KIT_REPORT');

-- Survey Form Type
INSERT INTO `survey_form_type` (`id`, `label`, `type`, `is_list`) VALUES
  (1, 'FORM.LABELS.NUMBER', 'number', 0),
  (2, 'FORM.LABELS.TEXT', 'text', 0),
  (3, 'FORM.LABELS.SELECT_ONE', 'select_one', 1),
  (4, 'FORM.LABELS.SELECT_MULTIPLE', 'select_multiple', 1),
  (5, 'FORM.LABELS.NOTE', 'note', 0),
  (6, 'FORM.LABELS.DATE', 'date', 0),
  (7, 'FORM.LABELS.TIME', 'time', 0),
  (8, 'FORM.LABELS.IMAGE', 'image', 0),
  (9, 'FORM.LABELS.CALCULATION', 'calculation', 0),
  (10, 'FORM.LABELS.TEXT_AREA', 'text_area', 0);
