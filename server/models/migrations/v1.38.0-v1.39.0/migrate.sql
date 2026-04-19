/* migration file from v1.38.0 - v1.39.0 */

-- Add optional "hidden" flag on inventory: exclude from default listings without renaming the item
CALL add_column_if_missing('inventory', 'hidden', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER `locked`');
