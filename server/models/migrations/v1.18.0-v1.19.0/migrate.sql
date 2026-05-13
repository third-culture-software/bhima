/* migrate v1.18.* to v1.19.0 */

/**
  * @author: mbayopanda
  * @date: 2021-03-5
  * @desc: the stock_adjustment_log table
  */
DROP TABLE IF EXISTS `stock_adjustment_log`;
CREATE TABLE `stock_adjustment_log` (
  `movement_uuid` BINARY(16) NOT NULL,
  `created_at`    timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `old_quantity`  INT(11) NOT NULL DEFAULT 0,
  `new_quantity`  INT(11) NOT NULL DEFAULT 0,
  PRIMARY KEY `movement_uuid` (`movement_uuid`)
) ENGINE=InnoDB;


/**
@author: jniles
@date: 2021-03-18
@description: add edited flag to the purchase order.
*/
CALL add_column_if_missing('purchase', 'edited', 'BOOLEAN NOT NULL DEFAULT FALSE');
CALL add_column_if_missing('purchase', 'updated_at', 'TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP');

DROP TABLE IF EXISTS `integration`;

/**
  * @author: jmcameron
  * @date: 2021-03-25
  * @desc: Remove obsolete columns from the lots table
  */
CALL drop_column_if_exists('lots', 'delay');
CALL drop_column_if_exists('lots', 'initial_quantity');
CALL drop_column_if_exists('lots', 'quantity');
CALL drop_column_if_exists('lots', 'entry_date');

/**
* @author: jniles
* @date: 2021-04-02
* @desc: make the origin_uuid NULL by default.
*/
ALTER TABLE `lot` MODIFY `origin_uuid` BINARY(16) NULL;

/*
 * @author: lomamech
 * @date: 2021-04-14
 * @description: add default purchase order interval
*/
ALTER TABLE stock_setting ADD COLUMN `default_purchase_interval` DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE depot ADD COLUMN `default_purchase_interval` SMALLINT(5) NOT NULL DEFAULT 0;

/*
 * @author: lomamech
 * @date: 2021-04-16
 * @description: Set the default value for the minimum waiting time to 1
*/
ALTER TABLE `stock_setting`
	CHANGE COLUMN `min_delay` `min_delay` DECIMAL(19,4) NOT NULL DEFAULT '1' AFTER `average_consumption_algo`;

UPDATE stock_setting SET min_delay = 1;

/**
@author: jniles
@date: 2021-04-14
@desc: Add actions to allow users to delete individual record types.
These must match the bhConstants on both the client and server.
See also #1221.
*/
INSERT INTO `actions`(`id`, `description`) VALUES
  (3, 'USERS.ACTIONS.DELETE_CASH_PAYMENT' ),
  (4, 'USERS.ACTIONS.DELETE_INVOICE' ),
  (5, 'USERS.ACTIONS.DELETE_PURCHASE_ORDER'),
  (6, 'USERS.ACTIONS.DELETE_STOCK_MOVEMENT'),
  (7, 'USERS.ACTIONS.DELETE_VOUCHER');

CALL drop_column_if_exists('enterprise_setting', 'enable_delete_records');

/**
  * @author: jmcameron
  * @date: 2021-04-20
  * @desc: Add support for Euros
  */
INSERT IGNORE INTO `currency` (`id`, `name`, `format_key`, `symbol`, `note`, `min_monentary_unit`)
VALUES (3,'Euro','EUR','€',NULL,0.01);

INSERT IGNORE INTO `exchange_rate` VALUES (3, 1, @EUR, 0.84, NOW());

/**
@author: jniles
@date: 2021-04-21
@description: remove the origin_uuid column from the lot table.
*/
ALTER TABLE `lot` DROP COLUMN `origin_uuid`;

/*
 * @author: lomamech
 * @date: 2021-04-26
 * @subject : Implement the RUMER report
 */
INSERT INTO unit VALUES
  (295, 'Rumer report','TREE.RUMER_REPORT','The rumer reports', 282,'/reports/rumer_report');

INSERT INTO `report` (`report_key`, `title_key`) VALUES
  ('rumer_report', 'REPORT.RUMER.TITLE');
