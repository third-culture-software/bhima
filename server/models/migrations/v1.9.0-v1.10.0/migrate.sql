/*
 * DATABASE CHANGES FOR VERSION 1.9.1 TO 1.10.0
 */

-- inventory change report
-- by jeremielodi
-- 2019-11-18

INSERT INTO unit (id, name, `key`, description, parent, url, path) VALUES
(266, 'Inventory Changes Report', 'REPORT.INVENTORY_CHANGE.TITLE', 'Inventory Changes Report', 144, '/modules/reports/inventoryChanges', '/reports/inventoryChanges');

INSERT INTO report (report_key, title_key) VALUES
('inventoryChanges', 'REPORT.INVENTORY_CHANGE.TITLE');

-- by @jniles
-- 2020-02-02
DROP TABLE department;

DELETE FROM role_unit
WHERE unit_id = 215;
DELETE FROM unit
WHERE id = 215;

ALTER TABLE inventory_log DROP FOREIGN KEY inventory_log_ibfk_1;
