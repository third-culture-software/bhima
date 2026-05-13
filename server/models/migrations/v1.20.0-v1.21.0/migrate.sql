
/**
 * Inventory tags table
 */
DROP TABLE IF EXISTS `inventory_tag`;
CREATE TABLE `inventory_tag` (
  `inventory_uuid`          BINARY(16) NOT NULL,
  `tag_uuid`          BINARY(16) NOT NULL,
  FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`),
  FOREIGN KEY (`tag_uuid`) REFERENCES `tags` (`uuid`)
) ENGINE=InnoDB;


/**
 * @author: jmcameron
 * @date: 2021-06-02
 */
INSERT IGNORE INTO `report` (`report_key`, `title_key`) VALUES
('aggregated_stock_consumption', 'REPORT.AGGREGATED_STOCK_CONSUMPTION.TITLE');

INSERT IGNORE INTO `unit` VALUES
(296, 'Agg. Stock Consumption Report','REPORT.AGGREGATED_STOCK_CONSUMPTION.TITLE',
 'aggregated consumption', 282, '/reports/aggregated_stock_consumption');


/**
 * @author: mbayopanda
 * @date: 2021-06-01
 */
INSERT IGNORE INTO `unit` VALUES
(297, 'Journal Log','TREE.JOURNAL_LOG','The Journal log module', 5,'/journal/log');

CALL add_column_if_missing('transaction_history', 'value', 'TEXT DEFAULT NULL');

/* author: jniles
 * @date: 2021-06-15
 */
INSERT IGNORE INTO `actions`(`id`, `description`) VALUES
  (8, 'USERS.ACTIONS.EDIT_LOT');

/**
 * @author: lomamech
 * @date: 2021-06-17
 * Requisition status
 */
CALL add_column_if_missing('status', 'class_style', 'VARCHAR(100) NOT NULL');

UPDATE status SET class_style = 'label label-default' WHERE id = 1;
UPDATE status SET class_style = 'label label-primary' WHERE id = 2;
UPDATE status SET class_style = 'label label-warning' WHERE id = 3;
UPDATE status SET class_style = 'label label-info' WHERE id = 4;
UPDATE status SET class_style = 'label label-danger' WHERE id = 5;
UPDATE status SET class_style = 'label label-success' WHERE id = 6;
UPDATE status SET class_style = 'label label-danger' WHERE id = 7;

/* author: jmcameron
 * @date: 2021-06-24
 */
CALL add_column_if_missing('purchase', 'shipping_handling',
  ' DECIMAL(19,8) UNSIGNED NOT NULL DEFAULT 0.0 AFTER `cost`');
ALTER TABLE `purchase` MODIFY `cost` DECIMAL(19,8);

/*
 * @author: lomamech
 * @date: 2021-07-31
 * @description: If a medicine has only expired stock, we should consider it as "stock out" is enable_expired_stock_out
*/
CALL add_column_if_missing('stock_setting', 'enable_expired_stock_out', 'TINYINT(1) NOT NULL DEFAULT 0');
