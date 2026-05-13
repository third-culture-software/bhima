/* migration file from v1.22.1 - v1.23.0 */

CREATE TABLE IF NOT EXISTS `odk_central_integration` (
  `enterprise_id` SMALLINT(5) UNSIGNED NOT NULL,
  `odk_central_url` TEXT NOT NULL,
  `odk_admin_user` TEXT NOT NULL,
  `odk_admin_password` TEXT NOT NULL,
  `odk_project_id` INTEGER UNSIGNED NULL,
  KEY `enterprise_id` (`enterprise_id`),
  CONSTRAINT `odk_central__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`)
) ENGINE=InnoDB;

-- @jniles
CREATE TABLE IF NOT EXISTS `odk_user` (
  `odk_user_id` INT UNSIGNED NOT NULL,
  `odk_user_password` TEXT NOT NULL,
  `bhima_user_id` SMALLINT(5) UNSIGNED NOT NULL,
  CONSTRAINT `odk_user__user` FOREIGN KEY (`bhima_user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB;

-- @mbayopanda
CREATE TABLE IF NOT EXISTS `odk_app_user` (
  `odk_app_user_id` INT UNSIGNED NOT NULL,
  `odk_app_user_token` TEXT NOT NULL,
  `display_name` TEXT NOT NULL,
  `bhima_user_id` SMALLINT(5) UNSIGNED NOT NULL,
  CONSTRAINT `odk_app_user__user` FOREIGN KEY (`bhima_user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB;

INSERT IGNORE INTO unit VALUES
  (306, 'ODK Settings', 'TREE.ODK_SETTINGS', 'ODK Settings', 1, '/admin/odk-settings');

UPDATE report SET `report_key` = 'analysis_auxiliary_cashbox', `title_key` = 'REPORT.ANALYSIS_AUX_CASHBOX.TITLE'
 WHERE report_key = 'analysis_auxiliary_cashboxes';

UPDATE unit SET `name` = 'Analysis of Cashbox', `key` = 'REPORT.ANALYSIS_AUX_CASHBOX.TITLE', `description` = 'Analysis of auxiliary cashbox', `path` = '/reports/analysis_auxiliary_cashbox'
  WHERE path = '/reports/analysis_auxiliary_cashboxes';

/*
 * @author: jmcameron
 * @description: Add new menu item for Assets Management
 * @date: 2022-01-28
 */
INSERT IGNORE INTO unit VALUES
  (307, 'Asset Management', 'TREE.ASSET_MANAGEMENT.TITLE', 'Asset Management', 0, '/ASSET_MANAGEMENT_FOLDER');

 /*
  * Issue: Asset Management - Inventory Changes #6348
  * @author: lomamech
  * @date: 2022-02-07
  */
CALL add_column_if_missing('inventory', 'is_asset', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER `importance`');
CALL add_column_if_missing('inventory', 'reference_number', 'TEXT NULL');
CALL add_column_if_missing('inventory', 'manufacturer_brand', 'TEXT NULL');
CALL add_column_if_missing('inventory', 'manufacturer_model', 'TEXT NULL');

CALL add_column_if_missing('inventory_type', 'description', 'TEXT NULL');
CALL add_column_if_missing('inventory_type', 'is_predefined', 'TINYINT(1) NOT NULL DEFAULT 0');

ALTER TABLE `inventory_type` CHANGE COLUMN `text` `text` VARCHAR(200) NOT NULL;

/*
 * Issue: Asset Management - Stock Lot changes #6349
 * @author: lomamech
 * @date: 2022-02-10
 */
CALL add_column_if_missing('lot', 'serial_number', 'VARCHAR(40) NULL');

/*
 * Issue: Asset Management - Move reference_number to lot
 * @author: jmcameron
 * @date: 2022-03-04
 */
CALL drop_column_if_exists('inventory', 'reference_number');
CALL add_column_if_missing('lot', 'reference_number', 'TEXT NULL');

/*
 * Issue: Asset Management - Asset registry
 *   - Add new assets registry page menu item
 *   - Delete old assignments page
 * @author: jmcameron
 * @date: 2022-03-01
 */
INSERT IGNORE INTO unit VALUES
  (308, 'Assets Registry', 'TREE.ASSETS_REGISTRY', 'Assets Registry', 307, '/assets');
DELETE FROM role_unit WHERE unit_id = 225;
DELETE FROM unit WHERE id = 225;
INSERT IGNORE INTO `entity_type` (`label`, `translation_key`) VALUES
  ('person', 'ENTITY.TYPE.PERSON'),
  ('service', 'ENTITY.TYPE.SERVICE'),
  ('office', 'ENTITY.TYPE.OFFICE'),
  ('enterprise', 'ENTITY.TYPE.ENTERPRISE');


/*
 * @author: mbayopanda
 * @description: Shipment tables
 * @date: 2022-02-07
 */
CREATE TABLE IF NOT EXISTS `shipment_status` (
  `id` SMALLINT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `translation_key` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `shipment` (
  `uuid`                      BINARY(16) NOT NULL,
  `project_id`                SMALLINT(5) UNSIGNED NOT NULL,
  `reference`                 INT(11) UNSIGNED NOT NULL,
  `name`                      VARCHAR(100) NOT NULL,
  `description`               TEXT NULL,
  `note`                      TEXT NULL,
  `requisition_uuid`          BINARY(16),
  `origin_depot_uuid`         BINARY(16),
  `destination_depot_uuid`    BINARY(16),
  `anticipated_delivery_date` DATETIME,
  `date_sent`                 DATETIME,
  `date_delivered`            DATETIME,
  `date_ready_for_shipment`   DATETIME,
  `receiver`                  VARCHAR(100),
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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `shipment_item` (
  `uuid`               BINARY(16) NOT NULL,
  `shipment_uuid`      BINARY(16) NOT NULL,
  `lot_uuid`           BINARY(16) NOT NULL,
  `date_packed`        DATETIME,
  `quantity_sent`      INT(11) UNSIGNED DEFAULT 0,
  `quantity_delivered` INT(11) UNSIGNED DEFAULT 0,
  `condition_id`       SMALLINT(5) UNSIGNED NOT NULL,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `shipment_item__shipment` FOREIGN KEY (`shipment_uuid`) REFERENCES `shipment` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `shipment_item__lot` FOREIGN KEY (`lot_uuid`) REFERENCES `lot` (`uuid`)
) ENGINE=InnoDB;

DELIMITER $$

-- Shipment Triggers
-- the shipment reference is incremented based on the shipment uuid.
DROP TRIGGER IF EXISTS  shipment_reference $$
CREATE TRIGGER shipment_reference BEFORE INSERT ON shipment
FOR EACH ROW
  SET NEW.reference = (SELECT IF(NEW.reference, NEW.reference, IFNULL(MAX(sh.reference) + 1, 1)) FROM shipment sh WHERE sh.uuid <> NEW.uuid);
$$

-- compute the document map
DROP TRIGGER IF EXISTS shipment_document_map $$
CREATE TRIGGER shipment_document_map AFTER INSERT ON shipment
FOR EACH ROW BEGIN
  INSERT INTO `document_map`
    SELECT NEW.uuid, CONCAT_WS('.', 'SHIP', project.abbr, new.reference) FROM project WHERE project.id = NEW.project_id
  ON DUPLICATE KEY UPDATE text = text;
END$$

DELIMITER ;

/** ADD DEFAULT SHIPMENT STATUS */
INSERT IGNORE INTO `shipment_status` (`id`, `name`, `translation_key`) VALUES
  (1, 'empty', 'SHIPMENT.STATUS.EMPTY'),
  (2, 'at_depot', 'SHIPMENT.STATUS.AT_DEPOT'),
  (3, 'ready', 'SHIPMENT.STATUS.READY_FOR_SHIPMENT'),
  (4, 'in_transit', 'SHIPMENT.STATUS.IN_TRANSIT'),
  (5, 'partial', 'SHIPMENT.STATUS.PARTIAL'),
  (6, 'complete', 'SHIPMENT.STATUS.COMPLETE'),
  (7, 'delivered', 'SHIPMENT.STATUS.DELIVERED'),
  (8, 'lost', 'SHIPMENT.STATUS.LOST');

/** Add shipment in unit */
INSERT IGNORE INTO `unit` VALUES
  (309, 'Asset Shipment', 'SHIPMENT.SHIPMENTS', 'Asset Shipment', 0, '/SHIPMENT_FOLDER'),
  (310, 'New Shipment', 'SHIPMENT.NEW_SHIPMENT', 'New Shipment', 309, '/shipments/create'),
  (311, 'Shipment Registry', 'SHIPMENT.SHIPMENT_REGISTRY', 'Shipment Registry', 309, '/shipments');

/** Shipment location logs */
CREATE TABLE IF NOT EXISTS `shipment_tracking` (
  `uuid`               BINARY(16) NOT NULL,
  `shipment_uuid`      BINARY(16) NOT NULL,
  `note`               TEXT NOT NULL,
  `date`               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id`            SMALLINT(5) UNSIGNED NULL,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `shipment_tracking__shipment` FOREIGN KEY (`shipment_uuid`) REFERENCES `shipment` (`uuid`) ON DELETE CASCADE,
  CONSTRAINT `shipment_tracking__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB;


/*
 * Issue: Asset Management - Asset Inventory management
 * @author: jmcameron
 * @date: 2022-03-09
 */
CREATE TABLE IF NOT EXISTS `asset_scan` (
  `uuid`              BINARY(16) NOT NULL,
  `asset_uuid`        BINARY(16) NOT NULL,
  `location_uuid`     BINARY(16),
  `depot_uuid`        BINARY(16),           -- NULL if not assigned to a depot
  `scanned_by`        SMALLINT(5) UNSIGNED NOT NULL,
  `condition_id`      SMALLINT(5) UNSIGNED NOT NULL,
  `notes`             TEXT DEFAULT NULL,
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- This is the official "scan date"
  `updated_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  KEY `asset_uuid` (`asset_uuid`),
  KEY `location_uuid` (`location_uuid`),
  CONSTRAINT `asset_scan__asset`     FOREIGN KEY (`asset_uuid`) REFERENCES `lot` (`uuid`),
  CONSTRAINT `asset_scan__location`  FOREIGN KEY (`location_uuid`) REFERENCES `village` (`uuid`),
  CONSTRAINT `asset_scan__user`      FOREIGN KEY (`scanned_by`) REFERENCES `user` (`id`),
  CONSTRAINT `asset_scan__depot`     FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`)
) ENGINE=InnoDB;

INSERT IGNORE INTO unit VALUES
  (312, 'Asset Scan Management', 'TREE.ASSETS_SCANS_REGISTRY', 'Asset Scan Management', 307, '/assets/scans');

/*
 * Issue: Asset Management - Required Inventory Scans
 * @author: jmcameron
 * @date: 2022-03-29
 */
CREATE TABLE IF NOT EXISTS `required_inventory_scan` (
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
) ENGINE=InnoDB;

INSERT IGNORE INTO unit VALUES
  (313, 'Inventory Scans Management', 'TREE.REQUIRED_INVENTORY_SCANS', 'Inventory Scans Management', 307, '/required/inventory/scans');

/**
Issue: 6501
@author: jniles
@date: 2022-04-06
*/
DELETE FROM `role_unit` WHERE unit_id = 167;
DELETE FROM `unit` WHERE id = 167;

/**
 * adding reports for inventory scanning
 * @author: jmcameron
 * @date: 2022-04-06
 */
INSERT IGNORE INTO unit VALUES
  (314, 'Asset Management Reports','TREE.REPORTS','asset management reports', 307,'/ASSET_MANAGEMENT_REPORTS_FOLDER'),
  (315, 'Needed Inventory Scans', 'TREE.INVENTORY_SCANS_NEEDED', 'report for needed inventory scans', 314, '/reports/needed_inventory_scans');

INSERT IGNORE INTO `report` (`report_key`, `title_key`) VALUES
   ('needed_inventory_scans', 'TREE.INVENTORY_SCANS_NEEDED');

/**
 * Remove condition from shipment items
 * @author: jmcameron
 * @date: 2022-04-07
 */
CALL drop_foreign_key('shipment_item', 'shipment_item__condition');
CALL drop_column_if_exists('shipment_item', 'condition_id');

--
--       WARNING!
--
-- When migrating a production site after a release that uses this migration file,
-- it will be necessary to comment out the triggers
--
--   shipment_reference
--
--   shipment_document_map
--
-- from the triggers.sql file before performing the migration.  This is necessary
-- because these triggers refer to the 'shipment' table which does not exist when
-- this file is processed (during migrations).
