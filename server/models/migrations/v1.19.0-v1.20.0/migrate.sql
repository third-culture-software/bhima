/* migrate BHIMA from v1.19.0 to v1.20.0 */

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

ALTER TABLE transaction_history ADD COLUMN `value` TEXT DEFAULT NULL;

/* author: jniles
 * @date: 2021-06-15
 */
INSERT INTO `actions`(`id`, `description`) VALUES
  (8, 'USERS.ACTIONS.EDIT_LOT');
