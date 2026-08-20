-- Create new site-local inventory_unit entries

INSERT INTO inventory_unit (id, abbr, text, token) VALUES (100, 'MEKA', 'MEKA', NULL);
UPDATE inventory SET unit_id = 100
WHERE unit_id = 18;

-- Update inventory references to unit_id

UPDATE inventory SET unit_id = 29
WHERE unit_id = 3;  -- PILL
UPDATE inventory SET unit_id = 23
WHERE unit_id = 5;  -- LOT
UPDATE inventory SET unit_id = 21
WHERE unit_id = 11;  -- JAR
UPDATE inventory SET unit_id = 28
WHERE unit_id = 13;  -- PIECE
UPDATE inventory SET unit_id = 30
WHERE unit_id = 14;  -- POUCH
UPDATE inventory SET unit_id = 37
WHERE unit_id = 15;  -- TABLET
UPDATE inventory SET unit_id = 39
WHERE unit_id = 16;  -- TUBE

-- The following changes need to be done in careful order due to overlapping id values

UPDATE inventory SET unit_id = 27
WHERE unit_id = 2;  -- PALLET
UPDATE inventory SET unit_id = 2
WHERE unit_id = 6;  -- AMPOULE

UPDATE inventory SET unit_id = 99
WHERE unit_id = 4;  -- BOX
UPDATE inventory SET unit_id = 4
WHERE unit_id = 7;  -- BAG
UPDATE inventory SET unit_id = 7
WHERE unit_id = 99;  -- BOX
UPDATE inventory SET unit_id = 7
WHERE unit_id = 8;  -- BOTTLE (btl)
UPDATE inventory SET unit_id = 7
WHERE unit_id = 12;  -- BOTTLE (ltr)
UPDATE inventory SET unit_id = 7
WHERE unit_id = 20;  -- BOTTLE (BOUTEILLE)
UPDATE inventory SET unit_id = 12
WHERE unit_id = 9;  -- CAPSULE

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
-- +-----+-----------+------------------------------+
-- | id  | abbr      | text                         |
-- +-----+-----------+------------------------------+
-- |  1 *| Act       | Act                          | --> OK
-- |  2 *| Pallet    | Pallet                       | --> 27 PALLET
-- |  3 *| Pill      | Pill                         | --> 29 PILL
-- |  4 *| Box       | Box                          | -->  8 BOX      **
-- |  5 *| Lot       | Lot                          | --> 23 LOT      **
-- |  6 *| amp       | amp                          | -->  2 AMPOULE  **
-- |  7 *| bags      | bags                         | -->  4 BAG      **
-- |  8 *| btl       | btl                          | -->  7 BOTTLE   **
-- |  9 *| cap       | cap                          | --> 12 CAPSULE  **
-- | 10 *| flc       | flc                          | --> 17 FLASK    **
-- | 11 *| jar       | jar                          | --> 21 JAR      **
-- | 12 *| ltr       | ltr                          | -->  7 BOTTLE   **
-- | 13 *| pce       | pce                          | --> 28 PIECE
-- | 14 *| sch       | sch                          | --> 30 POUCH
-- | 15 *| tab       | tab                          | --> 37 TABLET
-- | 16 *| tub       | tub                          | --> 39 TUBE
-- | 17 *| vial      | vial                         | --> 41 VIAL
-- | 18 *| MEKA      | MEKA                         | --> NEW
-- | 19  | COLIS     | COLIS                        | --> 24 PACKAGE  **
-- | 20 *| BOUTEILLE | BOUTEILLE                    | -->  7 BOTTLE   **
-- | 21  | BL        | BLOUSSES OPERATOIRE STERILES | --> SKIP (not used)
-- | 22  | CH OP.    | CHAMPS OPERATOIRE AVEC TROU  | --> SKIP (not used)
-- | 23  | BP        | BANDE PLATREE 10CM*2.7 CM    | --> SKIP (not used)
-- | 24  | BP 2      | BANDE PLATREE                | --> SKIP (not used)
-- | 25  | BP2       | BANDE PLATREE 15CM*2.7 CM    | --> SKIP (not used)
-- +-----+-----------+------------------------------+ -->
