/*
 * DATABASE CHANGES FOR VERSION 1.8.1 TO 1.9.0
 */

ALTER TABLE stock_movement MODIFY COLUMN reference INT(11) UNSIGNED NOT NULL;
ALTER TABLE stock_movement DROP PRIMARY KEY;
ALTER TABLE stock_movement ADD PRIMARY KEY (uuid);
ALTER TABLE stock_movement ADD INDEX document_uuid (document_uuid);
ALTER TABLE stock_movement DROP KEY stock_movement_uuid;
