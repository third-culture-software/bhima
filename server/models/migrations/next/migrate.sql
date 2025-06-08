

-- adds the preferred_language to the user table
-- Close #7936.
CALL add_column_if_missing('user', 'preferred_language', 'TEXT NULL');


-- removes the is_admin column from the user table
ALTER TABLE `user` DROP COLUMN `is_admin`;
