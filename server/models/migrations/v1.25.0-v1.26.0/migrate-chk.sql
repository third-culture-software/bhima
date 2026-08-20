-- Create new site-local inventory_unit entries

INSERT INTO inventory_unit (id, abbr, text, token) VALUES (100, 'PT', 'Pot', NULL);
UPDATE inventory SET unit_id = 100
WHERE unit_id = 20;

-- Update inventory references to unit_id

UPDATE inventory SET unit_id = 27
WHERE unit_id = 3;  -- PALLET
UPDATE inventory SET unit_id = 28
WHERE unit_id = 13;  -- PIECE
UPDATE inventory SET unit_id = 30
WHERE unit_id = 14;  -- POUCH
UPDATE inventory SET unit_id = 37
WHERE unit_id = 15;  -- TABLET
UPDATE inventory SET unit_id = 35
WHERE unit_id = 18;  -- SUPPOSITORY
UPDATE inventory SET unit_id = 36
WHERE unit_id = 19;  -- SYRUP

-- The following changes need to be done in careful order due to overlapping id values
UPDATE inventory SET unit_id = 27
WHERE unit_id = 2;  -- PALLET
UPDATE inventory SET unit_id = 2
WHERE unit_id = 6;  -- AMPOULE

UPDATE inventory SET unit_id = 7
WHERE unit_id = 8;  -- BOTTLE (btl)
UPDATE inventory SET unit_id = 8
WHERE unit_id = 4;  -- BOX

UPDATE inventory SET unit_id = 7
WHERE unit_id = 12;  -- BOTTLE (litre)
UPDATE inventory SET unit_id = 12
WHERE unit_id = 9;  -- CAPSULE

UPDATE inventory SET unit_id = 39
WHERE unit_id = 16;  -- TUBE
UPDATE inventory SET unit_id = 16
WHERE unit_id = 21;  -- EGG

UPDATE inventory SET unit_id = 41
WHERE unit_id = 17;  -- VIAL
UPDATE inventory SET unit_id = 17
WHERE unit_id = 10;  -- FLASK


----------------------------------------------------------------------
-- OLD Inventory Units
--   Based on download of 2022-08-11
--   ( * => inventory_unit IDs actually used)
--
-- > select * from inventory_unit;
-- +-----+------+--------------+
-- | id  | abbr | text         |                ** = Two step
-- +-----+------+--------------+
-- |  1 *| Act  | Act          | --> OK
-- |  2 *| Pal  | Pallet       | --> 27 PALLET
-- |  3  | Pill | Pillule      | --> 29 PILL
-- |  4 *| Box  | Box          | -->  8 BOX          **
-- |  5  | Lot  | Lot          | --> 23 LOT
-- |  6 *| amp  | ampoule      | -->  2 AMPOULE      **
-- |  7  | bags | bags         | --> 21 BAG          **
-- |  8 *| btl  | bouteille    | -->  7 BOTTLE       **
-- |  9 *| cap  | capsule      | --> 12 CAPSULE      **
-- | 10 *| flc  | flacon       | --> 17 FLASK        **
-- | 11  | jar  | jar          | --> SKIP (not used)
-- | 12 *| ltr  | littre       | -->  7 BOTTLE       **
-- | 13 *| pce  | piece        | --> 28 PIECE
-- | 14 *| sch  | sachet       | --> 30 POUCH
-- | 15 *| tab  | tablette     | --> 37 TABLET
-- | 16 *| tub  | tube         | --> 39 TUBE
-- | 17 *| vial | vial         | --> 41 VIAL
-- | 18 *| Sup  | suppositoire | --> 35 SUPPOSITORY
-- | 19 *| SRP  | Sirop        | --> 36 SYRUP
-- | 20 *| PT   | Pot          | --> NEW
-- | 21 *| OV   | Ovule        | --> 16 EGG
-- +-----+------+--------------+
