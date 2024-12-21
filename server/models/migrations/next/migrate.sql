-- next migration file

/*
 * @author: jniles
 * @date: 2024-12-24
 * Change the name of the "hiring_date" column to "date_embauche" in the "employee" table
 */
ALTER TABLE `employee` CHANGE COLUMN date_embauche hiring_date DATETIME DEFAULT NULL;
