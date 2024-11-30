SET foreign_key_checks = 0;

SET names 'utf8mb4';
SET character_set_database = 'utf8mb4';
SET collation_database = 'utf8mb4_unicode_ci';
SET CHARACTER SET utf8mb4, CHARACTER_SET_CONNECTION = utf8mb4;

DROP TABLE IF EXISTS `account`;

CREATE TABLE `account` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `enterprise_id` SMALLINT(5) UNSIGNED NOT NULL,
  `number` INT(11) UNSIGNED NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `parent` INT(10) UNSIGNED NOT NULL,
  `locked` TINYINT(1) NOT NULL DEFAULT 0,
  `hidden` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reference_id` TINYINT(3) UNSIGNED DEFAULT NULL,
  `cost_center_id` MEDIUMINT(8) UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_1` (`number`),
  KEY `type_id` (`type_id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `reference_id` (`reference_id`),
  KEY `cost_center_id` (`cost_center_id`),
  CONSTRAINT `account__account_type` FOREIGN KEY (`type_id`) REFERENCES `account_type` (`id`),
  CONSTRAINT `account__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `account__reference` FOREIGN KEY (`reference_id`) REFERENCES `reference` (`id`),
  CONSTRAINT `account__cost_center` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `account_category`;
CREATE TABLE `account_category` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `category` VARCHAR(35) NOT NULL,
  `translation_key` VARCHAR(35) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_category_1` (`category`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `account_type`;
CREATE TABLE `account_type` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(35) NOT NULL,
  `translation_key` VARCHAR(35) NOT NULL,
  `account_category_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_type_1` (`type`),
  KEY `account_category_id` (`account_category_id`),
  CONSTRAINT `acc_type__acc_category` FOREIGN KEY (`account_category_id`) REFERENCES `account_category` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `account_reference`;
CREATE TABLE `account_reference` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `abbr` VARCHAR(200) NOT NULL,
  `description` VARCHAR(200) NOT NULL,
  `parent` MEDIUMINT(8) UNSIGNED NULL,
  `reference_type_id` MEDIUMINT(8) UNSIGNED NULL,
  `is_amo_dep` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Ammortissement or depreciation',
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_reference_1` (`abbr`, `is_amo_dep`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `account_reference_item`;
CREATE TABLE `account_reference_item` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `account_reference_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `account_id` INT(10) UNSIGNED NOT NULL,
  `is_exception` TINYINT(1) NULL DEFAULT 0 COMMENT 'Except this for reference calculation',
  `credit_balance` TINYINT(1) NULL DEFAULT 0 COMMENT 'Only if credit balance',
  `debit_balance` TINYINT(1) NULL DEFAULT 0 COMMENT 'Only if debit balance',
  PRIMARY KEY (`id`),
  KEY `account_reference_id` (`account_reference_id`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `acc_ref_item__acc_ref` FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`),
  CONSTRAINT `acc_ref_item__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `patient_assignment`;
CREATE TABLE `patient_assignment` (
  `uuid`                BINARY(16) NOT NULL,
  `patient_group_uuid`  BINARY(16) NOT NULL,
  `patient_uuid`        BINARY(16) NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `patient_group_uuid` (`patient_group_uuid`),
  KEY `patient_uuid` (`patient_uuid`),
  CONSTRAINT `patient_assignment__patient_group` FOREIGN KEY (`patient_group_uuid`) REFERENCES `patient_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `patient_assignment__patient` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS invoicing_fee;
CREATE TABLE invoicing_fee (
  `id`              SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `account_id`      INT(10) UNSIGNED NOT NULL,
  `label`           VARCHAR(191) NOT NULL,
  `description`     TEXT NOT NULL,
  `value`           DECIMAL(10,4) UNSIGNED NOT NULL,
  `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoicing_fee_1` (`label`),
  UNIQUE KEY `invoicing_fee_2` (`account_id`, `label`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `invoicing_fee__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `budget`;
CREATE TABLE `budget` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `account_id` INT UNSIGNED NOT NULL,
  `period_id` MEDIUMINT(8) UNSIGNED NOT NULL, -- FY period.number=0 => FY budget total
  `budget` DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0,
  `locked` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `account_id` (`account_id`),
  KEY `period_id` (`period_id`),
  CONSTRAINT `budget__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `budget__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
  UNIQUE KEY `budget_1` (`account_id`, `period_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cash`;
CREATE TABLE `cash` (
  `uuid`            BINARY(16) NOT NULL,
  `project_id`      SMALLINT(5) UNSIGNED NOT NULL,
  `reference`       INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `date`            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `debtor_uuid`     BINARY(16) NOT NULL,
  `currency_id`     TINYINT(3) UNSIGNED NOT NULL,
  `amount`          DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `user_id`         SMALLINT(5) UNSIGNED NOT NULL,
  `cashbox_id`      MEDIUMINT(8) UNSIGNED NOT NULL,
  `description`     TEXT,
  `is_caution`      BOOLEAN NOT NULL DEFAULT 0,
  `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reversed`        TINYINT NOT NULL DEFAULT 0,
  `edited`          TINYINT NOT NULL DEFAULT 0,
  `posted`            TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `cash_1` (`reference`, `project_id`),
  KEY `project_id` (`project_id`),
  KEY `reference` (`reference`),
  KEY `debtor_uuid` (`debtor_uuid`),
  KEY `user_id` (`user_id`),
  KEY `cashbox_id` (`cashbox_id`),
  CONSTRAINT `cash__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `cash__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `cash__debtor` FOREIGN KEY (`debtor_uuid`) REFERENCES `debtor` (`uuid`),
  CONSTRAINT `cash__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `cash__cashbox` FOREIGN KEY (`cashbox_id`) REFERENCES `cash_box` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cash_item`;
CREATE TABLE `cash_item` (
  `uuid`            BINARY(16) NOT NULL,
  `cash_uuid`       BINARY(16) NOT NULL,
  `amount`          DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `invoice_uuid`    BINARY(16) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `cash_uuid` (`cash_uuid`),
  INDEX (`invoice_uuid`),
  CONSTRAINT `cash_item__cash`FOREIGN KEY (`cash_uuid`) REFERENCES `cash` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cash_box`;
CREATE TABLE `cash_box` (
  `id`            MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label`         VARCHAR(100) NOT NULL,
  `project_id`    SMALLINT(5) UNSIGNED NOT NULL,
  `is_auxiliary`  TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cash_box_1` (`label`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `cashbox__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payroll_configuration`;
CREATE TABLE `payroll_configuration` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `dateFrom` date NOT NULL,
  `dateTo` date NOT NULL,
  `config_rubric_id` INT(10) UNSIGNED NOT NULL,
  `config_accounting_id` INT(10) UNSIGNED NOT NULL,
  `config_weekend_id` INT(10) UNSIGNED NOT NULL,
  `config_employee_id` INT(10) UNSIGNED NOT NULL,
  `config_ipr_id`INT(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payroll_configuration` (`label`),
  CONSTRAINT `payroll_conf__conf_rubric` FOREIGN KEY (`config_rubric_id`) REFERENCES `config_rubric` (`id`),
  CONSTRAINT  `payroll_conf__conf_account` FOREIGN KEY (`config_accounting_id`) REFERENCES `config_accounting` (`id`),
  CONSTRAINT  `payroll_conf__conf_weekend`FOREIGN KEY (`config_weekend_id`) REFERENCES `weekend_config` (`id`),
  CONSTRAINT `payroll_conf__conf_employee` FOREIGN KEY (`config_employee_id`) REFERENCES `config_employee` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rubric_payroll`;
CREATE TABLE `rubric_payroll` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(80) NOT NULL,
  `abbr` VARCHAR(20) DEFAULT NULL,
  `is_employee` TINYINT(1) DEFAULT 0,
  `is_percent` TINYINT(1) DEFAULT 0,
  `is_discount` TINYINT(1) DEFAULT 0,
  `is_tax` TINYINT(1) DEFAULT 0,
  `is_social_care` TINYINT(1) DEFAULT 0,
  `is_defined_employee` TINYINT(1) DEFAULT 0,
  `is_membership_fee` TINYINT(1) DEFAULT 0,
  `debtor_account_id` INT(10) UNSIGNED DEFAULT NULL,
  `expense_account_id` INT(10) UNSIGNED DEFAULT NULL,
  `is_ipr` TINYINT(1) DEFAULT 0,
  `is_associated_employee` TINYINT(1) DEFAULT 0,
  `is_seniority_bonus` TINYINT(1) DEFAULT 0,
  `is_family_allowances` TINYINT(1) DEFAULT 0,
  `is_monetary_value`  TINYINT(1) DEFAULT 1,
  `position`  TINYINT(1) DEFAULT 0,
  `is_indice` TINYINT(1) DEFAULT 0,
  `indice_type` VARCHAR(50) DEFAULT NULL,
  `indice_to_grap` TINYINT(1) DEFAULT 0,
  `is_linked_pension_fund` TINYINT(1) DEFAULT 0,
  `is_linked_to_grade` TINYINT(1) DEFAULT 0,
  `value` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rubric_payroll_1` (`label`),
  UNIQUE KEY `rubric_payroll_2` (`abbr`),
  KEY `debtor_account_id` (`debtor_account_id`),
  KEY `expense_account_id` (`expense_account_id`),
  CONSTRAINT `rubric_payroll__debtor_account` FOREIGN KEY (`debtor_account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `rubric_payroll__expense_account` FOREIGN KEY (`expense_account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rubric_payroll_item`;
CREATE TABLE `rubric_payroll_item` (
  `uuid` BINARY(16) NOT NULL,
  `rubric_payroll_id` INT(10) UNSIGNED NOT NULL,
  `item_id` INT(10) UNSIGNED NOT NULL,
  UNIQUE KEY `uniq_item`(`rubric_payroll_id`, `item_id`),
  CONSTRAINT  `rubric_pay_item__rubric_pay1` FOREIGN KEY (`rubric_payroll_id`) REFERENCES `rubric_payroll` (`id`),
  CONSTRAINT  `rubric_pay_item__rubric_pay2` FOREIGN KEY (`item_id`) REFERENCES `rubric_payroll` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cash_box_account_currency`;
CREATE TABLE `cash_box_account_currency` (
  `id`                  MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `currency_id`         TINYINT UNSIGNED NOT NULL,
  `cash_box_id`         MEDIUMINT UNSIGNED NOT NULL,
  `account_id`          INT UNSIGNED NOT NULL,
  `transfer_account_id` INT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cash_box_account_currency_1` (`currency_id`, `cash_box_id`, `account_id`),
  UNIQUE KEY `cash_box_account_currency_2` (`currency_id`, `cash_box_id`, `transfer_account_id`),
  KEY `currency_id` (`currency_id`),
  KEY `cash_box_id` (`cash_box_id`),
  KEY `account_id` (`account_id`),
  KEY `transfer_account_id` (`transfer_account_id`),
  CONSTRAINT `cashbox_acc_currency__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `cashbox_acc_currency__cashbox` FOREIGN KEY (`cash_box_id`) REFERENCES `cash_box` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `cashbox_acc_currency__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `cashbox_acc_currency__transfert_acc` FOREIGN KEY (`transfer_account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `config_accounting`;
CREATE TABLE `config_accounting` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `account_id` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_accounting_1` (`label`),
  UNIQUE KEY `config_accounting_2` (`label`, `account_id`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `config_acc__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `weekend_config`;
CREATE TABLE `weekend_config` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `weekend_config` (`label`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `config_week_days`;
CREATE TABLE `config_week_days` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `indice` INT(10) UNSIGNED NOT NULL,
  `weekend_config_id` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `weekend_config_id` (`weekend_config_id`),
  CONSTRAINT `config_week_days__weekend_config` FOREIGN KEY (`weekend_config_id`) REFERENCES `weekend_config` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `country`;

CREATE TABLE `country` (
  `uuid` BINARY(16) NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `country_1` (`name`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `creditor`;

CREATE TABLE `creditor` (
  `uuid` BINARY(16) NOT NULL,
  `group_uuid` BINARY(16) NOT NULL,
  `text` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `creditor_1` (`text`),
  UNIQUE KEY `creditor_2` (`text`, `group_uuid`),
  KEY `group_uuid` (`group_uuid`),
  CONSTRAINT `creditor__creditor_group` FOREIGN KEY (`group_uuid`) REFERENCES `creditor_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `creditor_group`;

CREATE TABLE `creditor_group` (
  `enterprise_id` SMALLINT(5) UNSIGNED NOT NULL,
  `uuid` BINARY(16) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `account_id` INT(10) UNSIGNED NOT NULL,
  `locked` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `creditor_group_1` (`name`),
  UNIQUE KEY `credit_group_2` (`name`, `account_id`),
  KEY `account_id` (`account_id`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `creditor_group__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `creditor_group__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `critere`;
CREATE TABLE `critere` (
  `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `text` VARCHAR(50) NOT NULL,
  `note` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `currency`;
CREATE TABLE `currency` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `format_key` VARCHAR(20) NOT NULL,
  `symbol` VARCHAR(15) NOT NULL,
  `note` text,
  `min_monentary_unit` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `currency_1` (`name`),
  UNIQUE KEY `currency_2` (`symbol`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `debtor`;
CREATE TABLE `debtor` (
  `uuid` BINARY(16) NOT NULL,
  `group_uuid` BINARY(16) NOT NULL,
  `text` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `group_uuid` (`group_uuid`),
  CONSTRAINT `debtor__debtor_group` FOREIGN KEY (`group_uuid`) REFERENCES `debtor_group` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `debtor_group`;
CREATE TABLE `debtor_group` (
  `enterprise_id` SMALLINT(5) UNSIGNED NOT NULL,
  `uuid` BINARY(16) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `account_id` INT(10) UNSIGNED NOT NULL,
  `location_id` BINARY(16) NOT NULL,
  `phone` VARCHAR(20) DEFAULT '',
  `email` VARCHAR(150) DEFAULT '',
  `note` TEXT,
  `locked` TINYINT(1) NOT NULL DEFAULT 0,
  `max_credit` MEDIUMINT(8) UNSIGNED DEFAULT 0,
  `is_convention` TINYINT(1) NOT NULL DEFAULT 0,
  `price_list_uuid` BINARY(16) DEFAULT NULL,
  `apply_discounts` BOOLEAN NOT NULL DEFAULT TRUE,
  `apply_invoicing_fees` BOOLEAN NOT NULL DEFAULT TRUE,
  `apply_subsidies` BOOLEAN NOT NULL DEFAULT TRUE,
  `color` VARCHAR(8) NULL,
  `is_insolvent` TINYINT(1) NOT NULL DEFAULT 0,
  `is_non_client_debtor_groups` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `debtor_group_1` (`name`),
  UNIQUE KEY `debtor_group_2` (`name`, `account_id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `account_id` (`account_id`),
  KEY `location_id` (`location_id`),
  KEY `price_list_uuid` (`price_list_uuid`),
  CONSTRAINT `debtor_group__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `debtor_group__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `debtor_group__location` FOREIGN KEY (`location_id`) REFERENCES `village` (`uuid`),
  CONSTRAINT `debtor_group__pricelist` FOREIGN KEY (`price_list_uuid`) REFERENCES `price_list` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS debtor_group_invoicing_fee;

CREATE TABLE `debtor_group_invoicing_fee` (
  `id`                      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `debtor_group_uuid`      BINARY(16) NOT NULL,
  `invoicing_fee_id`      SMALLINT UNSIGNED NOT NULL,
  `created_at`              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `debtor_group_uuid` (`debtor_group_uuid`),
  KEY `invoicing_fee_id` (`invoicing_fee_id`),
  CONSTRAINT `ebtor_group_invoicing_fee__invoicing_fee` FOREIGN KEY (`invoicing_fee_id`) REFERENCES `invoicing_fee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ebtor_group_invoicing_fee__debtor_group` FOREIGN KEY (`debtor_group_uuid`) REFERENCES `debtor_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `debtor_group_history`;
CREATE TABLE `debtor_group_history` (
  `uuid` BINARY(16) NOT NULL,
  `debtor_uuid` BINARY(16) DEFAULT NULL,
  `previous_debtor_group` BINARY(16) DEFAULT NULL,
  `next_debtor_group` BINARY(16) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` SMALLINT(5) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `debtor_uuid` (`debtor_uuid`),
  KEY `previous_debtor_group` (`previous_debtor_group`),
  KEY `next_debtor_group` (`next_debtor_group`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `debtor_group_history__debtor` FOREIGN KEY (`debtor_uuid`) REFERENCES `debtor` (`uuid`),
  CONSTRAINT `debtor_group_history__prev_debtor_group` FOREIGN KEY (`previous_debtor_group`) REFERENCES `debtor_group` (`uuid`),
  CONSTRAINT `debtor_group_history__next_debtor_group` FOREIGN KEY (`next_debtor_group`) REFERENCES `debtor_group` (`uuid`),
  CONSTRAINT `debtor_group_history__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS debtor_group_subsidy;
CREATE TABLE debtor_group_subsidy (
  `id`                      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `debtor_group_uuid`      BINARY(16) NOT NULL,
  `subsidy_id`              SMALLINT UNSIGNED NOT NULL,
  `created_at`              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `debtor_group_subsidy_1` (`debtor_group_uuid`, `subsidy_id`),
  KEY `debtor_group_uuid` (`debtor_group_uuid`),
  KEY `subsidy_id` (`subsidy_id`),
  CONSTRAINT `debtorgroup_subsidy__subsidy` FOREIGN KEY (`subsidy_id`) REFERENCES `subsidy` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `debtorgroup_subsidy__debtor_group` FOREIGN KEY (`debtor_group_uuid`) REFERENCES `debtor_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `depot`;
CREATE TABLE `depot` (
  `uuid` BINARY(16) NOT NULL,
  `text` VARCHAR(191) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `enterprise_id` SMALLINT(5) UNSIGNED NOT NULL,
  `is_warehouse` SMALLINT(5) UNSIGNED NOT NULL DEFAULT 0,
  `allow_entry_purchase` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `allow_entry_donation` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `allow_entry_integration` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `allow_entry_transfer` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `allow_exit_debtor` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `allow_exit_service` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `allow_exit_transfer` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `allow_exit_loss` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `location_uuid` BINARY(16) NULL,
  `min_months_security_stock` DECIMAL(19,4) NOT NULL DEFAULT 2,
  `parent_uuid` BINARY(16) NULL,
  `dhis2_uid` VARCHAR(150) DEFAULT NULL,
  `default_purchase_interval` DECIMAL(19,4) NOT NULL DEFAULT 0,
  `is_count_per_container` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `depot_1` (`text`),
  INDEX `parent_uuid` (`parent_uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `depot_distribution_permission`;
CREATE TABLE `depot_distribution_permission` (
  `depot_uuid` BINARY(16) NOT NULL,
  `distribution_depot_uuid` BINARY(16) NOT NULL
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS discount;
CREATE TABLE discount (
  `id`                  SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `label`               VARCHAR(100) NOT NULL,
  `description`         TEXT NOT NULL,
  `inventory_uuid`      BINARY(16) NOT NULL,
  `account_id`          INT(10) UNSIGNED NOT NULL,
  `value`               DECIMAL(10,4) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `discount_1` (`label`),
  UNIQUE KEY `discount_2` (`account_id`, `inventory_uuid`),
  KEY `inventory_uuid` (`inventory_uuid`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `discount__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `discount__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `document_map`;
CREATE TABLE `document_map` (
  `uuid`              BINARY(16) NOT NULL,
  `text`              TEXT NOT NULL,
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `employee`;
CREATE TABLE `employee` (
  `uuid`          BINARY(16) NOT NULL,
  `code`          VARCHAR(20) NOT NULL,
  `date_embauche` DATETIME DEFAULT NULL,
  `grade_uuid`    BINARY(16) NOT NULL,
  `nb_spouse`     INT(2) DEFAULT 0,
  `nb_enfant`     INT(3) DEFAULT 0,
  `individual_salary`  FLOAT DEFAULT 0,
  `bank`          VARCHAR(30) DEFAULT NULL,
  `bank_account`  VARCHAR(30) DEFAULT NULL,
  `fonction_id`   TINYINT(3) UNSIGNED DEFAULT NULL,
  `service_uuid`  BINARY(16) DEFAULT NULL,
  `creditor_uuid` BINARY(16) DEFAULT NULL,
  `locked`        TINYINT(1) NOT NULL DEFAULT 0,
  `patient_uuid`  BINARY(16) DEFAULT NULL,
  `reference`     SMALLINT(5) UNSIGNED DEFAULT NULL,
  `title_employee_id`   TINYINT(3) UNSIGNED DEFAULT NULL,
  `created_at`                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `employee_1` (`code`),
  UNIQUE KEY `employee_2` (`patient_uuid`),
  KEY `fonction_id` (`fonction_id`),
  KEY `service_uuid` (`service_uuid`),
  KEY `creditor_uuid` (`creditor_uuid`),
  KEY `grade_uuid` (`grade_uuid`),
  KEY `patient_uuid` (`patient_uuid`),
  CONSTRAINT `employee__fonction` FOREIGN KEY (`fonction_id`) REFERENCES `fonction` (`id`),
  CONSTRAINT `employee__service` FOREIGN KEY (`service_uuid`) REFERENCES `service` (`uuid`),
  CONSTRAINT `employee__creditor` FOREIGN KEY (`creditor_uuid`) REFERENCES `creditor` (`uuid`),
  CONSTRAINT `employee__grade` FOREIGN KEY (`grade_uuid`) REFERENCES `grade` (`uuid`),
  CONSTRAINT `employee__patient` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`),
  CONSTRAINT `employee__title_employee` FOREIGN KEY (`title_employee_id`) REFERENCES `title_employee` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `employee_advantage`;
CREATE TABLE `employee_advantage` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_uuid` BINARY(16) NOT NULL,
  `rubric_payroll_id` INT(10) UNSIGNED NOT NULL,
  `value` float DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `employee_uuid` (`employee_uuid`),
  KEY `rubric_payroll_id` (`rubric_payroll_id`),
  CONSTRAINT `employee_advantage__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`),
  CONSTRAINT `employee_advantage__rubric_payroll` FOREIGN KEY (`rubric_payroll_id`) REFERENCES `rubric_payroll` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `enterprise`;
CREATE TABLE `enterprise` (
  `id`              SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(50) NOT NULL,
  `abbr`            VARCHAR(10) DEFAULT NULL,
  `phone`           VARCHAR(20) DEFAULT NULL,
  `email`           VARCHAR(150) DEFAULT NULL,
  `address`         VARCHAR(200) DEFAULT NULL,
  `location_id`     BINARY(16) DEFAULT NULL,
  `logo`            VARCHAR(100) DEFAULT NULL,
  `currency_id`     TINYINT(3) UNSIGNED NOT NULL,
  `po_box`          VARCHAR(30) DEFAULT NULL,
  `helpdesk`        TEXT DEFAULT NULL,
  `gain_account_id` INT UNSIGNED NULL,
  `loss_account_id` INT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enterprise_1` (`name`),
  KEY `location_id` (`location_id`),
  KEY `currency_id` (`currency_id`),
  KEY `gain_account_id` (`gain_account_id`),
  KEY `loss_account_id` (`loss_account_id`),
  CONSTRAINT `enterprise__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `enterprise__location` FOREIGN KEY (`location_id`) REFERENCES `village` (`uuid`),
  CONSTRAINT `enterprise__gain_account` FOREIGN KEY (`gain_account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `enterprise__loss_account` FOREIGN KEY (`loss_account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `enterprise_setting`;
CREATE TABLE `enterprise_setting` (
  `enterprise_id`   SMALLINT(5) UNSIGNED NOT NULL,
  `enable_price_lock` TINYINT(1) NOT NULL DEFAULT 1,
  `enable_prepayments` TINYINT(1) NOT NULL DEFAULT 1,
  `enable_password_validation` TINYINT(1) NOT NULL DEFAULT 1,
  `enable_balance_on_invoice_receipt` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_barcodes` TINYINT(1) NOT NULL DEFAULT 1,
  `enable_auto_email_report` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_index_payment_system` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_activate_pension_fund` TINYINT(1) NOT NULL DEFAULT 6, -- GENERIC_EXPENSE = 6;
  `pension_transaction_type_id` TINYINT(1) NOT NULL DEFAULT 0,
  `base_index_growth_rate` TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
  `posting_payroll_cost_center_mode` VARCHAR(100) NOT NULL DEFAULT 'default', -- With this function, transactions related to employee payment are done in bulk and require that each expense account be linked to a cost center
  `enable_require_cost_center_for_posting` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_prf_details` TINYINT(1) NOT NULL DEFAULT 0,
  `purchase_general_condition` TEXT NULL,
  `terms_of_delivery` TEXT NULL,
  `special_instructions` TEXT NULL,
  `percentage_fixed_bonus` TINYINT(3) UNSIGNED NOT NULL DEFAULT 100,
  PRIMARY KEY (`enterprise_id`),
  CONSTRAINT `enterprise_setting__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `entity_map`;
CREATE TABLE `entity_map` (
  `uuid`              BINARY(16) NOT NULL,
  `text`              TEXT NOT NULL,
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `exchange_rate`;
CREATE TABLE `exchange_rate` (
  `id`    MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `enterprise_id`   SMALLINT(5) UNSIGNED NOT NULL,
  `currency_id`   TINYINT(3) UNSIGNED NOT NULL,
  `rate`    DOUBLE NOT NULL,
  `date`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `currency_id` (`currency_id`),
  INDEX `rate` (`rate`),
  INDEX `date` (`date`),
  CONSTRAINT `exchange_rate__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `exchange_rate__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `fiscal_year`;
CREATE TABLE `fiscal_year` (
  `enterprise_id`             SMALLINT(5) UNSIGNED NOT NULL,
  `id`                        MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `number_of_months`          MEDIUMINT(8) UNSIGNED NOT NULL,
  `label`                     VARCHAR(50) NOT NULL,
  `start_date`                DATE NOT NULL,
  `end_date`                  DATE NOT NULL,
  `previous_fiscal_year_id`   MEDIUMINT(8) UNSIGNED DEFAULT NULL,
  `locked`                    TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  `user_id`                   SMALLINT(5) UNSIGNED NOT NULL,
  `note`                      TEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fiscal_year_1` (`label`),
  UNIQUE KEY `fiscal_year_2` (`enterprise_id`, `start_date`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fiscal_year__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `fiscal_year__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `fonction`;
CREATE TABLE `fonction` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `fonction_txt` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fonction_1` (`fonction_txt`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `title_employee`;
CREATE TABLE `title_employee` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_txt` VARCHAR(100) NOT NULL,
  `is_medical` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title_1` (`title_txt`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `general_ledger`;
CREATE TABLE `general_ledger` (
  `uuid`              BINARY(16) NOT NULL,
  `project_id`        SMALLINT(5) UNSIGNED NOT NULL,
  `fiscal_year_id`    MEDIUMINT(8) UNSIGNED DEFAULT NULL,
  `period_id`         MEDIUMINT(8) UNSIGNED DEFAULT NULL,
  `trans_id`          VARCHAR(100) NOT NULL,
  `trans_id_reference_number` MEDIUMINT UNSIGNED NOT NULL,
  `trans_date`        DATETIME NOT NULL,
  `record_uuid`       BINARY(16) NOT NULL,
  `description`       TEXT NOT NULL,
  `account_id`        INT(10) UNSIGNED NOT NULL,
  `debit`             DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `credit`            DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `debit_equiv`       DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `credit_equiv`      DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `currency_id`       TINYINT(3) UNSIGNED NOT NULL,
  `entity_uuid`       BINARY(16),
  `reference_uuid`    BINARY(16),
  `comment`           TEXT,
  `transaction_type_id`   TINYINT(3) UNSIGNED NULL,
  `user_id`               SMALLINT(5) UNSIGNED NOT NULL,
  `cost_center_id`      MEDIUMINT(8) UNSIGNED NULL,
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  KEY `project_id` (`project_id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `period_id` (`period_id`),
  KEY `currency_id` (`currency_id`),
  KEY `user_id` (`user_id`),
  KEY `cost_center_id` (`cost_center_id`),
  INDEX `trans_date` (`trans_date`),
  INDEX `trans_id` (`trans_id`),
  INDEX `record_uuid` (`record_uuid`),
  INDEX `reference_uuid` (`reference_uuid`),
  INDEX `entity_uuid` (`entity_uuid`),
  INDEX `account_id` (`account_id`),
  INDEX `trans_id_reference_number` (`trans_id_reference_number`),
  CONSTRAINT `general_ledger__fiscal_year` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`),
  CONSTRAINT `general_ledger__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
  CONSTRAINT `general_ledger__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger__account`  FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `general_ledger__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `general_ledger__cost_center_1` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `grade`;
CREATE TABLE `grade` (
  `uuid` BINARY(16) NOT NULL,
  `code` VARCHAR(30) DEFAULT NULL,
  `text` VARCHAR(50) NOT NULL,
  `basic_salary` decimal(19,4) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `grade_1` (`code`),
  UNIQUE KEY `grade_2` (`text`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `holiday`;

CREATE TABLE `holiday` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_uuid` BINARY(16) NOT NULL,
  `percentage` float DEFAULT 0,
  `label` VARCHAR(100) NOT NULL,
  `dateFrom` date NOT NULL,
  `dateTo` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `holiday_1` (`employee_uuid`, `dateFrom`, `dateTo`),
  KEY `employee_uuid` (`employee_uuid`),
  CONSTRAINT `holiday__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `holiday_payment`;

CREATE TABLE `holiday_payment` (
  `holiday_id` INT(10) UNSIGNED NOT NULL,
  `holiday_nbdays` INT(10) UNSIGNED NOT NULL,
  `holiday_percentage` float DEFAULT 0,
  `payment_uuid` BINARY(16) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `value` decimal(19,4) UNSIGNED DEFAULT NULL,
  KEY `payment_uuid` (`payment_uuid`),
  KEY `holiday_id` (`holiday_id`),
  CONSTRAINT `holiday_payment__paiment` FOREIGN KEY (`payment_uuid`) REFERENCES `payment` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `holiday_payment__holiday` FOREIGN KEY (`holiday_id`) REFERENCES `holiday` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `offday_payment`;

CREATE TABLE `offday_payment` (
  `offday_id` INT(10) UNSIGNED NOT NULL,
  `offday_percentage` float DEFAULT 0,
  `payment_uuid` BINARY(16) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `value` decimal(19,4) UNSIGNED DEFAULT NULL,
  KEY `payment_uuid` (`payment_uuid`),
  KEY `offday_id` (`offday_id`),
  CONSTRAINT `offday_payment__paiment` FOREIGN KEY (`payment_uuid`) REFERENCES `payment` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `offday_payment__offday` FOREIGN KEY (`offday_id`) REFERENCES `offday` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `icd10`;

CREATE TABLE `icd10` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`  VARCHAR(8) NOT NULL,
  `label` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `icd10_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `enterprise_id` SMALLINT(5) UNSIGNED NOT NULL,
  `uuid` BINARY(16) NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `text` VARCHAR(100) NOT NULL,
  `price` DECIMAL(18,4) UNSIGNED NOT NULL DEFAULT 0.0,
  `default_quantity` INTEGER UNSIGNED NOT NULL DEFAULT 1,
  `group_uuid` BINARY(16) NOT NULL,
  `unit_id` SMALLINT(5) UNSIGNED DEFAULT NULL,
  `unit_weight` FLOAT NOT NULL DEFAULT 0,
  `unit_volume` MEDIUMINT(9) DEFAULT 0,
  `stock` INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `stock_max` INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `stock_min` INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `type_id` TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
  `consumable` TINYINT(1) NOT NULL DEFAULT 0,
  `sellable` TINYINT(1)   NOT NULL DEFAULT 1,
  `note` text  NULL,
  `locked` TINYINT(1) NOT NULL DEFAULT 0,
  `delay` DECIMAL(10,4) UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Delivery time',
  `purchase_interval` DECIMAL(10,4) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Purchase Order Interval' ,
  `last_purchase` DATE NULL COMMENT 'This element allows to store the date of the last purchase order of the product in order to allow the calculation without making much of the average ordering INTerval',
  `num_purchase` INT(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of purchase orders' ,
  `num_delivery` INT(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of stock delivery' ,
  `importance` SMALLINT(5) NULL COMMENT 'Inventory level of importance : 1 -> LOW, 2 -> MID, 3 -> HIGH' ,
  `is_asset`  TINYINT(1) NOT NULL DEFAULT 0,
  `manufacturer_brand` TEXT NULL,
  `manufacturer_model` TEXT NULL,
  `is_count_per_container` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_by` SMALLINT(5) UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `inventory_1` (`group_uuid`, `text`),
  UNIQUE KEY `inventory_2` (`code`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `group_uuid` (`group_uuid`),
  KEY `unit_id` (`unit_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `inventory__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `inventory__inventory_group` FOREIGN KEY (`group_uuid`) REFERENCES `inventory_group` (`uuid`),
  CONSTRAINT `inventory__inventory_unit` FOREIGN KEY (`unit_id`) REFERENCES `inventory_unit` (`id`),
  CONSTRAINT `inventory__inventory_type` FOREIGN KEY (`type_id`) REFERENCES `inventory_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `inventory_group`;
CREATE TABLE `inventory_group` (
  `uuid` BINARY(16) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `sales_account` MEDIUMINT(8) UNSIGNED DEFAULT NULL,
  `cogs_account` MEDIUMINT(8) UNSIGNED DEFAULT NULL,
  `stock_account` MEDIUMINT(8) UNSIGNED DEFAULT NULL,
  `unique_item`  TINYINT(1) DEFAULT 0,
  `tracking_consumption` TINYINT(1) DEFAULT 1,
  `tracking_expiration` TINYINT(1) DEFAULT 1,
  `depreciation_rate` FLOAT DEFAULT 0,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `inventory_group_1` (`name`),
  UNIQUE KEY `inventory_group_2` (`code`),
  KEY `sales_account` (`sales_account`),
  KEY `cogs_account` (`cogs_account`),
  KEY `stock_account` (`stock_account`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_type`;
CREATE TABLE `inventory_type` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `text` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `is_predefined` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_type_1` (`text`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_unit`;
CREATE TABLE `inventory_unit` (
  `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `abbr` VARCHAR(50) NULL DEFAULT NULL COMMENT 'null for predefined units',
  `text` VARCHAR(50) NULL DEFAULT NULL COMMENT 'null for predefined units',
  `token` VARCHAR(20) NULL DEFAULT NULL COMMENT 'translation token for predefined units',
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_unit_1` (`text`),
  UNIQUE KEY `inventory_unit_2` (`abbr`),
  UNIQUE KEY `inventory_unit_3` (`token`)
) ENGINE=InnoDB  DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `language`;

CREATE TABLE `language` (
  `id` TINYINT UNSIGNED NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `key` VARCHAR(5) NOT NULL,
  `locale_key` VARCHAR(5) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `language_1` (`name`),
  UNIQUE KEY `language_2` (`key`),
  UNIQUE `locale_key` (`locale_key`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `offday`;
CREATE TABLE `offday` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `date` date NOT NULL,
  `percent_pay` float DEFAULT '100',
  PRIMARY KEY (`id`),
  UNIQUE KEY `offday_1` (`date`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `payment`;
CREATE TABLE `payment` (
  `uuid` BINARY(16) NOT NULL,
  `employee_uuid` BINARY(16) NOT NULL,
  `payroll_configuration_id` INT(10) UNSIGNED NOT NULL,
  `currency_id` TINYINT(3) UNSIGNED DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `total_day` INT(10) UNSIGNED DEFAULT 0,
  `working_day` INT(10) UNSIGNED DEFAULT 0,
  `basic_salary` DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  `daily_salary` DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  `base_taxable` DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  `gross_salary` DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  `net_salary` DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  `amount_paid` DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  `status_id` TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `payment_1` (`employee_uuid`, `payroll_configuration_id`),
  KEY `employee_uuid` (`employee_uuid`),
  KEY `payroll_configuration_id` (`payroll_configuration_id`),
  KEY `currency_id` (`currency_id`),
  KEY `status_id` (`status_id`),
  CONSTRAINT `payment__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`),
  CONSTRAINT `payment__payroll_configuration`  FOREIGN KEY (`payroll_configuration_id`) REFERENCES `payroll_configuration` (`id`),
  CONSTRAINT `payment__currency`  FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `payment__pay_status`  FOREIGN KEY (`status_id`) REFERENCES `payment_status` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payment_status`;

CREATE TABLE `payment_status` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `text` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_status` (`id`, `text`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stage_payment_indice`;
CREATE TABLE `stage_payment_indice` (
  `uuid` BINARY(16) NOT NULL,
  `employee_uuid` BINARY(16) NOT NULL,
  `payroll_configuration_id` INT(10) UNSIGNED NOT NULL,
  `currency_id` TINYINT(3) UNSIGNED DEFAULT NULL,
  `rubric_id` INT(10)  UNSIGNED NOT NULL,
  `rubric_value`  DECIMAL(19,4) NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `payment_1` (`employee_uuid`, `rubric_id`, `payroll_configuration_id`),
  KEY `employee_uuid` (`employee_uuid`),
  KEY `payroll_configuration_id` (`payroll_configuration_id`),
  KEY `currency_id` (`currency_id`),
  CONSTRAINT `stage_pay_indice__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`),
  CONSTRAINT `stage_pay_indice__rubric` FOREIGN KEY (`rubric_id`) REFERENCES `rubric_payroll` (`id`),
  CONSTRAINT `stage_pay_indice__payroll_config` FOREIGN KEY (`payroll_configuration_id`) REFERENCES `payroll_configuration` (`id`),
  CONSTRAINT `stage_pay_indice__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `rubric_payment`;

CREATE TABLE `rubric_payment` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_uuid` BINARY(16) NOT NULL,
  `rubric_payroll_id` INT(10) UNSIGNED NOT NULL,
  `value` FLOAT DEFAULT '0',
  `posted` TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_uuid` (`payment_uuid`),
  KEY `rubric_payroll_id` (`rubric_payroll_id`),
  UNIQUE KEY `rubric_payment_1` (`payment_uuid`, `rubric_payroll_id`),
  CONSTRAINT  `rubric_payment__payment` FOREIGN KEY (`payment_uuid`) REFERENCES `payment` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  `rubric_payment__rubric_payroll` FOREIGN KEY (`rubric_payroll_id`) REFERENCES `rubric_payroll` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `price_list`;
CREATE TABLE `price_list` (
  `uuid`                BINARY(16) NOT NULL,
  `enterprise_id`       SMALLINT(5) UNSIGNED NOT NULL,
  `label`               VARCHAR(191) NOT NULL,
  `description`         TEXT,
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `prices_1` (`label`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `price_list__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `price_list_item`;

CREATE TABLE `price_list_item` (
  `uuid`                BINARY(16) NOT NULL,
  `inventory_uuid`      BINARY(16) NOT NULL,
  `price_list_uuid`     BINARY(16) NOT NULL,
  `label`               VARCHAR(191) NOT NULL,
  `value`               DOUBLE NOT NULL,
  `is_percentage`       BOOLEAN NOT NULL DEFAULT 0,
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `price_list_item_2` (`price_list_uuid`, `inventory_uuid`),
  KEY `price_list_uuid` (`price_list_uuid`),
  KEY `inventory_uuid` (`inventory_uuid`),
  CONSTRAINT `price_list_item__price_list` FOREIGN KEY (`price_list_uuid`) REFERENCES `price_list` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `price_list_item__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

-- TODO write schema change (transactions) INTo SQL update script
DROP TABLE IF EXISTS `patient`;
CREATE TABLE `patient` (
  `uuid`                 BINARY(16) NOT NULL,
  `project_id`           SMALLINT(5) UNSIGNED NOT NULL,
  `reference`            INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `debtor_uuid`          BINARY(16) NOT NULL,
  `display_name`         VARCHAR(150) NOT NULL,
  `dob`                  DATE NOT NULL,
  `dob_unknown_date`     BOOLEAN NOT NULL DEFAULT FALSE,
  `father_name`          VARCHAR(150),
  `mother_name`          VARCHAR(150),
  `profession`           VARCHAR(150),
  `employer`             VARCHAR(150),
  `spouse`               VARCHAR(150),
  `spouse_profession`    VARCHAR(150),
  `spouse_employer`      VARCHAR(150),
  `sex`                  CHAR(1) NOT NULL,
  `religion`             VARCHAR(50),
  `marital_status`       VARCHAR(50),
  `phone`                VARCHAR(12),
  `email`                VARCHAR(150),
  `address_1`            VARCHAR(100),
  `address_2`            VARCHAR(100),
  `origin_location_id`   BINARY(16) NOT NULL,
  `current_location_id`  BINARY(16) NOT NULL,
  `registration_date`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `title`                VARCHAR(30),
  `notes`                TEXT,
  `hospital_no`          VARCHAR(20),
  `avatar`               VARCHAR(150),
  `user_id`              SMALLINT(5) UNSIGNED NOT NULL,
  `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `health_zone`           VARCHAR(30),
  `health_area`           VARCHAR(30),
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `patient_1` (`hospital_no`),
  UNIQUE KEY `patient_2` (`project_id`, `reference`),
  KEY `reference` (`reference`),
  KEY `project_id` (`project_id`),
  KEY `debtor_uuid` (`debtor_uuid`),
  KEY `origin_location_id` (`origin_location_id`),
  KEY `current_location_id` (`current_location_id`),

  /* @TODO analyse performance implications of indexing frequently searched columns */
  INDEX `registration_date` (`registration_date`),
  INDEX `dob` (`dob`),
  INDEX `sex` (`sex`),

  /* @TODO fulltext index may degrade INSERT performance over time */
  FULLTEXT `display_name` (`display_name`),

  CONSTRAINT `patient__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `patient__debtor` FOREIGN KEY (`debtor_uuid`) REFERENCES `debtor` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `patient__current_location` FOREIGN KEY (`current_location_id`) REFERENCES `village` (`uuid`) ON UPDATE CASCADE,
  CONSTRAINT `patient__origin_location` FOREIGN KEY (`origin_location_id`) REFERENCES `village` (`uuid`) ON UPDATE CASCADE,
  CONSTRAINT `patient__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `patient_document`;

CREATE TABLE `patient_document` (
  `uuid`         BINARY(16) NOT NULL,
  `patient_uuid` BINARY(16) NOT NULL,
  `label`        TEXT NOT NULL,
  `link`         TEXT NOT NULL,
  `timestamp`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mimetype`     TEXT NOT NULL,
  `size`         INTEGER UNSIGNED NOT NULL,
  `user_id`      SMALLINT(5) UNSIGNED NOT NULL,
  KEY `patient_uuid` (`patient_uuid`),
  CONSTRAINT `patient_document__patient` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `patient_document__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `patient_group`;
CREATE TABLE `patient_group` (
  `uuid`              BINARY(16) NOT NULL,
  `enterprise_id`     SMALLINT(5) UNSIGNED NOT NULL,
  `price_list_uuid`   BINARY(16) NULL,
  `name`              VARCHAR(60) NOT NULL,
  `note`              TEXT NULL,
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`uuid`),
   UNIQUE KEY `patient_group_1` (`name`),
   KEY `enterprise_id` (`enterprise_id`),
   KEY `price_list_uuid` (`price_list_uuid`),
   CONSTRAINT `patient_group__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
   CONSTRAINT `patient_group__pricelist` FOREIGN KEY (`price_list_uuid`) REFERENCES `price_list` (`uuid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS patient_group_invoicing_fee;
CREATE TABLE patient_group_invoicing_fee (
  `id`                      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_group_uuid`      BINARY(16) NOT NULL,
  `invoicing_fee_id`      SMALLINT UNSIGNED NOT NULL,
  `created_at`              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `patient_group_uuid` (`patient_group_uuid`),
  KEY `invoicing_fee_id` (`invoicing_fee_id`),
  CONSTRAINT `patient_group_inv_fee__iv_fee` FOREIGN KEY (`invoicing_fee_id`) REFERENCES `invoicing_fee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `patient_group_inv_fee__patient_group` FOREIGN KEY (`patient_group_uuid`) REFERENCES `patient_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS patient_group_subsidy;

CREATE TABLE patient_group_subsidy (
  `id`                      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_group_uuid`      BINARY(16) NOT NULL,
  `subsidy_id`              SMALLINT UNSIGNED NOT NULL,
  `created_at`              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `patient_group_uuid` (`patient_group_uuid`),
  KEY `subsidy_id` (`subsidy_id`),
  CONSTRAINT `patient_group_subsidy__subsidy` FOREIGN KEY (`subsidy_id`) REFERENCES `subsidy` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `patient_group_subsidy__patient_group` FOREIGN KEY (`patient_group_uuid`) REFERENCES `patient_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `discharge_type`;
CREATE TABLE `discharge_type` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `discharge_type_1` (`id`, `label`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `patient_visit`;
CREATE TABLE `patient_visit` (
  `uuid` BINARY(16) NOT NULL,
  `patient_uuid` BINARY(16) NOT NULL,
  `start_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` datetime DEFAULT NULL,
  `start_notes` TEXT,
  `end_notes` TEXT,
  `start_diagnosis_id` INT(10) UNSIGNED,
  `end_diagnosis_id` INT(10) UNSIGNED,
  `hospitalized` TINYINT(1) NOT NULL DEFAULT 0,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  `last_service_uuid` BINARY(16) NOT NULL,
  `discharge_type_id` SMALLINT(5) UNSIGNED NULL,
  `inside_health_zone` TINYINT(1),
  `is_pregnant` TINYINT(1) DEFAULT 0,
  `is_refered` TINYINT(1) DEFAULT 0,
  `is_new_case` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `patient_visit_1`(`patient_uuid`, `start_date`, `end_date`),
  KEY `patient_uuid` (`patient_uuid`),
  KEY `user_id` (`user_id`),
  KEY `start_diagnosis_id` (`start_diagnosis_id`),
  KEY `end_diagnosis_id` (`end_diagnosis_id`),
  KEY `last_service_uuid` (`last_service_uuid`),
  KEY `discharge_type_id` (`discharge_type_id`),
  CONSTRAINT `patient_visit__patient` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `patient_visit__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `patient_visit__start_diagnosis` FOREIGN KEY (`start_diagnosis_id`) REFERENCES `icd10` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `patient_visit__end_diagnosis`FOREIGN KEY (`end_diagnosis_id`) REFERENCES `icd10` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `patient_visit_service`;
CREATE TABLE `patient_visit_service` (
  `uuid`               BINARY(16) NOT NULL,
  `date`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `patient_visit_uuid` BINARY(16) NOT NULL,
  `service_uuid`       BINARY(16) NOT NULL,
  `created_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`uuid`),
   CONSTRAINT `patient_visit_service__patient_visit` FOREIGN KEY (`patient_visit_uuid`) REFERENCES `patient_visit` (`uuid`) ON UPDATE CASCADE,
   CONSTRAINT `patient_visit_service__service` FOREIGN KEY (`service_uuid`) REFERENCES `service` (`uuid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

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
   CONSTRAINT `patient_hosp__patient_visit` FOREIGN KEY (`patient_visit_uuid`) REFERENCES `patient_visit` (`uuid`) ON UPDATE CASCADE,
   CONSTRAINT `patient_hosp__patient`  FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`) ON UPDATE CASCADE,
   CONSTRAINT `patient_hosp__room`  FOREIGN KEY (`room_uuid`) REFERENCES `room` (`uuid`) ON UPDATE CASCADE,
   CONSTRAINT `patient_hosp__bed`  FOREIGN KEY (`bed_id`) REFERENCES `bed` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `period`;
CREATE TABLE `period` (
  `id`                  MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `fiscal_year_id`      MEDIUMINT(8) UNSIGNED NOT NULL,
  `number`              SMALLINT(5) UNSIGNED NOT NULL,
  `start_date`          DATE NULL,
  `end_date`            DATE NULL,
  `locked`              TINYINT(1) NOT NULL DEFAULT 0,
  `translate_key` VARCHAR(40) NULL,
  `year` VARCHAR(10) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `period_1` (`start_date`, `end_date`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  CONSTRAINT `period__fiscal_year` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `period_total`;

CREATE TABLE `period_total` (
  `enterprise_id` SMALLINT(5) UNSIGNED NOT NULL,
  `fiscal_year_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `period_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `account_id` INT(10) UNSIGNED NOT NULL,
  `credit` decimal(19,4) UNSIGNED DEFAULT NULL,
  `debit` decimal(19,4) UNSIGNED DEFAULT NULL,
  `locked` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`enterprise_id`,`fiscal_year_id`,`period_id`,`account_id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `account_id` (`account_id`),
  KEY `enterprise_id` (`enterprise_id`),
  KEY `period_id` (`period_id`),
  CONSTRAINT `period_total__fiscal_year` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`),
  CONSTRAINT `period_total__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `period_total__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
  CONSTRAINT `period_total__period`FOREIGN KEY (`period_id`) REFERENCES `period` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `permission`;

CREATE TABLE `permission` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `unit_id` SMALLINT(5) UNSIGNED NOT NULL,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_1` (`unit_id`,`user_id`),
  KEY `unit_id` (`unit_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `permission__unit` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `permission__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `entity_type`;
CREATE TABLE `entity_type` (
  `id` SMALLINT(5) NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(190) NOT NULL,
  `translation_key` VARCHAR(190) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `entity_group`;
CREATE TABLE `entity_group` (
  `uuid` BINARY(16) NOT NULL,
  `label` VARCHAR(190) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `entity_group_entity`;
CREATE TABLE `entity_group_entity` (
  `id` SMALLINT(5) NOT NULL AUTO_INCREMENT,
  `entity_uuid` BINARY(16) NOT NULL,
  `entity_group_uuid` BINARY(16) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `entity`;
CREATE TABLE `entity` (
  `uuid`               BINARY(16) NOT NULL,
  `display_name`       VARCHAR(190) NOT NULL,
  `title`              VARCHAR(150) NULL,
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
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cron`;
CREATE TABLE `cron` (
  `id` SMALLINT(5) NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(150) NOT NULL,
  `value` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cron_email_report`;
CREATE TABLE `cron_email_report` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `entity_group_uuid` BINARY(16) NOT NULL,
  `cron_id` SMALLINT(5) NOT NULL,
  `report_id` SMALLINT(5) NOT NULL,
  `params` TEXT NULL,
  `label` VARCHAR(100) NOT NULL,
  `last_send` DATETIME NULL,
  `next_send` DATETIME NULL,
  `has_dynamic_dates` TINYINT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`, `report_id`),
  KEY `entity_group_uuid` (`entity_group_uuid`),
  CONSTRAINT `cron_email_report__entity_group` FOREIGN KEY (`entity_group_uuid`) REFERENCES `entity_group` (`uuid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `posting_journal`;
CREATE TABLE `posting_journal` (
  `uuid`              BINARY(16) NOT NULL,
  `project_id`        SMALLINT(5) UNSIGNED NOT NULL,
  `fiscal_year_id`    MEDIUMINT(8) UNSIGNED DEFAULT NULL,
  `period_id`         MEDIUMINT(8) UNSIGNED DEFAULT NULL,
  `trans_id`          VARCHAR(100) NOT NULL,
  `trans_id_reference_number` MEDIUMINT UNSIGNED NOT NULL,
  `trans_date`        DATETIME NOT NULL,
  `record_uuid`       BINARY(16) NOT NULL,
  `description`       TEXT,
  `account_id`        INT(10) UNSIGNED NOT NULL,
  `debit`             DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  `credit`            DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  `debit_equiv`       DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  `credit_equiv`      DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  `currency_id`       TINYINT(3) UNSIGNED NOT NULL,
  `entity_uuid`       BINARY(16),
  `reference_uuid`    BINARY(16),
  `comment`           TEXT,
  `transaction_type_id`         TINYINT(3) UNSIGNED NULL,
  `user_id`           SMALLINT(5) UNSIGNED NOT NULL,
  `cost_center_id`      MEDIUMINT(8) UNSIGNED NULL,
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  KEY `project_id` (`project_id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `period_id` (`period_id`),
  KEY `currency_id` (`currency_id`),
  KEY `user_id` (`user_id`),
  KEY `cost_center_id` (`cost_center_id`),
  INDEX `trans_date` (`trans_date`),
  INDEX `trans_id` (`trans_id`),
  INDEX `record_uuid` (`record_uuid`),
  INDEX `reference_uuid` (`reference_uuid`),
  INDEX `entity_uuid` (`entity_uuid`),
  INDEX `account_id` (`account_id`),
  INDEX `trans_id_reference_number` (`trans_id_reference_number`),
  CONSTRAINT `pg__fiscal_year` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`),
  CONSTRAINT `pg__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
  CONSTRAINT `pg__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `pg__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `pg__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `pg__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `pg__cost_center_1` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `project`;

CREATE TABLE `project` (
  `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(60) NOT NULL,
  `abbr` CHAR(20) NOT NULL,
  `enterprise_id` SMALLINT(5) UNSIGNED NOT NULL,
  `zs_id` INT(11) NULL,
  `locked` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_1` (`name`),
  UNIQUE KEY `project_2` (`abbr`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `project__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `project_permission`;

CREATE TABLE `project_permission` (
  `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  `project_id` SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_permission_1` (`user_id`,`project_id`),
  KEY `user_id` (`user_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_permission__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `project_permission__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `province`;
CREATE TABLE `province` (
  `uuid` BINARY(16) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `country_uuid` BINARY(16) NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `country_uuid` (`country_uuid`),
  CONSTRAINT `province__country` FOREIGN KEY (`country_uuid`) REFERENCES `country` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `purchase`;

CREATE TABLE `purchase` (
  `uuid`              BINARY(16) NOT NULL,
  `project_id`        SMALLINT(5) UNSIGNED NOT NULL,
  `reference`         INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `cost`              DECIMAL(19,8) UNSIGNED NOT NULL DEFAULT 0.0,
  `shipping_handling` DECIMAL(19,8) UNSIGNED NOT NULL DEFAULT 0.0,
  `currency_id`       TINYINT(3) UNSIGNED NOT NULL,
  `supplier_uuid`     BINARY(16) DEFAULT NULL,
  `date`              DATETIME NOT NULL,
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  `user_id`           SMALLINT(5) UNSIGNED NOT NULL,
  `payment_method`    TEXT,
  `note`              TEXT,
  `edited`            BOOLEAN NOT NULL DEFAULT FALSE,
  `status_id`         TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  `info_purchase_number`     VARCHAR(50),
  `info_prf_number`          VARCHAR(50),
  `info_contact_name`        VARCHAR(50),
  `info_contact_phone`       VARCHAR(20),
  `info_contact_title`       VARCHAR(50),
  `info_delivery_location`   VARCHAR(100),
  `info_delivery_date`       VARCHAR(50),
  `info_delivery_condition`  TEXT,
  `info_special_instruction` TEXT,
  `info_payment_condition`   TEXT,
  `requested_by` BINARY(16) NULL,
  `reviewed_by` BINARY(16) NULL,
  `approved_by` BINARY(16) NULL,
  `responsible` BINARY(16) NULL,
  `requested_title` VARCHAR(100),
  `reviewed_title` VARCHAR(100),
  `approved_title` VARCHAR(100),
  `responsible_title` VARCHAR(100),
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `purchase_1` (`project_id`, `reference`),
  KEY `project_id` (`project_id`),
  KEY `reference` (`reference`),
  KEY `supplier_uuid` (`supplier_uuid`),
  KEY `user_id` (`user_id`),
  KEY `status_id` (`status_id`),
  CONSTRAINT `purchase__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `purchase__supplier` FOREIGN KEY (`supplier_uuid`) REFERENCES `supplier` (`uuid`),
  CONSTRAINT `purchase__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `purchase__status` FOREIGN KEY (`status_id`) REFERENCES `purchase_status` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `purchase_item`;

CREATE TABLE `purchase_item` (
  `uuid` BINARY(16) NOT NULL,
  `purchase_uuid`   BINARY(16) NOT NULL,
  `inventory_uuid`  BINARY(16) NOT NULL,
  `quantity`        INT(11) NOT NULL DEFAULT 0,
  `unit_price`      DECIMAL(19,8) UNSIGNED NOT NULL DEFAULT 0.00,
  `total`           DECIMAL(19,8) UNSIGNED NULL DEFAULT 0.00,
  `package_size`    INT(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `purchase_item_1` (`purchase_uuid`, `inventory_uuid`),
  KEY `purchase_uuid` (`purchase_uuid`),
  KEY `inventory_uuid` (`inventory_uuid`),
  CONSTRAINT `purchase_item__purchase` FOREIGN KEY (`purchase_uuid`) REFERENCES `purchase` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `purchase_item__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `purchase_status`;

CREATE TABLE `purchase_status` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `text` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_status` (`id`, `text`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `reference`;

CREATE TABLE `reference` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `is_report` TINYINT(1) DEFAULT NULL,
  `ref` char(4) NOT NULL,
  `text` text,
  `position` INT(10) UNSIGNED DEFAULT NULL,
  `reference_group_id` TINYINT(3) UNSIGNED DEFAULT NULL,
  `section_resultat_id` TINYINT(3) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `reference_group`;

CREATE TABLE `reference_group` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `reference_group` char(4) NOT NULL,
  `text` text,
  `position` INT(10) UNSIGNED DEFAULT NULL,
  `section_bilan_id` TINYINT(3) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `section_bilan_id` (`section_bilan_id`),
  CONSTRAINT `reference_group__section_bilan` FOREIGN KEY (`section_bilan_id`) REFERENCES `section_bilan` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `report`;
CREATE TABLE `report` (
  `id`                  TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_key`          TEXT NOT NULL,
  `title_key`           TEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `saved_report`;

CREATE TABLE `saved_report` (
  `uuid`                BINARY(16) NOT NULL,
  `label`               TEXT NOT NULL,
  `report_id`           TINYINT(3) UNSIGNED NOT NULL,
  `parameters`          TEXT, /* query string parameters, if they will be displayed on the report (such as filters, etc) */
  `link`                TEXT NOT NULL,
  `timestamp`           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id`             SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `user_id` (`user_id`),
  KEY `report_id` (`report_id`),
  CONSTRAINT  `saved_report__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT  `saved_report__report` FOREIGN KEY (`report_id`) REFERENCES `report` (`id`)
) ENGINE= InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice`;
CREATE TABLE `invoice` (
  `project_id`          SMALLINT(5) UNSIGNED NOT NULL,
  `reference`           INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `uuid`                BINARY(16) NOT NULL,
  `cost`                DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0,
  `debtor_uuid`         BINARY(16) NOT NULL,
  `service_uuid`        BINARY(16) DEFAULT NULL,
  `user_id`             SMALLINT(5) UNSIGNED NOT NULL,
  `date`                DATETIME NOT NULL,
  `description`         TEXT NOT NULL,
  `reversed`            TINYINT NOT NULL DEFAULT 0,
  `edited`              TINYINT NOT NULL DEFAULT 0,
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `posted`            TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `invoice_1` (`project_id`, `reference`),
  KEY `reference` (`reference`),
  KEY `project_id` (`project_id`),
  KEY `debtor_uuid` (`debtor_uuid`),
  KEY `service_uuid` (`service_uuid`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `invoice__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `invoice__debtor` FOREIGN KEY (`debtor_uuid`) REFERENCES `debtor` (`uuid`),
  CONSTRAINT `invoice__service` FOREIGN KEY (`service_uuid`) REFERENCES `service` (`uuid`),
  CONSTRAINT `invoice__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS invoice_invoicing_fee;
CREATE TABLE invoice_invoicing_fee (
  `invoice_uuid`             BINARY(16) NOT NULL,
  `value`                    DECIMAL(10,4) NOT NULL,
  `invoicing_fee_id`         SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`invoice_uuid`, `invoicing_fee_id`),
  KEY `invoice_uuid` (`invoice_uuid`),
  KEY `invoicing_fee_id` (`invoicing_fee_id`),
  CONSTRAINT `invoice_invoicing_fee__invoice` FOREIGN KEY (`invoice_uuid`) REFERENCES `invoice` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `invoice_invoicing_fee__invoicing_fee` FOREIGN KEY (`invoicing_fee_id`) REFERENCES `invoicing_fee` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice_item`;

CREATE TABLE `invoice_item` (
  `invoice_uuid` BINARY(16) NOT NULL,
  `uuid` BINARY(16) NOT NULL,
  `inventory_uuid` BINARY(16) NOT NULL,
  `quantity` INT(10) UNSIGNED NOT NULL,
  `inventory_price` decimal(19,4) DEFAULT NULL,
  `transaction_price` decimal(19,4) NOT NULL,
  `debit` decimal(19,4) NOT NULL DEFAULT 0.0,
  `credit` decimal(19,4) NOT NULL DEFAULT 0.0,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `invoice_item_1` (`invoice_uuid`, `inventory_uuid`),
  KEY `invoice_uuid` (`invoice_uuid`),
  KEY `inventory_uuid` (`inventory_uuid`),
  CONSTRAINT `invoice_item__invoice` FOREIGN KEY (`invoice_uuid`) REFERENCES `invoice` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `invoice_item__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS invoice_subsidy;

CREATE TABLE `invoice_subsidy` (
  `invoice_uuid`        BINARY(16) NOT NULL,
  `value`               DECIMAL(10,4) NOT NULL,
  `subsidy_id`          SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`invoice_uuid`, `value`),
  UNIQUE KEY `invoice_subsidy_1` (`invoice_uuid`, `subsidy_id`),
  KEY `invoice_uuid` (`invoice_uuid`),
  KEY `subsidy_id` (`subsidy_id`),
  CONSTRAINT `invoice_subsidy__invoice` FOREIGN KEY (`invoice_uuid`) REFERENCES `invoice` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `invoice_subsidy__subsidy` FOREIGN KEY (`subsidy_id`) REFERENCES `subsidy` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `section_bilan`;

CREATE TABLE `section_bilan` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `text` text,
  `is_actif` TINYINT(1) DEFAULT NULL,
  `position` INT(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `section_resultat`;

CREATE TABLE `section_resultat` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `text` text,
  `position` INT(10) UNSIGNED DEFAULT NULL,
  `is_charge` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `sector`;
CREATE TABLE `sector` (
  `uuid` BINARY(16) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `province_uuid` BINARY(16) NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `province_id` (`province_uuid`),
  CONSTRAINT `sector__province` FOREIGN KEY (`province_uuid`) REFERENCES `province` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `service`;
CREATE TABLE `service` (
  `uuid`  BINARY(16) NOT NULL,
  `enterprise_id` SMALLINT(5) UNSIGNED NOT NULL,
  `project_id` SMALLINT(5) UNSIGNED NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `hidden` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `service_1` (`name`),
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `service__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES enterprise (`id`)
) ENGINE=InnoDB  DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ward`;
CREATE TABLE `ward`(
 `uuid` BINARY(16) NOT NULL,
 `name` VARCHAR(100) NOT NULL,
 `description` text NULL,
 `service_uuid` BINARY(16) NULL,
  PRIMARY KEY(`uuid`),
  KEY `name_1` (`name`),
  CONSTRAINT `ward__service` FOREIGN KEY (`service_uuid`) REFERENCES `service` (`uuid`)
)ENGINE=InnoDB  DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `room_type`;
CREATE TABLE `room_type`(
 `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
 `label` VARCHAR(120) NOT NULL,
  PRIMARY KEY(`id`)
)ENGINE=InnoDB  DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `room`;
CREATE TABLE `room`(
 `uuid` BINARY(16) NOT NULL,
 `label` VARCHAR(120) NOT NULL,
 `description` text NULL,
 `ward_uuid` BINARY(16) NOT NULL,
 `room_type_id` SMALLINT(5) UNSIGNED NULL,
  PRIMARY KEY(`uuid`),
  UNIQUE KEY `room_label_0` (`label`, `ward_uuid`),
  CONSTRAINT `room__ward` FOREIGN KEY (`ward_uuid`) REFERENCES ward (`uuid`),
  CONSTRAINT `room__room_type` FOREIGN KEY (`room_type_id`) REFERENCES room_type (`id`)
)ENGINE=InnoDB  DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `bed`;
CREATE TABLE `bed`(
 `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
 `label` VARCHAR(120) NOT NULL,
 `room_uuid` BINARY(16) NOT NULL,
 `is_occupied` TINYINT(1) NOT NULL DEFAULT 0,
 `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY(`id`),
  UNIQUE KEY `bed_label_0` (`label`, `room_uuid`),
  CONSTRAINT `bed__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `bed__room` FOREIGN KEY (`room_uuid`) REFERENCES room (`uuid`)
)ENGINE=InnoDB  DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `subsidy`;
CREATE TABLE subsidy (
  `id`              SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `account_id`      INT UNSIGNED NOT NULL,
  `label`           VARCHAR(100) NOT NULL,
  `description`     TEXT,
  `value`           DECIMAL(10,4) NOT NULL,
  `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subsidy_1` (`label`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `subsidy__account`  FOREIGN KEY (`account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `supplier`;
CREATE TABLE `supplier` (
  `uuid`            BINARY(16) NOT NULL,
  `reference`       INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `creditor_uuid`   BINARY(16) NOT NULL,
  `display_name`    VARCHAR(45) NOT NULL,
  `address_1`       TEXT,
  `address_2`       TEXT,
  `email`           VARCHAR(150) DEFAULT NULL,
  `fax`             VARCHAR(45) DEFAULT NULL,
  `note`            TEXT,
  `phone`           VARCHAR(15) DEFAULT NULL,
  `international`   TINYINT(1) NOT NULL DEFAULT 0,
  `locked`          TINYINT(1) NOT NULL DEFAULT 0,
  `contact_uuid`    BINARY(16) NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `supplier_1` (`display_name`),
  KEY `creditor_uuid` (`creditor_uuid`),
  KEY `contact_uuid` (`contact_uuid`),
  CONSTRAINT `supplier__creditor` FOREIGN KEY (`creditor_uuid`) REFERENCES `creditor` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `supplier__contact` FOREIGN KEY (`contact_uuid`) REFERENCES `entity` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `taxe_ipr`;
CREATE TABLE `taxe_ipr` (
  `id` INT(10)      UNSIGNED NOT NULL AUTO_INCREMENT,
  `label`           VARCHAR(100) NOT NULL,
  `description`     TEXT,
  `currency_id`     TINYINT(3) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `currency_id` (`currency_id`),
  CONSTRAINT `taxe_ipr__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `taxe_ipr_configuration`;
CREATE TABLE `taxe_ipr_configuration` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `rate` float NOT NULL,
  `tranche_annuelle_debut` float DEFAULT NULL,
  `tranche_annuelle_fin` float DEFAULT NULL,
  `tranche_mensuelle_debut` float DEFAULT NULL,
  `tranche_mensuelle_fin` float DEFAULT NULL,
  `ecart_annuel` float DEFAULT NULL,
  `ecart_mensuel` float DEFAULT NULL,
  `impot_annuel` float DEFAULT NULL,
  `impot_mensuel` float DEFAULT NULL,
  `cumul_annuel` float DEFAULT NULL,
  `cumul_mensuel` float DEFAULT NULL,
  `taxe_ipr_id` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `taxe_ipr_id` (`taxe_ipr_id`),
  CONSTRAINT `taxe_ipr_config__taxe_ipr` FOREIGN KEY (`taxe_ipr_id`) REFERENCES `taxe_ipr` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `transaction_type`;
CREATE TABLE `transaction_type` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `text` VARCHAR(100) NOT NULL,
  `type` VARCHAR(30) NOT NULL,
  `fixed` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_type_1` (`id`, `text`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `unit`;
CREATE TABLE `unit` (
  `id` SMALLINT(5) UNSIGNED NOT NULL,
  `name` VARCHAR(30) NOT NULL,
  `key` VARCHAR(70) NOT NULL,
  `description` text NOT NULL,
  `parent` SMALLINT(6) DEFAULT 0,
  `path` tinytext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unit_1` (`name`, `key`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id`            SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(80) NOT NULL,
  `password`      VARCHAR(100) NOT NULL,
  `display_name`  TEXT NOT NULL,
  `email`         VARCHAR(150) DEFAULT NULL,
  `active`        TINYINT(4) NOT NULL DEFAULT 0,
  `deactivated`   TINYINT(1) NOT NULL DEFAULT 0,
  `last_login`    TIMESTAMP NULL,
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_admin`      TINYINT(1) NOT NULL DEFAULT 0,
  `enable_external_access`   TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_1` (`username`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
  `uuid` BINARY(16) NOT NULL,
  `label` VARCHAR(50) NOT NULL,
  PRIMARY kEY(`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `actions`;
CREATE TABLE `actions` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `description` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `role_actions` (
  `uuid` BINARY(16) NOT NULL,
  `role_uuid` BINARY(16) NOT NULL,
  `actions_id`INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `role_actions__action` FOREIGN KEY (`actions_id`) REFERENCES `actions` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `role_actions__role` FOREIGN KEY (`role_uuid`) REFERENCES `role` (`uuid`) ON UPDATE CASCADE  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role` (
  `uuid` BINARY(16) NOT NULL,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  `role_uuid` BINARY(16) NOT NULL,
  PRIMARY kEY(`uuid`),
  UNIQUE `role_for_user` (`user_id`,`role_uuid`),
  CONSTRAINT `user_role__role` FOREIGN KEY (`role_uuid`) REFERENCES `role` (`uuid`) ON UPDATE CASCADE,
  CONSTRAINT `user_role__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `role_unit`;
CREATE TABLE `role_unit` (
  `uuid` BINARY(16) NOT NULL,
  `role_uuid`  BINARY(16) NOT NULL,
  `unit_id` SMALLINT(5) UNSIGNED DEFAULT NULL,
  PRIMARY KEY(`uuid`),
  CONSTRAINT `role_unit__role` FOREIGN KEY (`role_uuid`) REFERENCES `role` (`uuid`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `role_unit__unit`  FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `village`;
CREATE TABLE `village` (
  `uuid`        BINARY(16) NOT NULL,
  `name`        VARCHAR(80) NOT NULL,
  `sector_uuid` BINARY(16) NOT NULL,
  `longitude`   DECIMAL(19, 6) NULL,
  `latitude`    DECIMAL(19, 6) NULL,
  PRIMARY KEY (`uuid`),
  KEY `sector_id` (`sector_uuid`),
  CONSTRAINT `village__sector` FOREIGN KEY (`sector_uuid`) REFERENCES `sector` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

-- NOTE: type_id is the transaction_type table.  FK not possible due to NULLs.
DROP TABLE IF EXISTS `voucher`;
CREATE TABLE IF NOT EXISTS `voucher` (
  `uuid`            BINARY(16) NOT NULL,
  `date`            DATETIME NOT NULL,
  `project_id`      SMALLINT(5) UNSIGNED NOT NULL,
  `reference`       INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `currency_id`     TINYINT(3) UNSIGNED NOT NULL,
  `amount`          DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `description`     TEXT DEFAULT NULL,
  `user_id`         SMALLINT(5) UNSIGNED NOT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type_id`         SMALLINT(3) UNSIGNED NOT NULL,
  `reference_uuid`  BINARY(16),
  `edited`          TINYINT NOT NULL DEFAULT 0,
  `reversed`        TINYINT NOT NULL DEFAULT 0,
  `posted`            TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  KEY `project_id` (`project_id`),
  KEY `currency_id` (`currency_id`),
  KEY `user_id` (`user_id`),
  INDEX (`reference_uuid`),
  CONSTRAINT `voucher__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `voucher__currency`  FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
  CONSTRAINT `voucher__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  UNIQUE KEY `voucher_1` (`project_id`, `reference`),
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `voucher_item`;
CREATE TABLE IF NOT EXISTS `voucher_item` (
  `uuid`            BINARY(16) NOT NULL,
  `account_id`      INT UNSIGNED NOT NULL,
  `debit`           DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.0000,
  `credit`          DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.0000,
  `voucher_uuid`    BINARY(16) NOT NULL,
  `document_uuid`   BINARY(16) default null,
  `entity_uuid`     BINARY(16) default null,
  `description`     TEXT NULL,
  `cost_center_id`  MEDIUMINT(8) UNSIGNED NULL,
  PRIMARY KEY (`uuid`),
  KEY `account_id` (`account_id`),
  KEY `voucher_uuid` (`voucher_uuid`),
  INDEX (`document_uuid`),
  INDEX (`entity_uuid`),
  CONSTRAINT `voucher_item__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `voucher_item__voucher` FOREIGN KEY (`voucher_uuid`) REFERENCES `voucher` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `voucher_item__cost_center_1` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

-- stock tables

DROP TABLE IF EXISTS `stock_setting`;
CREATE TABLE `stock_setting` (
  `enterprise_id`  SMALLINT(5) UNSIGNED NOT NULL UNIQUE,
  `month_average_consumption` SMALLINT(5) NOT NULL DEFAULT 6,
  `default_min_months_security_stock` DECIMAL(19,4) NOT NULL DEFAULT 2,
  `enable_auto_purchase_order_confirmation` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_auto_stock_accounting` TINYINT(1) NOT NULL DEFAULT 1,
  `enable_strict_depot_permission` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_supplier_credit` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_strict_depot_distribution` TINYINT(1) NOT NULL DEFAULT 0,
  `average_consumption_algo` VARCHAR(100) NOT NULL DEFAULT 'algo_msh', -- Algo MSH
  `min_delay` DECIMAL(19,4) NOT NULL DEFAULT 1, -- minimum number of months for inventory delay)
  `default_purchase_interval` DECIMAL(19,4) NOT NULL DEFAULT 0, -- default minimum purchase order intervall)
  `enable_expired_stock_out` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_requisition_validation_step` TINYINT(1) NOT NULL DEFAULT 0,
  `default_cost_center_for_loss` MEDIUMINT(8) NULL,
  `enable_packaging_pharmaceutical_products` TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT `stock_setting__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `flux`;
CREATE TABLE `flux` (
  `id`    INT(11) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `lot`;
CREATE TABLE `lot` (
  `uuid`              BINARY(16) NOT NULL,
  `label`             VARCHAR(191) NOT NULL,
  `quantity`          INT(11) NOT NULL DEFAULT 0,
  `unit_cost`         DECIMAL(19, 4) UNSIGNED NOT NULL,
  `description`       TEXT,
  `expiration_date`   DATE NOT NULL,
  `inventory_uuid`    BINARY(16) NOT NULL,
  `is_assigned`       TINYINT(1) NULL DEFAULT 0,
  `reference_number`  TEXT NULL,
  `serial_number`     VARCHAR(40) NULL,
  `acquisition_date`  DATE DEFAULT NULL,
  `package_size`      INT(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`uuid`),
  KEY `inventory_uuid` (`inventory_uuid`),
  CONSTRAINT `lot__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `lot_tag`;
CREATE TABLE `lot_tag` (
  `lot_uuid`          BINARY(16) NOT NULL,
  `tag_uuid`          BINARY(16) NOT NULL,
  FOREIGN KEY (`lot_uuid`) REFERENCES `lot` (`uuid`),
  FOREIGN KEY (`tag_uuid`) REFERENCES `tags` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_tag`;
CREATE TABLE `inventory_tag` (
  `inventory_uuid`    BINARY(16) NOT NULL,
  `tag_uuid`          BINARY(16) NOT NULL,
  FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`),
  FOREIGN KEY (`tag_uuid`) REFERENCES `tags` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

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
  CONSTRAINT `stock_assign__lot` FOREIGN KEY (`lot_uuid`) REFERENCES `lot` (`uuid`),
  CONSTRAINT `stock_assign__entity` FOREIGN KEY (`entity_uuid`) REFERENCES `entity` (`uuid`),
  CONSTRAINT `stock_assign__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `asset_scan`;
CREATE TABLE `asset_scan` (
  `uuid`              BINARY(16) NOT NULL,
  `asset_uuid`        BINARY(16) NOT NULL,
  `location_uuid`     BINARY(16),
  `depot_uuid`        BINARY(16),           -- NULL if not assigned to a depot
  `scanned_by`        SMALLINT(5) UNSIGNED NOT NULL,
  `condition_id`      SMALLINT(5) UNSIGNED NOT NULL,
  `notes`             TEXT DEFAULT NULL,
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- This is the official "scan date"
  `updated_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  KEY `asset_uuid` (`asset_uuid`),
  KEY `location_uuid` (`location_uuid`),
  CONSTRAINT `asset_scan__asset`     FOREIGN KEY (`asset_uuid`) REFERENCES `lot` (`uuid`),
  CONSTRAINT `asset_scan__location`  FOREIGN KEY (`location_uuid`) REFERENCES `village` (`uuid`),
  CONSTRAINT `asset_scan__user`      FOREIGN KEY (`scanned_by`) REFERENCES `user` (`id`),
  CONSTRAINT `asset_scan__depot`     FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `required_inventory_scan`;
CREATE TABLE `required_inventory_scan` (
  `uuid`              BINARY(16) NOT NULL,
  `title`             VARCHAR(100) NOT NULL,
  `description`       TEXT NULL,
  `start_date`        DATETIME NOT NULL,
  `end_date`          DATETIME NOT NULL,
  `depot_uuid`        BINARY(16) DEFAULT NULL,     -- NULL if not restricted to a specific depot
  `is_asset`          BOOLEAN NOT NULL DEFAULT 1,  -- Limit to assets if true
  `reference_number`  TEXT NULL,                   -- If non null, Limit to lots/assets with same 'reference_number'
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `req_asset_scan__depot`     FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `status`;
CREATE TABLE `status` (
  `id`              SMALLINT(5) NOT NULL AUTO_INCREMENT,
  `status_key`      VARCHAR(50) NOT NULL,
  `title_key`       VARCHAR(100) NOT NULL,
  `class_style`     VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stock_requestor_type`;
CREATE TABLE `stock_requestor_type` (
  `id`              SMALLINT(5) NOT NULL AUTO_INCREMENT,
  `type_key`        VARCHAR(50) NOT NULL,
  `title_key`       VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stock_requisition`;
CREATE TABLE `stock_requisition` (
  `uuid`                BINARY(16) NOT NULL,
  `requestor_uuid`      BINARY(16) NOT NULL,
  `requestor_type_id`   INT(11) NOT NULL,
  `depot_uuid`          BINARY(16) NOT NULL,
  `description`         TEXT NULL,
  `date`                DATETIME NOT NULL,
  `user_id`             SMALLINT(5) UNSIGNED NOT NULL,
  `project_id`          SMALLINT(5) UNSIGNED NOT NULL,
  `reference`           INT(11) UNSIGNED NOT NULL DEFAULT 0,
  `status_id`           TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  `validator_user_id`   SMALLINT(5) UNSIGNED DEFAULT NULL,
  `validation_date`     DATETIME NULL,
  `updated_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `stock_requisition_uuid` (`uuid`),
  UNIQUE KEY `stock_requisition_2` (`project_id`, `reference`),
  KEY `requestor_uuid` (`requestor_uuid`),
  KEY `depot_uuid` (`depot_uuid`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `stock_requisition__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`),
  CONSTRAINT `stock_requisition__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stock_requisition_item`;
CREATE TABLE `stock_requisition_item` (
  `requisition_uuid`  BINARY(16) NOT NULL,
  `inventory_uuid`    BINARY(16) NOT NULL,
  `quantity`          INT(11) NOT NULL DEFAULT 0,
  `old_quantity`      INT(11) NOT NULL DEFAULT 0,
  KEY `requisition_uuid` (`requisition_uuid`),
  CONSTRAINT `stock_req_item__stock_req_item` FOREIGN KEY (`requisition_uuid`) REFERENCES `stock_requisition` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stock_adjustment_log`;
CREATE TABLE `stock_adjustment_log` (
  `movement_uuid` BINARY(16) NOT NULL,
  `created_at`    timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `old_quantity`  INT(11) NOT NULL DEFAULT 0,
  `new_quantity`  INT(11) NOT NULL DEFAULT 0,
  PRIMARY KEY `movement_uuid` (`movement_uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stock_movement`;
CREATE TABLE `stock_movement` (
  `uuid`                    BINARY(16) NOT NULL,
  `document_uuid`           BINARY(16) NOT NULL,
  `depot_uuid`              BINARY(16) NOT NULL,
  `lot_uuid`                BINARY(16) NOT NULL,
  `entity_uuid`             BINARY(16) NULL, -- holds the patient_uuid, destination depot_uuid, service_uuid, or purchase_order uuid
  `description`             TEXT NULL,
  `flux_id`                 INT(11) NOT NULL,
  `date`                    DATETIME NOT NULL,
  `quantity`                INT(11) NOT NULL DEFAULT 0,
  `unit_cost`               DECIMAL(19, 4) UNSIGNED NOT NULL,
  `is_exit`                 TINYINT(1) NOT NULL,
  `user_id`                 SMALLINT(5) UNSIGNED NOT NULL,
  `reference`               INT(11) UNSIGNED NOT NULL,
  `invoice_uuid`            BINARY(16) NULL,
  `stock_requisition_uuid`  BINARY(16) NULL,
  `period_id`               MEDIUMINT(8) UNSIGNED NOT NULL,
  `created_at`              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  INDEX `document_uuid` (`document_uuid`),
  KEY `depot_uuid` (`depot_uuid`),
  KEY `lot_uuid` (`lot_uuid`),
  KEY `flux_id` (`flux_id`),
  KEY `user_id` (`user_id`),
  KEY `period_id` (`period_id`),
  CONSTRAINT `stock_movement__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`),
  CONSTRAINT `stock_movement__lot` FOREIGN KEY (`lot_uuid`) REFERENCES `lot` (`uuid`),
  CONSTRAINT `stock_movement__flux` FOREIGN KEY (`flux_id`) REFERENCES `flux` (`id`),
  CONSTRAINT `stock_movement__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `stock_movement__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stock_movement_status`;
CREATE TABLE `stock_movement_status` (
    `depot_uuid` BINARY(16) NOT NULL,
    `inventory_uuid` BINARY(16) NOT NULL,
    `date` DATE NOT NULL,
    `quantity_delta` DECIMAL(19,4) NOT NULL, -- the difference between inflows and outflows for the day
    `in_quantity` DECIMAL(19,4) NOT NULL, -- current in flows of day
    `out_quantity_exit` DECIMAL(19,4) NOT NULL, -- current out flows of day to exits
    `out_quantity_consumption` DECIMAL(19,4) NOT NULL, -- current out flows of day to consumptions
    `sum_quantity` DECIMAL(19,4) NOT NULL,  -- cumulative quantity to date (running balance)
    `sum_in_quantity` DECIMAL(19,4) NOT NULL, -- cumulative in flows to date
    `sum_out_quantity_exit` DECIMAL(19,4) NOT NULL, -- cumulative outflows to date as exits
    `sum_out_quantity_consumption` DECIMAL(19,4) NOT NULL, -- cumulative outflows to date as consumption
    `duration` INTEGER UNSIGNED NULL DEFAULT 0, -- duration for which this row is valid
    KEY `depot_uuid` (`depot_uuid`),
    KEY `inventory_uuid` (`inventory_uuid`),
    INDEX `depot_inventory` (`depot_uuid`, `inventory_uuid`),
    INDEX `date` (`date`), -- add index on date
    CONSTRAINT `stock_movement_status__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`),
    CONSTRAINT `stock_movment_status__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stock_value`;
CREATE TABLE  `stock_value` (
  `inventory_uuid` BINARY(16) NOT NULL,
  `date` DATE NOT NULL,
  `quantity` INT(11) NOT NULL,
  `wac` DECIMAL(19,4) NOT NULL,
  KEY `inventory_uuid` (`inventory_uuid`),
  INDEX `date` (`date`),
  CONSTRAINT `stock_value__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

-- donor
DROP TABLE IF EXISTS `donor`;
CREATE TABLE `donor` (
  `id`           INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `display_name` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

-- donation
DROP TABLE IF EXISTS `donation`;
CREATE TABLE `donation` (
  `uuid`            BINARY(16) NOT NULL,
  `reference`       INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id`      SMALLINT(5) UNSIGNED NOT NULL,
  `description`     TEXT NULL,
  `date`            DATE NOT NULL,
  `donor_id`        INT(11) NOT NULL,
  PRIMARY KEY (`reference`),
  UNIQUE KEY `donation_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

/*
  The transaction_history table stores the editing history of transactions that
  have gone through the posting process.  The record_uuid should be the same
  record_uuid as that found in the posting_journal/general_ledger.
*/
CREATE TABLE `transaction_history` (
  `uuid`  BINARY(16) NOT NULL,
  `record_uuid` BINARY(16) NOT NULL,
  `timestamp`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id`     SMALLINT(5) UNSIGNED NOT NULL,
  `action`      VARCHAR(15) DEFAULT 'edit',
  `value`       TEXT DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `record_uuid` (`record_uuid`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `transaction_history__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `depot_permission`;

CREATE TABLE `depot_permission` (
  `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  `depot_uuid`  BINARY(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `depot_permission_1` (`user_id`,`depot_uuid`),
  KEY `user_id` (`user_id`),
  KEY `depot_uuid` (`depot_uuid`),
  CONSTRAINT `depot_permission__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`),
  CONSTRAINT `depot_permission__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `depot_supervision`;

CREATE TABLE `depot_supervision` (
  `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  `depot_uuid`  BINARY(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `depot_supervision_1` (`user_id`,`depot_uuid`),
  KEY `user_id` (`user_id`),
  KEY `depot_uuid` (`depot_uuid`),
  CONSTRAINT `depot_supervision__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`),
  CONSTRAINT `depot_supervision__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cashbox_permission`;

CREATE TABLE `cashbox_permission` (
  `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  `cashbox_id`  MEDIUMINT(8) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cashbox_permission_1` (`user_id`,`cashbox_id`),
  KEY `user_id` (`user_id`),
  KEY `cashbox_id` (`cashbox_id`),
  CONSTRAINT `cashbox_permission__cashbox` FOREIGN KEY (`cashbox_id`) REFERENCES `cash_box` (`id`),
  CONSTRAINT `cashbox_permission__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `config_rubric`;

CREATE TABLE `config_rubric` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `config_rubric_item`;

CREATE TABLE `config_rubric_item` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `config_rubric_id` INT(10) UNSIGNED NOT NULL,
  `rubric_payroll_id` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `config_rubric_id` (`config_rubric_id`),
  KEY `rubric_payroll_id` (`rubric_payroll_id`),
  CONSTRAINT `config_rubric_item__config_rubric` FOREIGN KEY (`config_rubric_id`) REFERENCES `config_rubric` (`id`),
  CONSTRAINT `config_rubric_item__rubric_payroll` FOREIGN KEY (`rubric_payroll_id`) REFERENCES `rubric_payroll` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `config_employee`;

CREATE TABLE `config_employee` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `config_employee_item`;

CREATE TABLE `config_employee_item` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `config_employee_id` INT(10) UNSIGNED NOT NULL,
  `employee_uuid` BINARY(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `config_employee_id` (`config_employee_id`),
  KEY `employee_uuid` (`employee_uuid`),
  UNIQUE KEY  (`config_employee_id`, `employee_uuid`),
  CONSTRAINT `config_employee_item__config_employee` FOREIGN KEY (`config_employee_id`) REFERENCES `config_employee` (`id`),
  CONSTRAINT `config_employee_item__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cost_center`;
CREATE TABLE `cost_center` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(200) NOT NULL,
  `is_principal` TINYINT(1) UNSIGNED DEFAULT 0,
  `project_id` SMALLINT(5) UNSIGNED NULL,
  `allocation_method` VARCHAR(14) NOT NULL DEFAULT 'proportional',
  `allocation_basis_id` MEDIUMINT(8) UNSIGNED,
  `step_order` SMALLINT(5) NOT NULL DEFAULT 100,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cost_center_1` (`label`),
  CONSTRAINT `cost_center__chk_allocation_method` CHECK (`allocation_method` in ('proportional', 'flat')),
  CONSTRAINT `cost_center__allocation_basis` FOREIGN KEY (`allocation_basis_id`) REFERENCES `cost_center_allocation_basis` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `reference_cost_center`;
CREATE TABLE `reference_cost_center` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `cost_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `account_reference_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `is_cost` TINYINT(1) UNSIGNED DEFAULT 0,
  `is_variable` TINYINT(1) UNSIGNED DEFAULT 0,
  `is_turnover` TINYINT(1) UNSIGNED DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference_cost_center_1` (`account_reference_id`),
  KEY `cost_center_id` (`cost_center_id`),
  KEY `account_reference_id` (`account_reference_id`),
  CONSTRAINT `reference_cost_center__cost_center` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`),
  CONSTRAINT `reference_cost_center__account_ref` FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cost_center_allocation`;
CREATE TABLE `cost_center_allocation` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `row_uuid` BINARY(16) NOT NULL,
  `trans_id` VARCHAR(100) NOT NULL,
  `account_id` INT(10) UNSIGNED NOT NULL,
  `is_cost` TINYINT(1) UNSIGNED DEFAULT 0,
  `is_variable` TINYINT(1) UNSIGNED DEFAULT 0,
  `is_turnover` TINYINT(1) UNSIGNED DEFAULT 0,
  `auxiliary_cost_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `principal_cost_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `debit_equiv` DECIMAL(19,8) NOT NULL DEFAULT 0.00,
  `credit_equiv` DECIMAL(19,8) NOT NULL DEFAULT 0.00,
  `date_distribution` DATETIME NOT NULL,
  `user_id`           SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  INDEX `row_uuid` (`row_uuid`),
  INDEX `account_id` (`account_id`),
  INDEX `trans_id` (`trans_id`),
  INDEX `auxiliary_cost_center_id` (`auxiliary_cost_center_id`),
  INDEX `principal_cost_center_id` (`principal_cost_center_id`),
  CONSTRAINT `cost_center_allocation__general_ledger` FOREIGN KEY (`row_uuid`) REFERENCES `general_ledger` (`uuid`),
  CONSTRAINT `cost_center_allocation__account`  FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `cost_center_allocation__auxiliary_cost_center`  FOREIGN KEY (`auxiliary_cost_center_id`) REFERENCES `cost_center` (`id`),
  CONSTRAINT `cost_center_allocation__principal_cost_center`  FOREIGN KEY (`principal_cost_center_id`) REFERENCES `cost_center` (`id`),
  CONSTRAINT `cost_center_allocation__user`  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `service_cost_center`;
CREATE TABLE `service_cost_center` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `cost_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `service_uuid` BINARY(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_cost_center_1` (`service_uuid`),
  KEY `cost_center_id` (`cost_center_id`),
  KEY `service_uuid` (`service_uuid`),
  CONSTRAINT `service_cost_center__service` FOREIGN KEY (`service_uuid`) REFERENCES `service` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `service_cost_center__cost_center` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cost_center_allocation_basis`;
CREATE TABLE `cost_center_allocation_basis` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,  -- Will be treated as a translation token (if predefined)
  `units` VARCHAR(200) DEFAULT '', -- Will be treated as a translation token (if predefined)
  `description` TEXT DEFAULT NULL, -- Will be treated as a translation token (if predefined)
  `is_predefined` BOOLEAN NOT NULL DEFAULT 0,
  `is_currency` BOOLEAN NOT NULL DEFAULT 0,
  `decimal_places` TINYINT(2) NOT NULL DEFAULT 0,
  `is_computed` BOOLEAN NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY  (`name`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cost_center_allocation_basis_value`;
CREATE TABLE `cost_center_allocation_basis_value` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `quantity` DECIMAL(19,4) NOT NULL DEFAULT 0,
  `cost_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `basis_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_allocation_cost_center_basis` (`cost_center_id`, `basis_id`),
  CONSTRAINT `cost_center_basis_value__cost_center` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`),
  CONSTRAINT `cost_center_basis_value__basis` FOREIGN KEY (`basis_id`) REFERENCES `cost_center_allocation_basis` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags`(
  `uuid` BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `color` VARCHAR(50) NULL,
  UNIQUE KEY  (`name`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `allocation_key`;
CREATE TABLE `allocation_key` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `auxiliary_cost_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `principal_cost_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `auxiliary_cost_center_id` (`auxiliary_cost_center_id`),
  INDEX `principal_cost_center_id` (`principal_cost_center_id`),
  CONSTRAINT `allocation_key__auxiliary_fc` FOREIGN KEY (`auxiliary_cost_center_id`) REFERENCES `cost_center` (`id`),
  CONSTRAINT `allocation_key__principal_fc` FOREIGN KEY (`principal_cost_center_id`) REFERENCES `cost_center` (`id`),
  CONSTRAINT `allocation_key__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `account_reference_type`;
CREATE TABLE `account_reference_type` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `fixed` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_reference_type_1` (`label`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `indicator_status`;
CREATE TABLE `indicator_status` (
  `id` SMALLINT(5) UNSIGNED NOT NULL,
  `text` VARCHAR(40) NOT NULL,
  `translate_key` VARCHAR(100) NOT NULL,
  PRIMARY KEY(`id`)
)ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `indicator_type`;
CREATE TABLE `indicator_type` (
  `id` SMALLINT(5) UNSIGNED NOT NULL,
  `text` VARCHAR(40) NOT NULL,
  `translate_key` VARCHAR(100) NOT NULL,
  PRIMARY KEY(`id`)
)ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `indicator`;
CREATE TABLE `indicator` (
  `uuid` BINARY(16) NOT NULL,
  `service_uuid` BINARY(16) NULL,
  `status_id` SMALLINT(5) UNSIGNED NOT NULL,
  `period_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  `type_id` SMALLINT(5) UNSIGNED NOT NULL,
  `created_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `unique_indicator_1` (`service_uuid`, `period_id`),
  CONSTRAINT `indicator__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `indicator__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `indicator__indicator_status` FOREIGN KEY (`status_id`) REFERENCES `indicator_status` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `indicator__indicator_type` FOREIGN KEY (`type_id`) REFERENCES `indicator_type` (`id`) ON UPDATE CASCADE
)ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

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
  CONSTRAINT `hosp_indicator__indicator` FOREIGN KEY (`indicator_uuid`) REFERENCES `indicator` (`uuid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

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
  CONSTRAINT `staff_indicator__indicator` FOREIGN KEY (`indicator_uuid`) REFERENCES `indicator` (`uuid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

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
  CONSTRAINT `finance_indicator__indicator` FOREIGN KEY (`indicator_uuid`) REFERENCES `indicator` (`uuid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `break_even_reference`;
CREATE TABLE `break_even_reference` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `is_cost` TINYINT(1) DEFAULT 0,
  `is_variable` TINYINT(1) DEFAULT 0,
  `is_turnover` TINYINT(1) DEFAULT 0,
  `account_reference_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `break_even_reference_1` (`label`),
  KEY `account_reference_id` (`account_reference_id`),
  CONSTRAINT `break_even_ref__acc_ref` FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `inventory_log`;
CREATE TABLE `inventory_log` (
  `uuid` BINARY(16) NOT NULL,
  `inventory_uuid` BINARY(16) NOT NULL,
  `log_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `text` JSON,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `inventory_uuid` (`inventory_uuid`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `inventory_log__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `staffing_indice`;
CREATE TABLE `staffing_indice` (
  `uuid` BINARY(16) NOT NULL,
  `employee_uuid` BINARY(16) NOT NULL,
  `grade_uuid` BINARY(16) NOT NULL,
  `fonction_id`   TINYINT(3) UNSIGNED DEFAULT NULL,
  `grade_indice` DECIMAL(19,4) NOT NULL,
  `function_indice` DECIMAL(19,4) NOT NULL,
  `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `staffing_indice__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`),
  CONSTRAINT `staffing_indice__fonction` FOREIGN KEY (`fonction_id`) REFERENCES `fonction` (`id`),
  CONSTRAINT `staffing_indice__grade` FOREIGN KEY (`grade_uuid`) REFERENCES `grade` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `staffing_grade_indice`;
CREATE TABLE `staffing_grade_indice` (
  `uuid` BINARY(16) NOT NULL,
  `value`  DECIMAL(19,4) NOT NULL,
  `grade_uuid` BINARY(16) NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `grade_uuid_uniq`(`grade_uuid`),
  CONSTRAINT `staffing_grade_indice__grade` FOREIGN KEY (`grade_uuid`) REFERENCES `grade` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rubric_grade_indice`;
CREATE TABLE `rubric_grade_indice` (
  `uuid` BINARY(16) NOT NULL,
  `value`  DECIMAL(19,4) NOT NULL,
  `grade_uuid` BINARY(16) NOT NULL,
  `rubric_id` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `rubric_id` (`rubric_id`),
  KEY `grade_uuid` (`grade_uuid`),
  CONSTRAINT `rubric_grade_indice__grade` FOREIGN KEY (`grade_uuid`) REFERENCES `grade` (`uuid`),
  CONSTRAINT `rubric_grade_indice__rubric_payroll` FOREIGN KEY (`rubric_id`) REFERENCES `rubric_payroll` (`id`),
  UNIQUE KEY `rubric_grade_indice_1` (`grade_uuid`, `rubric_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `staffing_function_indice`;
CREATE TABLE `staffing_function_indice` (
  `uuid` BINARY(16) NOT NULL,
  `value`  DECIMAL(19,4) NOT NULL,
  `fonction_id`   TINYINT(3) UNSIGNED NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `fonction_id_uniq`(`fonction_id`),
  CONSTRAINT `staffing_function_indice__fct`  FOREIGN KEY (`fonction_id`) REFERENCES `fonction` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `staffing_indice_parameters`;
CREATE TABLE `staffing_indice_parameters` (
  `uuid` BINARY(16) NOT NULL,
  `pay_envelope`  DECIMAL(19,4) NOT NULL,
  `pension_fund`  DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `working_days`   TINYINT(3) UNSIGNED NOT NULL,
  `payroll_configuration_id` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `payroll_config_id`(`payroll_configuration_id`),
  CONSTRAINT `staffing_indice_param__payroll_config` FOREIGN KEY (`payroll_configuration_id`) REFERENCES `payroll_configuration` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `choices_list_management`;
CREATE TABLE `choices_list_management` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `fixed` TINYINT(1) DEFAULT 0,
  `parent` MEDIUMINT(8) UNSIGNED DEFAULT 0,
  `group_label` MEDIUMINT(8) UNSIGNED DEFAULT 0,
  `is_group` TINYINT(1) NOT NULL DEFAULT 0,
  `is_title` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `choices_list_management_1` (`label`, `name`, `parent`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `survey_form`;
CREATE TABLE `survey_form` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `data_collector_management_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `choice_list_id` MEDIUMINT(8) UNSIGNED NULL,
  `filter_choice_list_id` MEDIUMINT(8) UNSIGNED NULL,
  `other_choice` TINYINT(1) DEFAULT 0,
  `name` VARCHAR(100) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `hint` TEXT,
  `required` TINYINT(1) DEFAULT 0,
  `constraint` VARCHAR(100) NULL,
  `default` VARCHAR(100) NULL,
  `calculation` VARCHAR(100) NULL,
  `rank` SMALLINT(5) UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `survey_form_1` (`data_collector_management_id`, `name`, `label`),
  KEY `data_collector_management_id` (`data_collector_management_id`),
  CONSTRAINT `survey_form__data_collector_management` FOREIGN KEY (`data_collector_management_id`) REFERENCES `data_collector_management` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `survey_form_type`;
CREATE TABLE `survey_form_type` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `is_list` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `survey_data`;
CREATE TABLE `survey_data` (
  `uuid` BINARY(16),
  `data_collector_management_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` SMALLINT(5) UNSIGNED NOT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`uuid`),
  KEY `data_collector_management_id` (`data_collector_management_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `survey_data__data_collector_management` FOREIGN KEY (`data_collector_management_id`) REFERENCES `data_collector_management` (`id`),
  CONSTRAINT `survey_data__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

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
  CONSTRAINT `survey_data_item__survey_form` FOREIGN KEY (`survey_form_id`) REFERENCES `survey_form` (`id`),
  CONSTRAINT `survey_data_item__survey_data` FOREIGN KEY (`survey_data_uuid`) REFERENCES `survey_data` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

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
  CONSTRAINT `survey_data_log__survey_form` FOREIGN KEY (`survey_form_id`) REFERENCES `survey_form` (`id`),
  CONSTRAINT `survey_data_log__survey_data` FOREIGN KEY (`survey_data_uuid`) REFERENCES `survey_data` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `medical_sheet`;
CREATE TABLE `medical_sheet` (
  `survey_data_uuid` BINARY(16),
  `patient_uuid` BINARY(16),
  CONSTRAINT `medical_sheet__survey_data` FOREIGN KEY (`survey_data_uuid`) REFERENCES `survey_data` (`uuid`),
  CONSTRAINT `medical_sheet__patient` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `analysis_tool_type`;
CREATE TABLE `analysis_tool_type` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `is_balance_sheet` TINYINT(1) DEFAULT 0,
  `rank` SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `analysis_tool_type_1` (`label`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `configuration_analysis_tools`;
CREATE TABLE `configuration_analysis_tools` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `account_reference_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `analysis_tool_type_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `configuration_analysis_tools_1` (`label`),
  KEY `account_reference_id` (`account_reference_id`),
  KEY `analysis_tool_type_id` (`analysis_tool_type_id`),
  CONSTRAINT `config_analysis_tools__acc_ref` FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`),
  CONSTRAINT `config_analysis_tools__analysis_tool_type` FOREIGN KEY (`analysis_tool_type_id`) REFERENCES `analysis_tool_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `cost_center_aggregate`;
CREATE TABLE `cost_center_aggregate` (
  `period_id`       MEDIUMINT(8) UNSIGNED NOT NULL,
  `debit`           DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `credit`          DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `cost_center_id`  MEDIUMINT(8) UNSIGNED NOT NULL,
  `is_income`       TINYINT(1) NOT NULL DEFAULT 0,
  KEY `cost_center_id` (`cost_center_id`),
  KEY `period_id` (`period_id`),
  CONSTRAINT `cost_center_aggregate__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
  CONSTRAINT `cost_center_aggregate__cost_center_id` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `shipment_status`;
CREATE TABLE `shipment_status` (
  `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `translation_key` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `shipment`;
CREATE TABLE `shipment` (
  `uuid`                      BINARY(16) NOT NULL,
  `project_id`                SMALLINT(5) UNSIGNED NOT NULL,
  `reference`                 INT(11) UNSIGNED NOT NULL,
  `name`                      VARCHAR(100) NOT NULL,
  `description`               TEXT NULL,
  `transport_mode`            VARCHAR(100) NULL,
  `requisition_uuid`          BINARY(16),
  `origin_depot_uuid`         BINARY(16),
  `destination_depot_uuid`    BINARY(16),
  `anticipated_delivery_date` DATETIME,
  `date_sent`                 DATETIME,
  `date_delivered`            DATETIME,
  `date_ready_for_shipment`   DATETIME,
  `receiver`                  VARCHAR(100) NULL,
  `status_id`                 SMALLINT(5) UNSIGNED NOT NULL,
  `created_by`                SMALLINT(5) UNSIGNED NOT NULL,
  `created_at`                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by`                SMALLINT(5) UNSIGNED NULL,
  `updated_at`                TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  `document_uuid`             BINARY(16) NULL, /* stock exit document_uuid */
  PRIMARY KEY (`uuid`),
  CONSTRAINT `shipment__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `shipment__requisition` FOREIGN KEY (`requisition_uuid`) REFERENCES `stock_requisition` (`uuid`),
  CONSTRAINT `shipment__origin_depot` FOREIGN KEY (`origin_depot_uuid`) REFERENCES `depot` (`uuid`),
  CONSTRAINT `shipment__destination_depot` FOREIGN KEY (`destination_depot_uuid`) REFERENCES `depot` (`uuid`),
  CONSTRAINT `shipment__status` FOREIGN KEY (`status_id`) REFERENCES `shipment_status` (`id`),
  CONSTRAINT `shipment__created_by` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`),
  CONSTRAINT `shipment__updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `shipment_item`;
CREATE TABLE `shipment_item` (
  `uuid`               BINARY(16) NOT NULL,
  `shipment_uuid`      BINARY(16) NOT NULL,
  `container_uuid`     BINARY(16) NULL COMMENT 'NULL If only one container in shipment',
  `lot_uuid`           BINARY(16) NOT NULL,
  `unit_weight`        FLOAT NOT NULL DEFAULT 0,
  `date_packed`        DATETIME,
  `quantity_sent`      INT(11) UNSIGNED DEFAULT 0,
  `quantity_delivered` INT(11) UNSIGNED DEFAULT 0,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `shipment_item__shipment` FOREIGN KEY (`shipment_uuid`) REFERENCES `shipment` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `shipment_item__lot` FOREIGN KEY (`lot_uuid`) REFERENCES `lot` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `shipment_container`;
CREATE TABLE `shipment_container` (
  `uuid`               BINARY(16) NOT NULL,
  `label`              VARCHAR(100) NOT NULL,
  `description`        TEXT NULL,
  `shipment_uuid`      BINARY(16) NOT NULL,
  `container_type_id`  TINYINT(3) UNSIGNED NOT NULL,
  `weight`             FLOAT NOT NULL DEFAULT 0,
  `date_sent`          DATETIME,
  `date_received`      DATETIME,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `shipment_container__unique_label` (`label`),
  CONSTRAINT `shipment_container__type` FOREIGN KEY (`container_type_id`) REFERENCES `shipment_container_types` (`id`),
  CONSTRAINT `shipment_container__shipment` FOREIGN KEY (`shipment_uuid`) REFERENCES `shipment` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `shipment_container_types`;
CREATE TABLE `shipment_container_types` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `text` VARCHAR(200) NOT NULL,
  `predefined` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shipment_container_type__text` (`text`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `shipment_tracking`;
CREATE TABLE `shipment_tracking` (
  `uuid`               BINARY(16) NOT NULL,
  `shipment_uuid`      BINARY(16) NOT NULL,
  `note`               TEXT NOT NULL,
  `date`               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id`            SMALLINT(5) UNSIGNED NULL,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `shipment_tracking__shipment` FOREIGN KEY (`shipment_uuid`) REFERENCES `shipment` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `shipment_tracking__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
