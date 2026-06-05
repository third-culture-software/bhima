/* unreleased migration: standardize email columns to empty string (no NULL) */

UPDATE debtor_group SET email = '' WHERE email IS NULL;
UPDATE enterprise SET email = '' WHERE email IS NULL;
UPDATE patient SET email = '' WHERE email IS NULL;
UPDATE entity SET email = '' WHERE email IS NULL;
UPDATE supplier SET email = '' WHERE email IS NULL;
UPDATE user SET email = '' WHERE email IS NULL;

ALTER TABLE `debtor_group` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE `enterprise` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE `patient` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE `entity` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE `supplier` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE `user` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';

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
