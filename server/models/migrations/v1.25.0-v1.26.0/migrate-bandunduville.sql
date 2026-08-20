-- Create new site-local inventory_unit entries

INSERT INTO inventory_unit (id, abbr, text, token) VALUES (100, 'susp', 'Suspension', NULL);
UPDATE inventory SET unit_id = 100
WHERE unit_id = 23;
UPDATE inventory SET unit_id = 23
WHERE unit_id = 5;  -- LOT

INSERT INTO inventory_unit (id, abbr, text, token) VALUES (101, 'clr', 'Collyre', NULL);
UPDATE inventory SET unit_id = 101
WHERE unit_id = 24;
UPDATE inventory SET unit_id = 24
WHERE unit_id = 12;  -- BOTTLE  **

INSERT INTO inventory_unit (id, abbr, text, token) VALUES (102, 'SLT', 'Solution', NULL);
UPDATE inventory SET unit_id = 102
WHERE unit_id = 26;

INSERT INTO inventory_unit (id, abbr, text, token) VALUES (103, 'PrtqPfssnll', 'Pratique Professionnelle', NULL);
UPDATE inventory SET unit_id = 103
WHERE unit_id = 28;
UPDATE inventory SET unit_id = 28
WHERE unit_id = 13;  -- PIECE

-- update inventory references to unit_id

UPDATE inventory SET unit_id = 27
WHERE unit_id = 3;  -- PALLET
UPDATE inventory SET unit_id = 2
WHERE unit_id = 6;  -- AMPOULE
UPDATE inventory SET unit_id = 12
WHERE unit_id = 9;  -- CAPSULE
UPDATE inventory SET unit_id = 17
WHERE unit_id = 10;  -- FLASK
UPDATE inventory SET unit_id = 30
WHERE unit_id = 14;  -- POUCH
UPDATE inventory SET unit_id = 37
WHERE unit_id = 15;  -- TABLET
UPDATE inventory SET unit_id = 35
WHERE unit_id = 20;  -- SUPPOSITORY

-- The following changes need to be done in careful order due to overlapping id values

UPDATE inventory SET unit_id = 8
WHERE unit_id = 4;  -- BOX
UPDATE inventory SET unit_id = 4
WHERE unit_id = 7;  -- BAG

UPDATE inventory SET unit_id = 39
WHERE unit_id = 16;  -- TUBE
UPDATE inventory SET unit_id = 16
WHERE unit_id = 21;  -- EGG

UPDATE inventory SET unit_id = 36
WHERE unit_id = 19;  -- SYRUP
UPDATE inventory SET unit_id = 19
WHERE unit_id = 22;  -- INFUSION
UPDATE inventory SET unit_id = 22
WHERE unit_id = 25;  -- KIT

----------------------------------------------------------------------
-- OLD Inventory Units
--   Based on download of 2022-07-10
--   ( * => inventory_unit IDs actually used)
--
-- > select * from inventory_unit;
-- +-----+-------------+--------------------------+
-- | id  | abbr        | text                     |                ** = Two steps
-- +-----+-------------+--------------------------+
-- |  1 *| Act         | Act                      | --> OK
-- |  2  | Pal         | Pallet                   | --> 27 PALLET  **
-- |  3  | Pill        | Pillule                  | --> 29 PILL
-- |  4 *| Box         | Box                      | -->  8 BOX     **
-- |  5 *| Lot         | Lot                      | --> 23 LOT
-- |  6 *| amp         | ampoule                  | -->  2 AMPOULE **
-- |  7 *| bags        | bags                     | -->  4 BAG     **
-- |  8  | btl         | bouteille                | -->  7 BOTTLE  **
-- |  9 *| cap         | capsule                  | --> 12 CAPSULE **
-- | 10 *| flc         | flacon                   | --> 17 FLASK   **
-- | 11  | jar         | jar                      | --> 21 JAR     **
-- | 12 *| ltr         | littre                   | -->  7 BOTTLE  **
-- | 13 *| pce         | piece                    | --> 28 PIECE   **
-- | 14 *| sch         | sachet                   | --> 30 POUCH
-- | 15 *| tab         | tablette                 | --> 37 TABLET
-- | 16 *| tub         | tube                     | --> 39 TUBE
-- | 17  | vial        | vial                     | --> SKIP (not used)
-- | 18  | unit        | unit                     | --> SKIP (not used)
-- | 19 *| srp         | Sirop                    | --> 36 SYRUP
-- | 20 *| supp        | Suppositoire             | --> 35 SUPPOSITORY
-- | 21 *| OV          | Ovule                    | --> 16 EGG      **
-- | 22 *| Inf         | Infusion                 | --> 19 INFUSION **
-- | 23 *| susp        | Suspension               | --> NEW
-- | 24 *| clr         | Collyre                  | --> NEW
-- | 25 *| kt          | Kit                      | --> 22 KIT      **
-- | 26 *| SLT         | Solution                 | --> NEW
-- | 27  | BSSCR       | Boisson Sucre            | --> SKIP (not used)
-- | 28 *| PRTQPFSSNLL | PRATIQUE PROFESSIONNELLE | --> NEW
-- +-----+-------------+--------------------------+ -->
