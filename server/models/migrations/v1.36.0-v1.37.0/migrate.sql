-- migrate from v1.36.0 to v1.37.0

-- adds the preferred_language to the user table
-- Close #7936.
CALL add_column_if_missing('user', 'preferred_language', 'TEXT NULL');

-- removes the is_admin column from the user table
ALTER TABLE `user` DROP COLUMN `is_admin`;

-- move all of asset management into stock
UPDATE unit set `parent` = 160 WHERE `id` = 307;

-- drop unused stored procedures and functions
DROP PROCEDURE IF EXISTS `UnbalancedInvoicePayments`;
DROP PROCEDURE IF EXISTS `UnbalancedInvoicePaymentsTable`;
DROP PROCEDURE IF EXISTS RecomputeInventoryStockValue;
DROP PROCEDURE IF EXISTS RecomputeAllInventoriesValue;
DROP PROCEDURE IF EXISTS UpdateStaffingIndices;
DROP PROCEDURE IF EXISTS addStagePaymentIndice;
DROP FUNCTION IF EXISTS sumTotalIndex;
DROP FUNCTION IF EXISTS getStagePaymentIndice;
