/**
 * @author: jmcameron
 * @description: Cost Center updates
 * @date: 2021-06-27
 */

UPDATE unit SET `key` = 'TREE.COST_CENTER_STEPDOWN_REPORT'
WHERE id = 298;

/**
 * @author: jmcameron
 * @description: Shipments updates
 * @date: 2021-07-12
 */

ALTER TABLE inventory MODIFY COLUMN unit_weight FLOAT NOT NULL DEFAULT 0;
CALL add_column_if_missing('shipment_item', 'unit_weight', 'FLOAT NOT NULL DEFAULT 0');

ALTER TABLE shipment MODIFY COLUMN receiver VARCHAR(100) NULL;
CALL drop_column_if_exists('shipment', 'note');
CALL add_column_if_missing('shipment', 'transport_mode', 'VARCHAR(100) NULL');
