
-- @jniles: modify the email fields to standarize the field length
ALTER TABLE `patient` MODIFY `email` VARCHAR(150) DEFAULT NULL;
ALTER TABLE `debtor_group` MODIFY `email` VARCHAR(150) DEFAULT '';
ALTER TABLE `enterprise` MODIFY `email` VARCHAR(150) DEFAULT NULL;
ALTER TABLE `supplier` MODIFY `email` VARCHAR(150) DEFAULT NULL;
ALTER TABLE `user` MODIFY `email` VARCHAR(150) DEFAULT NULL;
