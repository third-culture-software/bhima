/**
 * @author: jmcameron
 * @description: Add containers to shipments
 * @date: 2021-07-22
 */

DROP TABLE IF EXISTS `shipment_container_types`;
CREATE TABLE `shipment_container_types` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `text` VARCHAR(200) NOT NULL,
  `predefined` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shipment_container_type__text` (`text`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `shipment_container`;
CREATE TABLE `shipment_container` (
  `uuid`               BINARY(16) NOT NULL,
  `label`              VARCHAR(100) NOT NULL,
  `shipment_uuid`      BINARY(16) NOT NULL,
  `container_type_id`  TINYINT(3) UNSIGNED NOT NULL,
  `weight`             FLOAT NOT NULL DEFAULT 0,
  `date_sent`          DATETIME,
  `date_received`      DATETIME,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `shipment_container__unique_label` (`label`),
  CONSTRAINT `shipment_container__type` FOREIGN KEY (`container_type_id`) REFERENCES `shipment_container_types` (`id`),
  CONSTRAINT `shipment_container__shipment` FOREIGN KEY (`shipment_uuid`) REFERENCES `shipment` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO `shipment_container_types`
    (`id`, `text`, `predefined`)
 VALUES
    (1, 'BALE', 1),
    (2, 'BOTTLE', 1),
    (3, 'BOX', 1),
    (4, 'BUNDLE', 1),
    (5, 'CAN', 1),
    (6, 'CARTON', 1),
    (7, 'CONTAINER', 1),
    (8, 'CRATE', 1),
    (9, 'KIT', 1),
    (10, 'PACKAGE', 1),
    (11, 'PACKET', 1),
    (12, 'PAIR', 1),
    (13, 'PALLET', 1),
    (14, 'PIECES', 1),
    (15, 'REAM', 1),
    (16, 'SACK', 1),
    (17, 'SET', 1);

CALL add_column_if_missing('shipment_item', 'container_uuid', 'BINARY(16) NULL');
CALL add_constraint_if_missing('shipment_item', 'shipment_item__shipment', 'FOREIGN KEY (`shipment_uuid`) REFERENCES `shipment` (`uuid`) ON DELETE CASCADE');

/**
 * @author: jmcameron
 * @description: Updates for inventory units
 * @date: 2021-08-12
 */
ALTER TABLE `inventory_unit` MODIFY COLUMN `abbr` VARCHAR(50) NULL DEFAULT NULL COMMENT 'null for predefined units';
ALTER TABLE `inventory_unit` MODIFY COLUMN `text` VARCHAR(50) NULL DEFAULT NULL COMMENT 'null for predefined units';
CALL add_column_if_missing('inventory_unit', 'token', "VARCHAR(20) NULL DEFAULT NULL COMMENT 'translation token for predefined units'");
CALL add_constraint_if_missing('inventory_unit', 'inventory_unit__unique_token', 'UNIQUE KEY (`token`)');

INSERT INTO `inventory_unit` (`id`, `token`) VALUES ( 1,  'ACTION')    ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='ACTION';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES ( 2,  'AMPOULE')   ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='AMPOULE';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES ( 3,  'ARTICLE')   ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='ARTICLE';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES ( 4, 'BAG')       ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='BAG';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES ( 5, 'BALE')      ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='BALE';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES ( 6, 'BARREL')    ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='BARREL';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES ( 7, 'BOTTLE')    ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='BOTTLE';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES ( 8, 'BOX')       ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='BOX';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES ( 9, 'BUCKET')    ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='BUCKET';

INSERT INTO `inventory_unit` (`id`, `token`) VALUES (10, 'BUNDLE')    ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='BUNDLE';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (11, 'CAN')       ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='CAN';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (12, 'CAPSULE')   ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='CAPSULE';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (13, 'CARTON')    ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='CARTON';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (14, 'COPY')      ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='COPY';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (15, 'DAY')       ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='DAY';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (16, 'EGG')       ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='EGG';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (17, 'FLASK')     ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='FLASK';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (18, 'GLOVES')    ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='GLOVES';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (19, 'INFUSION')  ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='INFUSION';

INSERT INTO `inventory_unit` (`id`, `token`) VALUES (20, 'INJECTION') ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='INJECTION';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (21, 'JAR')       ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='JAR';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (22, 'KIT')       ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='KIT';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (23, 'LOT')       ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='LOT';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (24, 'PACKAGE')   ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='PACKAGE';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (25, 'PACKET')    ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='PACKET';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (26, 'PAIR')      ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='PAIR';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (27, 'PALLET')    ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='PALLET';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (28, 'PIECE')     ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='PIECE';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (29, 'PILL')      ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='PILL';

INSERT INTO `inventory_unit` (`id`, `token`) VALUES (30, 'POUCH')     ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='POUCH';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (31, 'REAM')      ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='REAM';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (32, 'ROLL')      ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='ROLL';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (33, 'SACK')         ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='SACK';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (34, 'SET')          ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='SET';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (35, 'SUPPOSITORY')  ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='SUPPOSITORY';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (36, 'SYRUP')        ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='SYRUP';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (37, 'TABLET')       ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='TABLET';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (38, 'TREATMENT')    ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='TREATMENT';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (39, 'TUBE')         ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='TUBE';

INSERT INTO `inventory_unit` (`id`, `token`) VALUES (40, 'UNIT')         ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='UNIT';
INSERT INTO `inventory_unit` (`id`, `token`) VALUES (41, 'VIAL')         ON DUPLICATE KEY UPDATE `abbr`=NULL, `text`=NULL, token='VIAL';

/**
 * @author: jmcameron
 * @description: For shipment containers
 * @date: 2021-08-17
 */
CALL add_column_if_missing('shipment_container', 'description', 'TEXT NULL');

