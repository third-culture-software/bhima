-- next migration file

/**
* date: 2025-26-01
* author: jniles
* description: migrate the max_credit field to max_debt to facilitate blocking 
* invoicing on the patient invoice page.
*/
ALTER TABLE debtor_group CHANGE max_credit max_debt MEDIUMINT(8) UNSIGNED DEFAULT 0;

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
 * @date: 2024-12-24
 * Change the name of the "hiring_date" column to "date_embauche" in the "employee" table
 */
ALTER TABLE `employee` CHANGE COLUMN date_embauche hiring_date DATETIME DEFAULT NULL;
