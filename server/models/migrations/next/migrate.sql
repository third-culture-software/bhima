-- next migration file
--

/**
* date: 2025-26-01
* author: jniles
* description: migrate the max_credit field to max_debt to facilitate blocking 
* invoicing on the patient invoice page.
*/
ALTER TABLE debtor_group CHANGE max_credit max_debt MEDIUMINT(8) UNSIGNED DEFAULT 0;
