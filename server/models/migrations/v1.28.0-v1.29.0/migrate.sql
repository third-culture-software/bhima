/* v1.28.x */
DELETE FROM role_unit WHERE unit_id = (SELECT id FROM unit WHERE `path` = '/admin/odk-settings');
DELETE FROM unit WHERE `path` = '/admin/odk-settings';
DROP TABLE IF EXISTS `odk_central_integration`;

-- remove references to stock_changes report
DELETE FROM role_unit WHERE unit_id = (SELECT id FROM unit WHERE `path` = '/reports/stock_changes');
DELETE FROM unit WHERE `path` = '/reports/stock_changes';
DELETE FROM report where `report_key` = 'stock_changes';

/**
 * @author: lomamech
 * @description: Payroll Hospital general model #7000
 * @date: 2023-07-23
 */
DROP TABLE IF EXISTS `title_employee`;
CREATE TABLE `title_employee` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_txt` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title_1` (`title_txt`)
) ENGINE=InnoDB;

INSERT IGNORE INTO unit VALUES
  (318, 'Job Titles Management','TREE.TITLE','',57, '/titles');

CALL add_column_if_missing('employee', 'title_employee_id', 'TINYINT(3) UNSIGNED DEFAULT NULL');
ALTER TABLE `employee` ADD CONSTRAINT `employee__title_employee` FOREIGN KEY (`title_employee_id`) REFERENCES `title_employee` (`id`);

CALL add_column_if_missing('enterprise_setting', 'percentage_fixed_bonus', 'TINYINT(3) UNSIGNED NOT NULL DEFAULT 100');

/**
 * @author: lomamech
 * @description: Move is_medical property from employee to title #7170
 * @date: 2023-08-25
 */
ALTER TABLE `employee` DROP COLUMN  `is_medical`;
CALL add_column_if_missing('title_employee', 'is_medical', 'TINYINT(1) DEFAULT 0');

/**
 * author: jniles
 * description: enable_external_access allows backup scripts to determine which
 * user accounts to leave unlocked.
 * date: 2023-10-17
*/
CALL add_column_if_missing('user', 'enable_external_access', 'TINYINT(1) NOT NULL DEFAULT 0');
