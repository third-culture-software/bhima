-- Add stock movement unit
INSERT INTO unit VALUES
(162, 'Stock Movements', 'TREE.STOCK_MOVEMENTS', 'The stock lots movements registry', 160, '/stock/movements');

-- Assign the unit to roles which have related units
INSERT INTO role_unit
SELECT DISTINCT
    HUID(UUID()),
    ru.role_uuid,
    162
FROM role_unit AS ru
WHERE ru.unit_id IN (161, 163);
