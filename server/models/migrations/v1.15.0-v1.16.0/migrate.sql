/* @author: lomamech
 * @date: 2020-09-29
 * @description: Stock Requisition Features To Add # 4849
 */

CALL add_column_if_missing('stock_requisition', 'project_id', 'SMALLINT(5) UNSIGNED NOT NULL AFTER `user_id`');

ALTER TABLE `stock_requisition` ADD UNIQUE KEY `stock_requisition_2` (`project_id`, `reference`);

ALTER TABLE `stock_requisition` CHANGE COLUMN `reference` `reference` INT(11) UNSIGNED NOT NULL DEFAULT '0';

ALTER TABLE `stock_requisition` DROP PRIMARY KEY, ADD PRIMARY KEY (`uuid`);

ALTER TABLE `stock_requisition` ADD CONSTRAINT `stock_requisition__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`);

ALTER TABLE `stock_movement` ADD COLUMN `stock_requisition_uuid` BINARY(16) NULL AFTER `invoice_uuid`;

INSERT INTO `status` VALUES
  (7, 'excessive', 'FORM.LABELS.STATUS_TYPE.EXCESSIVE_RECEIVED_QUANTITY');

/*
@author : lomamech
@date : 2020-11-05
@subject : Complete migration file with production databases
*/
INSERT INTO unit VALUES
(290, '[SETTINGS] Settings', 'TREE.STOCK_SETTINGS', 'Stock Settings', 160, '/stock/setting');


/*
 * @author: jmcameron
 * @date: 2020-09-28
 * @pull-release: 4946
 * @description:  Move the stock-related settings from enterprise_setting
 *    to the new stock_setting table.
 * NOTE: This migration should be done immediately after building/loading
 *       the desired database.  If 'yarn dev' is run before the migration
 *       script, this migration will fail since it will try to add a row
 *       that already exists.
 */

DROP TABLE IF EXISTS `stock_setting`;
CREATE TABLE `stock_setting` (
  `enterprise_id`  SMALLINT(5) UNSIGNED NOT NULL UNIQUE,
  `month_average_consumption` SMALLINT(5) NOT NULL DEFAULT 6,
  `default_min_months_security_stock` SMALLINT(5) NOT NULL DEFAULT 2,
  `enable_auto_purchase_order_confirmation` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_auto_stock_accounting` TINYINT(1) NOT NULL DEFAULT 1,
  `enable_daily_consumption` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_strict_depot_permission` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_supplier_credit` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_strict_depot_distribution` TINYINT(1) NOT NULL DEFAULT 0,
  `average_consumption_algo` VARCHAR(100) NOT NULL DEFAULT 'algo_msh',
  CONSTRAINT `stock_setting__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB;

INSERT INTO stock_setting(enterprise_id, month_average_consumption,
  enable_auto_purchase_order_confirmation,
  enable_auto_stock_accounting, enable_daily_consumption,
  enable_strict_depot_permission, enable_supplier_credit)
SELECT enterprise_id, month_average_consumption,
  enable_auto_purchase_order_confirmation,
  enable_auto_stock_accounting, enable_daily_consumption,
  enable_strict_depot_permission, enable_supplier_credit
FROM enterprise_setting;

ALTER TABLE enterprise_setting DROP COLUMN month_average_consumption;
ALTER TABLE enterprise_setting DROP COLUMN enable_auto_purchase_order_confirmation;
ALTER TABLE enterprise_setting DROP COLUMN enable_auto_stock_accounting;
ALTER TABLE enterprise_setting DROP COLUMN enable_daily_consumption;
ALTER TABLE enterprise_setting DROP COLUMN enable_strict_depot_permission;
ALTER TABLE enterprise_setting DROP COLUMN enable_supplier_credit;

CALL drop_column_if_exists('enterprise_setting', 'default_min_months_security_stock');

/*
 * @author: lomamech
 * @date: 2020-10-02
 * @desc: Improvement of the depot management interface
 */
 ALTER TABLE `depot` ADD COLUMN `parent_uuid` BINARY(16) NULL;
 ALTER TABLE `depot` ADD INDEX `parent_uuid` (`parent_uuid`);

/*
  * @author: mbayopanda
  * @date: 2020-10-05
  * @desc: Adding a new table depot_distribution_permission
  */
DROP TABLE IF EXISTS `depot_distribution_permission`;
CREATE TABLE `depot_distribution_permission` (
  `depot_uuid` BINARY(16) NOT NULL,
  `distribution_depot_uuid` BINARY(16) NOT NULL
) ENGINE=InnoDB;

/*
 * @author: jmcameron
 * @date: 2020-10-30
 * @pull-release: 5075
 * @description:  Add data field for helpdesk info
 */
CALL add_column_if_missing('enterprise', 'helpdesk', 'TEXT DEFAULT NULL AFTER `po_box`');

/*
 * @author: jniles
 * @date: 2020-10-20
 * @desc: remove the "enable_daily_consumption" option as this is taken care of by our algo choice.
 */
ALTER TABLE `stock_setting` DROP COLUMN `enable_daily_consumption`;
