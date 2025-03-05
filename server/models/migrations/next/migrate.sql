

-- adds the preferred_language to the user table
-- Close #7936.
CALL add_column_if_missing('user', 'preferred_language', 'TEXT NULL');

-- removes the is_admin column from the user table
ALTER TABLE `user` DROP COLUMN `is_admin`;

-- move all of asset management into Stock
UPDATE unit set `parent` = 160 WHERE `id` = 307;

-- @mbayopanda: Add entry in the unit table for funding sources
INSERT INTO `unit` VALUES 
  (321, 'Funding Source','TREE.FUNDING_SOURCES','',1,'/funding_sources');

-- @mbayopanda: Update the stock_setting table to enable to funding source
CALL add_column_if_missing('stock_setting', 'enable_funding_source', 'TINYINT(1) NOT NULL DEFAULT 0');

/*
 * @author: jniles
 * @date: 2024-12-24
 * Change the name of the "hiring_date" column to "date_embauche" in the "employee" table
 */
ALTER TABLE `employee` CHANGE COLUMN date_embauche hiring_date DATETIME DEFAULT NULL;

/*
* @author: jniles
* @date: 2024-12-28 
* Correct the spelling of the human resources
*/
UPDATE unit SET `path` = 'TREE.HUMAN_RESOURCES' WHERE `path` = 'TREE.HUMANS_RESSOURCES';

/* 
 * @author: jniles
 * @date: 2024-04-03
 * Add the dhis2_uid column to the enterprise table to allow integration with DHIS2.
 */
CALL add_column_if_missing('enterprise', 'dhis2_uid', 'TEXT DEFAULT NULL');

/*
 * @author: mbayopanda
 * @date: 2025-01-05
 * Add the logo column to the project table
 */
CALL add_column_if_missing('project', 'logo', 'VARCHAR(100) DEFAULT NULL');
