/* v1.29.0 - v1.30.0 */

/**
 * @author: jmcameron
 * @description: Updates for budget module
 * @date: 2023-11-02
 */

-- Update the budget table
ALTER TABLE budget MODIFY COLUMN id INT(11) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE budget MODIFY COLUMN budget DECIMAL(19, 4) UNSIGNED NOT NULL DEFAULT 0;
CALL add_column_if_missing('budget', 'locked', 'BOOLEAN NOT NULL DEFAULT 0');
CALL add_column_if_missing('budget', 'updated_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- Add the Finance > Budget page
INSERT INTO unit VALUES
(319, 'Budget Management', 'TREE.BUDGET', '', 5, '/budget');

-- remove the account_statement report
DELETE FROM role_unit
WHERE unit_id = 170;
DELETE FROM unit
WHERE id = 170;
