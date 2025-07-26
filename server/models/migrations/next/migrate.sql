-- adds the preferred_language to the user table
-- Close #7936.
CALL add_column_if_missing('user', 'preferred_language', 'TEXT NULL');

-- removes the is_admin column from the user table
ALTER TABLE `user` DROP COLUMN `is_admin`;

-- move all of asset management into stock
UPDATE unit set `parent` = 160 WHERE `id` = 307;

-- drop unused stored procedures and functions
DROP PROCEDURE IF EXISTS `UnbalancedInvoicePayments`;
DROP PROCEDURE IF EXISTS `UnbalancedInvoicePaymentsTable`;
DROP PROCEDURE IF EXISTS RecomputeInventoryStockValue;
DROP PROCEDURE IF EXISTS RecomputeAllInventoriesValue;
DROP PROCEDURE IF EXISTS UpdateStaffingIndices;
DROP PROCEDURE IF EXISTS addStagePaymentIndice;
DROP FUNCTION IF EXISTS sumTotalIndex;
DROP FUNCTION IF EXISTS getStagePaymentIndice;

DROP TABLE IF EXISTS `smtp_configuration`;

CREATE TABLE `smtp_configuration` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `smtp_host` VARCHAR(255) NOT NULL,
  `smtp_port` SMALLINT(5) UNSIGNED NOT NULL DEFAULT 587,
  `smtp_secure` TINYINT(1) NOT NULL DEFAULT 0,
  `smtp_username` VARCHAR(255) NOT NULL,
  `smtp_password` TEXT NOT NULL,
  `from_address` VARCHAR(255) NOT NULL,
  `from_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;
