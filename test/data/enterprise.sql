SET names 'utf8mb4';
SET character_set_database = 'utf8mb4';
SET collation_database = 'utf8mb4_unicode_ci';
SET CHARACTER SET utf8mb4, CHARACTER_SET_CONNECTION = utf8mb4;

/**
 * the core.sql file contains data about :
 *  - enterprise
 *  - enterprise setting
 */

--
-- Enterprise
--

INSERT INTO `enterprise` VALUES
  (1, 'Test Enterprise', 'TE', '243 81 504 0540', 'enterprise@test.org', NULL, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), NULL, 2, 103, NULL, NULL, NULL, NULL);

--
-- Enterprise Settings
--

INSERT INTO `enterprise_setting` (
  enterprise_id,
  enable_price_lock,
  enable_password_validation,
  enable_auto_email_report
) VALUES (1, 0, 0, 1);
