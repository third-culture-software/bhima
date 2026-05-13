/**
 * Migration from the version 1.17.1 or later to v1.18.0
 */

/**
NOTE(@jniles): this release contains a brand new structure of stock_movement_status
with a new stored procedure that needs to be run to build it.  The CMM will not work
without it.  Therefore, after the migration is complete, you will need to run:

CALL zRecomputeStockMovementStatus();
*/

-- 2021-01-04
-- author: @jniles  (updated by jmcameron 2021-01-12)
ALTER TABLE `user` MODIFY COLUMN `last_login` TIMESTAMP NULL;

CALL add_column_if_missing('user', 'created_at', ' TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `last_login`');
CALL add_column_if_missing('user', 'updated_at', ' TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `created_at`');

-- reset all last_login information
UPDATE `user` SET `last_login` = NULL;

/*
 * @author: jmcameron
 * @date: 2021-01-07
 * @description: Install default discharge_type's in all sites
 */
DROP TABLE IF EXISTS `discharge_type`;
CREATE TABLE `discharge_type` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `discharge_type_1` (`id`, `label`)
) ENGINE=InnoDB;

-- Default Discharge types
INSERT INTO `discharge_type` (`id`, `label`) VALUES
  (1, 'PATIENT_RECORDS.DISCHARGE.REGULAR'),
  (2, 'PATIENT_RECORDS.DISCHARGE.ON_PATIENT_WILL'),
  (3, 'PATIENT_RECORDS.DISCHARGE.EMERGENCY'),
  (4, 'PATIENT_RECORDS.DISCHARGE.SERVICE_CHANGE'),
  (5, 'PATIENT_RECORDS.DISCHARGE.DEATH'),
  (6, 'PATIENT_RECORDS.DISCHARGE.EVASION'),
  (7, 'PATIENT_RECORDS.DISCHARGE.DISCHARGE_BUT_ON_BED'),
  (8, 'PATIENT_RECORDS.DISCHARGE.STATUQUO_CLINIC'),
  (9, 'PATIENT_RECORDS.DISCHARGE.TRANSFER');

/*
 * @author: jmcameron
 * @date: 2021-01-12
 * @subject : Add description and dhis2_uid fields to the depot table
 */
CALL add_column_if_missing('depot', 'description', 'TEXT DEFAULT NULL AFTER `text`');
CALL add_column_if_missing('depot', 'dhis2_uid', 'VARCHAR(150) DEFAULT NULL AFTER `parent_uuid`');

/*
 * @author: jmcameron
 * @date: 2021-02-04
 * @subject : Add nav entry for 'Find Duplicate Lots' page
 */
INSERT INTO unit VALUES
 (294, 'Duplicate Lots','TREE.DUPLICATE_LOTS','The stock lots duplicates list',160,'/stock/lots/duplicates');

/*
 * @author: jniles
 * @date: 2021-02-04
 * @subject: drop average_consumption column
 * @issue: #5144
 * @PR: #5357
*/
CALL drop_column_if_exists('inventory', 'avg_consumption');

/*
 * @author: jniles
 * @date: 2021-02-04
 * @subject: drop stock_consumption table in favor of stock_movement_status
 * @issue: #5073
*/
DROP TABLE IF EXISTS stock_consumption;

/*
 * @author: jniles
 * @date: 2021-02-08
 * @subject: replace stock movement status table structure
 * @issue: #5332
*/
DROP TABLE IF EXISTS `stock_movement_status`;
CREATE TABLE  `stock_movement_status` (
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
) ENGINE=InnoDB;

/**
  * @author: mbayopanda
  * @date: 2021-02-25
  * @desc: fix stock movement report title
  */
UPDATE report SET title_key = 'REPORT.STOCK_MOVEMENT_REPORT.TITLE' WHERE report_key = 'stock_movement_report';

/*
 * @author: lomamech
 * @date: 2021-01-12
 * @subject : Allow users to record aggregate consumption information for a depot
 */
INSERT INTO unit VALUES
  (293, 'Aggregated consumption','TREE.AGGREGATED_STOCK_CONSUMPTION','Aggregated consumption',160,'/stock/aggregated_consumption');

-- Stock Movement Flux
INSERT INTO `flux` VALUES
  (16, 'STOCK_FLUX.AGGREGATE_CONSUMPTION');


ALTER TABLE `inventory_unit`
	CHANGE COLUMN `abbr` `abbr` VARCHAR(50),
	CHANGE COLUMN `text` `text` VARCHAR(50);

/*
 * @author: jniles
 * @date: 2021-03-05
 * @description: add minimum delay column to stock settings
*/
ALTER TABLE stock_setting ADD COLUMN `min_delay` DECIMAL(19,4) NOT NULL DEFAULT 0;

/*
 * @author: jniles
 * @date: 2021-03-05
 * @description: switch all removed algorithms to 'algo_msh'
 */
UPDATE stock_setting SET average_consumption_algo = 'algo_msh' WHERE average_consumption_algo NOT IN ('algo_1', 'algo_msh');
