/*
 * DATABASE CHANGES FOR VERSION 1.8.0 TO 1.8.1 
 */
 ALTER TABLE `depot` MODIFY COLUMN `text` VARCHAR(191);

/*
 * @author: mbayopanda
 * @date: 2019-11-15
 */
ALTER TABLE voucher_item ADD COLUMN `description` TEXT NULL;

/*
 * @author: mbayopanda
 * @date: 2019-10-21
 */
INSERT INTO `unit` VALUES 
  (262, 'Stock Requisition','TREE.STOCK_REQUISITION','Stock Requisition', 160,'/modules/stock/stock_requisition','/stock/requisition');

DROP TABLE IF EXISTS `status`;
CREATE TABLE `status` (
  `id`              SMALLINT(5) NOT NULL AUTO_INCREMENT,
  `status_key`      VARCHAR(50) NOT NULL,
  `title_key`       VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `stock_requestor_type`;
CREATE TABLE `stock_requestor_type` (
  `id`              SMALLINT(5) NOT NULL AUTO_INCREMENT,
  `type_key`        VARCHAR(50) NOT NULL,
  `title_key`       VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `stock_requisition`;
CREATE TABLE `stock_requisition` (
  `uuid`                BINARY(16) NOT NULL,
  `requestor_uuid`      BINARY(16) NOT NULL,
  `requestor_type_id`   INT(11) NOT NULL,
  `depot_uuid`          BINARY(16) NOT NULL,
  `description`         TEXT NULL,
  `date`                DATETIME NOT NULL,
  `user_id`             SMALLINT(5) UNSIGNED NOT NULL,
  `reference`           INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `status_id`           TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  `updated_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reference`),
  UNIQUE KEY `stock_requisition_uuid` (`uuid`),
  KEY `requestor_uuid` (`requestor_uuid`),
  KEY `depot_uuid` (`depot_uuid`),
  FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `stock_requisition_item`;
CREATE TABLE `stock_requisition_item` (
  `requisition_uuid`  BINARY(16) NOT NULL,
  `inventory_uuid`    BINARY(16) NOT NULL,
  `quantity`          INT(11) NOT NULL DEFAULT 0,
  KEY `requisition_uuid` (`requisition_uuid`),
  FOREIGN KEY (`requisition_uuid`) REFERENCES `stock_requisition` (`uuid`)
) ENGINE=InnoDB;

-- application process status
INSERT INTO `status` VALUES 
  (1, 'in_progress', 'FORM.LABELS.STATUS_TYPE.IN_PROGRESS'),
  (2, 'done', 'FORM.LABELS.STATUS_TYPE.DONE'),
  (3, 'partially', 'FORM.LABELS.STATUS_TYPE.PARTIALLY'),
  (4, 'draft', 'FORM.LABELS.STATUS_TYPE.DRAFT'),
  (5, 'cancelled', 'FORM.LABELS.STATUS_TYPE.CANCELLED'),
  (6, 'completed', 'FORM.LABELS.STATUS_TYPE.COMPLETED');

-- type of requestors
INSERT INTO `stock_requestor_type` (`type_key`, `title_key`) VALUES 
  ('service', 'FORM.LABELS.SERVICE'),
  ('depot', 'FORM.LABELS.DEPOT');

/*
 * @author: lomamech
 * @date: 2019-11-28
 */
INSERT INTO `unit` VALUES
  (265, 'Purchase order analysis', 'TREE.PURCHASE_ORDER_ANALYSIS', 'Purchase order analysis', 144, '/modules/reports/purchaseOrderAnalysis', '/reports/purchaseOrderAnalysis');

INSERT INTO `report` (`report_key`, `title_key`) VALUES
  ('purchaseOrderAnalysis', 'REPORT.PURCHASE_ORDER_ANALYSIS_REPORT');
