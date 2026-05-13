/* unreleased migration: standardize email columns to empty string (no NULL) */

UPDATE debtor_group SET email = '' WHERE email IS NULL;
UPDATE enterprise SET email = '' WHERE email IS NULL;
UPDATE patient SET email = '' WHERE email IS NULL;
UPDATE entity SET email = '' WHERE email IS NULL;
UPDATE supplier SET email = '' WHERE email IS NULL;
UPDATE user SET email = '' WHERE email IS NULL;

ALTER TABLE `debtor_group` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE `enterprise` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE `patient` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE `entity` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE `supplier` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE `user` MODIFY `email` VARCHAR(150) NOT NULL DEFAULT '';
