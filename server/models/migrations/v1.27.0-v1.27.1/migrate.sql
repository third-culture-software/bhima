/*
 * next version from 1.27.0
 */

/**
 * @author: lomamech
 * @description: Problems of the management and supervision of deposits #6877
 * @date: 2023-01-09
 */
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
) ENGINE=InnoDB;

/*
 * @author: mbayopanda
 * @desc: increase precision for wac
 * @date: 2023-02-08
 */
ALTER TABLE stock_value MODIFY COLUMN `wac` DECIMAL(19,9) NOT NULL;

/**
 * @author: lomamech
 * @description: Improved purchase order module #6929
 * @date: 2023-01-31
 */
CALL add_column_if_missing('purchase', 'responsible', 'BINARY(16) NULL');
CALL add_column_if_missing('purchase', 'responsible_title', 'VARCHAR(100)');

INSERT INTO unit values (316, 'Detailed record of purchases','TREE.PURCHASE_REGISTRY_DETAILED','The purchase registry detailed',154,'/purchases/detailed');

/**
 * 1.27.1
 */

/*
 * @author: mbayopanda
 * @desc: Add is_admin column in the user table for API restriction
 * @date: 2023-02-22
 */
CALL add_column_if_missing('user', 'is_admin', 'TINYINT(1) NOT NULL DEFAULT 0');

/**
 * @author: lomamech
 * @description: Problem on the management of product packaging #6956
 * @date: 2023-03-02
 */
CALL add_column_if_missing('purchase_item', 'package_size', 'INT(11) NOT NULL DEFAULT 1');
