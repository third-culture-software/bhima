SET names 'utf8mb4';
SET character_set_database = 'utf8mb4';
SET collation_database = 'utf8mb4_unicode_ci';
SET CHARACTER SET utf8mb4, CHARACTER_SET_CONNECTION = utf8mb4;

/**
 * the core.sql file contains data about :
 *  - project
 *  - service
 *  - fiscal year
 *  - exchange rate
 *  - debtor group
 *  - patient group
 *  - patient
 *  - debtor
 *  - creditor group
 *  - creditor
 *  - supplier
 *
 * dependencies :
 *  - accounts
 */

--
-- Project
--

INSERT INTO `project` VALUES
  (1, 'Test Project A', 'TPA', 1, 1, 0, NULL),
  (2, 'Test Project B', 'TPB', 1, 2, 0, NULL),
  (3, 'Test Project C', 'TPC', 1, 2, 0, NULL);

--
-- Mock services
--

SET @testService = HUID('aff85bdc-d7c6-4047-afe7-1724f8cd369e');
SET @adminService = HUID('b1816006-5558-45f9-93a0-c222b5efa6cb');
SET @medicineInterneService = HUID('e3988489-ef66-41df-88fa-8b8ed6aa03ac');

INSERT INTO `service` (uuid, enterprise_id, project_id, name) VALUES
  (@testService, 1, 1, 'Test Service'),
  (@adminService, 1, 1, 'Administration'),
  (@medicineInterneService, 1, 1, 'Medecine Interne');

--
-- Mock users
--

-- the superuser
SET @superUser = 1;

INSERT INTO user (id, username, password, display_name, email, deactivated) VALUES
  (@superUser, 'superuser', MYSQL5_PASSWORD('superuser'), 'Super User', 'SuperUser@test.org', 0),
  (2, 'RegularUser', MYSQL5_PASSWORD('RegularUser'), 'Regular User', 'RegUser@test.org', 0),
  (3, 'NoUserPermissions', MYSQL5_PASSWORD('NoUserPermissions'), 'No Permissrepertoireions', 'Invalid@test.org', 1),
  (4, 'admin', MYSQL5_PASSWORD('1'), 'Admin User', 'admin@test.org', 1);

-- the super user has permission to everything user
INSERT INTO permission (unit_id, user_id)
SELECT unit.id, @superUser FROM unit ON DUPLICATE KEY UPDATE unit_id = unit_id, user_id = user_id;

--
-- Mock Roles
--

SET @roleUUID = HUID('5b7dd0d6-9273-4955-a703-126fbd504b61');
SET @regularRoleUUID = HUID('5f7dd0c6-9273-4955-a703-126fbd504b61');

INSERT INTO `role`(uuid, label) VALUES
  (@roleUUID, 'Admin'),
  (@regularRoleUUID, 'Regular');

-- Admin role units
INSERT INTO role_unit
  SELECT HUID(UUID()) as uuid, @roleUUID, id FROM unit;

-- Regular role units
INSERT INTO role_unit VALUES
  (HUID('76b1c46e-b1b3-11e8-9c1e-87e393921fe3'), @regularRoleUUID , 0 ),
  (HUID('77af2154-b1b3-11e8-ac24-931d721bd446'), @regularRoleUUID , 1 ),
  (HUID('78537ee8-b1b3-11e8-9838-3f6a169f8138'), @regularRoleUUID , 2 ),
  (HUID('78bb7872-b1b3-11e8-ad43-1f4fc435053e'), @regularRoleUUID , 3 ),
  (HUID('7b35eec0-b1b3-11e8-95b3-37d9cf076502'), @regularRoleUUID , 4 );

-- Action role
INSERT INTO role_actions SELECT HUID(UUID()) as uuid, @roleUUID, id FROM actions;

-- User role
INSERT INTO `user_role`(uuid, user_id, role_uuid) VALUES (HUID('9df98fca-b1b3-11e8-a403-1f1cd9345667'), 1, @roleUUID);
INSERT INTO `user_role`(uuid, user_id, role_uuid) VALUES (HUID('6050a2bc-b1b3-11e8-a0f5-8b6d28d94cad'), 2, @regularRoleUUID);

