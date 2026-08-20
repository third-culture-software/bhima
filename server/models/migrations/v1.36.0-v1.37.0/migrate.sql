-- migrate from v1.36.0 to v1.37.0

-- adds the preferred_language to the user table
-- Close #7936.
CALL add_column_if_missing('user', 'preferred_language', 'TEXT NULL');

-- removes the is_admin column from the user table
ALTER TABLE user DROP COLUMN is_admin;

-- move all of asset management into stock
UPDATE unit SET parent = 160
WHERE id = 307;

-- drop unused stored procedures and functions
DROP PROCEDURE IF EXISTS unbalancedinvoicepayments;
DROP PROCEDURE IF EXISTS unbalancedinvoicepaymentstable;
DROP PROCEDURE IF EXISTS recomputeinventorystockvalue;
DROP PROCEDURE IF EXISTS recomputeallinventoriesvalue;
DROP PROCEDURE IF EXISTS updatestaffingindices;
DROP PROCEDURE IF EXISTS addstagepaymentindice;
DROP FUNCTION IF EXISTS sumtotalindex;
DROP FUNCTION IF EXISTS getstagepaymentindice;
