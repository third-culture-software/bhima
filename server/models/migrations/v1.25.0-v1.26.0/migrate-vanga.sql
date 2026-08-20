/**
 * @author: jmcameron
 * @description: Updates for inventory units
 * @date: 2021-08-12
 */

-- Create new site-local inventory_unit entries

INSERT INTO inventory_unit (id, abbr, text, token) VALUE (100, 'Materiels', 'Materiels', NULL);
UPDATE inventory SET unit_id = 100
WHERE unit_id = 4;

INSERT INTO inventory_unit (id, abbr, text, token) VALUE (101, 'Collure Op', 'Collure Opthm.', NULL);
UPDATE inventory SET unit_id = 101
WHERE unit_id = 5;

INSERT INTO inventory_unit (id, abbr, text, token) VALUE (102, 'Pommade', 'Pommade', NULL);
UPDATE inventory SET unit_id = 102
WHERE unit_id = 12;

INSERT INTO inventory_unit (id, abbr, text, token) VALUE (103, 'Liquide 1L', 'Liquide 1L', NULL);
UPDATE inventory SET unit_id = 103
WHERE unit_id = 19;

INSERT INTO inventory_unit (id, abbr, text, token) VALUE (104, '1 ml', 'liquide1 ml', NULL);
UPDATE inventory SET unit_id = 104
WHERE unit_id = 21;

INSERT INTO inventory_unit (id, abbr, text, token) VALUE (105, 'centaine', 'Emballage a 100 pces', NULL);
UPDATE inventory SET unit_id = 105
WHERE unit_id = 22;

-- Update old unit_id values

UPDATE inventory SET unit_id = 27
WHERE unit_id = 2; -- Pallet
UPDATE inventory SET unit_id = 29
WHERE unit_id = 3; -- Pill
UPDATE inventory SET unit_id = 37
WHERE unit_id = 7; -- Comprimes
UPDATE inventory SET unit_id = 12
WHERE unit_id = 9; -- Capsuls
UPDATE inventory SET unit_id = 17
WHERE unit_id = 10; -- flc
UPDATE inventory SET unit_id = 35
WHERE unit_id = 11; -- Suppositoire
UPDATE inventory SET unit_id = 28
WHERE unit_id = 13; -- Piece
UPDATE inventory SET unit_id = 30
WHERE unit_id = 14; -- Sachet
UPDATE inventory SET unit_id = 32
WHERE unit_id = 18; -- Roulots

-- The following changes need to be done in careful order due to overlapping id values

UPDATE inventory SET unit_id = 39
WHERE unit_id = 16; -- Tube
UPDATE inventory SET unit_id = 16
WHERE unit_id = 15; -- Ovule

UPDATE inventory SET unit_id = 41
WHERE unit_id = 17; -- vial
UPDATE inventory SET unit_id = 17
WHERE unit_id = 8; -- Flacon

UPDATE inventory SET unit_id = 18
WHERE unit_id = 20; -- Gants
UPDATE inventory SET unit_id = 20
WHERE unit_id = 6; -- Injectable