--
-- Fiscal Years
--

SET @fiscalYear2019 = 0;
CALL CreateFiscalYear(1, NULL, @superUser, 'Fiscal Year 2019', 12, DATE('2019-01-01'), DATE('2019-12-31'), 'Notes for 2019', @fiscalYear2019);

SET @fiscalYear2020 = 0;
CALL CreateFiscalYear(1, @fiscalYear2019, @superUser, 'Fiscal Year 2020', 12, DATE('2020-01-01'), DATE('2020-12-31'), 'Notes for 2020', @fiscalYear2020);

SET @fiscalYear2021 = 0;
CALL CreateFiscalYear(1, @fiscalYear2020, @superUser, 'Fiscal Year 2021', 12, DATE('2021-01-01'), DATE('2021-12-31'), 'Notes for 2021', @fiscalYear2021);

SET @fiscalYear2022 = 0;
CALL CreateFiscalYear(1, @fiscalYear2021, @superUser, 'Fiscal Year 2022', 12, DATE('2022-01-01'), DATE('2022-12-31'), 'Notes for 2022', @fiscalYear2022);

SET @fiscalYear2023 = 0;
CALL CreateFiscalYear(1, @fiscalYear2022, @superUser, 'Fiscal Year 2023', 12, DATE('2023-01-01'), DATE('2023-12-31'), 'Notes for 2023', @fiscalYear2023);

SET @fiscalYear2024 = 0;
CALL CreateFiscalYear(1, @fiscalYear2023, @superUser, 'Fiscal Year 2024', 12, DATE('2024-01-01'), DATE('2024-12-31'), 'Notes for 2024', @fiscalYear2024);

SET @fiscalYear2025 = 0;
CALL CreateFiscalYear(1, @fiscalYear2025, @superUser, 'Fiscal Year 2025', 12, DATE('2025-01-01'), DATE('2025-12-31'), 'Notes for 2025', @fiscalYear2025);

--
-- Project permission
--

INSERT INTO `project_permission` VALUES (1, 1, 1),(2, 1, 2),(3, 2, 1),(4, 4, 1);

--
-- Exchange rate for the current date
--

INSERT INTO `exchange_rate` VALUES
  (1, 1, 1, 900.0000, DATE('2016-01-01')),
  (2, 1, 1, 1950.0000, NOW());

--
-- debtor group
--

INSERT INTO `debtor_group` VALUES
  (1, HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 'Church Employees', 174, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), NULL, NULL, NULL, 0, 10, 0, NULL, 1, 1, 1, '#ff0000', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, HUID('66f03607-bfbc-4b23-aa92-9321ca0ff586'), 'NGO IMA World Health', 175, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), NULL, NULL, NULL, 0, 300, 1, NULL, 1, 1, 1, '#00ff00', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, HUID('a11e6b7f-fbbb-432e-ac2a-5312a66dccf4'), 'Cash Paying Clients', 176, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), NULL, NULL, NULL, 0, 20, 1, NULL, 1, 1, 1, '#0000ff', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

--
-- patient group
--

INSERT INTO `patient_group` VALUES
  (HUID('0b8fcc00-8640-479d-872a-31d36361fcfd'), 1, NULL, 'Test Patient Group 1', 'Test Patient Group 1 Note', '2016-03-10 08:44:23'),
  (HUID('112a9fb5-847d-4c6a-9b20-710fa8b4da24'), 1, NULL, 'Test Patient Group 2', 'Test Patient Group 2 Note', '2016-03-10 08:44:23'),
  (HUID('112a9fb5-847d-4c6a-9b20-710fa8b4da22'), 1, NULL, 'Test Patient Group 3', 'Test Patient Group 2 Note', '2016-03-12 08:44:23');

--
-- Debtor
--

