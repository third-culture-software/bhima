-- next migration file
--

/**
* date: 2025-26-01
* author: jniles
* description: migrate the max_credit field to max_debt to facilitate blocking 
* invoicing on the patient invoice page.
*/
ALTER TABLE debtor_group CHANGE max_credit max_debt MEDIUMINT(8) UNSIGNED DEFAULT 0;

/**
* date: 2025-26-01
* author: mbayopanda
* description: add the support of funding sources in stock
*/
DROP TABLE IF EXISTS `funding_source`;
CREATE TABLE `funding_source` (
  `uuid`  BINARY(16) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `code`  VARCHAR(191) NOT NULL UNIQUE,
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

-- @mbayopanda: Update the lot table to support funding source for each lot
CALL add_column_if_missing('lot', 'funding_source_uuid', 'BINARY(16) NULL');

-- @mbayopanda: Add entry in the unit table for funding sources
INSERT INTO `unit` VALUES 
  (321, 'Funding Source','TREE.FUNDING_SOURCES','',1,'/funding_sources');

-- @mbayopanda: Update the lot table to support funding source for each lot
CALL add_column_if_missing('lot', 'funding_source_uuid', 'BINARY(16) NULL');

-- @mbayopanda: Update the stock_setting table to enable to funding source
CALL add_column_if_missing('stock_setting', 'enable_funding_source', 'TINYINT(1) NOT NULL DEFAULT 0');