INSERT INTO `debtor` (uuid, group_uuid, text) VALUES
  (HUID('3be232f9-a4b9-4af6-984c-5d3f87d5c107'), HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 'Patient/2/Patient'),
  (HUID('a11e6b7f-fbbb-432e-ac2a-5312a66dccf4'), HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 'Patient/1/Patient'),
  (HUID('76976710-27eb-46dd-b3f5-cb5eb4abbc92'), HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 'Debiteur [Employee Test 1]'),
  (HUID('dfbe4cd4-40fd-401f-bc7b-d4325119cb72'), HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 'Bad Patient Doublon');

--
-- Patient
--

INSERT INTO `patient` VALUES
  (HUID('274c51ae-efcc-4238-98c6-f402bfb39866'), 1, 2, HUID('3be232f9-a4b9-4af6-984c-5d3f87d5c107'), 'Test 2 Patient', '1990-06-01 00:00:00', FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M', NULL, NULL, NULL, NULL, NULL, NULL, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), (NOW() - INTERVAL 1 HOUR), NULL, NULL, '110', '', 1, '2015-11-14 07:04:49', NULL, NULL),
  (HUID('81af634f-321a-40de-bc6f-ceb1167a9f65'), 1, 1, HUID('a11e6b7f-fbbb-432e-ac2a-5312a66dccf4'), 'Test 1 Patient', '1990-06-01 00:00:00', FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', NULL, NULL, NULL, NULL, NULL, NULL, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), NOW(), NULL, NULL, '100', '', 2, '2015-11-14 07:04:49', NULL, NULL),
  (HUID('d1d7f856-d414-4400-8b94-8ba9445a2bc0'), 1, 4, HUID('76976710-27eb-46dd-b3f5-cb5eb4abbc92'), 'Employee Test 1', '1960-06-30', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', NULL, NULL, NULL, NULL, NULL, NULL, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), '2018-04-09 13:56:19', NULL, NULL, 'SOF-14', NULL, 1, '2018-04-09 13:56:19', NULL, NULL),
  (HUID('0f2ddc0e-686b-47c0-ad80-989671aa9f1f'), 1, 5, HUID('dfbe4cd4-40fd-401f-bc7b-d4325119cb72'), 'Bad Patient Doublon', '2017-08-24 00:00:00', FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M', NULL, NULL, NULL, NULL, NULL, NULL, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), (NOW() - INTERVAL 1 HOUR), NULL, NULL, '1110', '', 1, '2015-11-14 07:04:49', NULL, NULL);

--
-- Creditor group
--

INSERT INTO `creditor_group` VALUES
  (1, HUID('8bedb6df-6b08-4dcf-97f7-0cfbb07cf9e2'), 'SNEL', 171, 0),
  (1, HUID('b0fa5ed2-04f9-4cb3-92f7-61d6404696e7'), 'Employees', 179, 0),
  (1, HUID('c0fa5ed2-04f9-4cb3-93f7-61d6404696e7'), 'Regideso', 172, 0);

--
-- Creditor
--

INSERT INTO `creditor` VALUES
  (HUID('42d3756a-7770-4bb8-a899-7953cd859892'), HUID('b0fa5ed2-04f9-4cb3-92f7-61d6404696e7'), 'Crediteur[Test 2 Patient]'),
  (HUID('7ac4e83c-65f2-45a1-8357-8b025003d794'), HUID('8bedb6df-6b08-4dcf-97f7-0cfbb07cf9e2'), 'SNEL'),
  (HUID('18dcada5-f149-4eea-8267-19c346c2744f'), HUID('b0fa5ed2-04f9-4cb3-92f7-61d6404696e7'), 'Crediteur[Employee Test 1]');

--
-- Supplier
--

INSERT INTO `supplier` (uuid, creditor_uuid, display_name, address_1, address_2, email) VALUES
  (HUID('3ac4e83c-65f2-45a1-8357-8b025003d793'), HUID('7ac4e83c-65f2-45a1-8357-8b025003d794'), 'SNEL', '12th Avenue', 'New York City, NY 34305', 'supplier@test.org');
