SET names 'utf8mb4';
SET character_set_database = 'utf8mb4';

SET CHARACTER SET utf8mb4, CHARACTER_SET_CONNECTION = utf8mb4;

-- bhima test database
SET NAMES 'utf8';
-- Enterprise
INSERT INTO `enterprise` VALUES
  (1, 'Test Enterprise', 'TE', '243 81 504 0540', 'enterprise@test.org', NULL, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), NULL, 2, 103, NULL, NULL, NULL);

INSERT INTO `enterprise_setting` (
  enterprise_id, enable_price_lock, enable_password_validation, enable_auto_email_report, base_index_growth_rate, posting_payroll_cost_center_mode, enable_activate_pension_fund) VALUES
  (1, 0, 1, 1, 5, 'default', 0);

-- Project
INSERT INTO `project` VALUES
  (1, 'Test Project A', 'TPA', 1, 1, 0),
  (2, 'Test Project B', 'TPB', 1, 2, 0),
  (3, 'Test Project C', 'TPC', 1, 2, 0);

SET @testService = HUID('aff85bdc-d7c6-4047-afe7-1724f8cd369e');
SET @adminService = HUID('b1816006-5558-45f9-93a0-c222b5efa6cb');
SET @medicineInterneService = HUID('e3988489-ef66-41df-88fa-8b8ed6aa03ac');
SET @newService =  HUID('029263E99A29436BB12EE9730A70C515');
SET @newService2 =  HUID('63E9029299A26B43B21EE973051A70C5');


-- Services
INSERT INTO `service` (uuid, enterprise_id, project_id, name) VALUES
  (@testService, 1, 1, 'Test Service'),
  (@adminService, 1, 1, 'Administration'),
  (@medicineInterneService, 1, 1, 'Medecine Interne'),
  (@newService, 1, 1, 'New Service 1'),
  (@newService2, 1, 1, 'New Service 2');

-- Accounts
INSERT INTO `account` (`id`, `type_id`, `enterprise_id`, `number`, `label`, `parent`, `locked`, `created`, `reference_id`) VALUES
  (1, 6, 1, 1, 'CLASSE 1: COMPTES DE RESSOURCES DURABLES', 0, 0, '2016-10-22 14:37:09', NULL),
  (2, 6, 1, 2, 'CLASSE 2: COMPTES D\'ACTIFS IMMOBILISES', 0, 0, '2016-10-22 14:39:01', NULL),
  (3, 6, 1, 3, 'CLASSE 3: COMPTES DE STOCKS', 0, 0, '2016-10-22 14:39:36', NULL),
  (4, 6, 1, 4, 'CLASSE 4: COMPTES DE TIERS', 0, 0, '2016-10-22 14:40:00', NULL),
  (5, 6, 1, 5, 'CLASSE 5: COMPTES DE TRESORERIE', 0, 0, '2016-10-22 14:40:26', NULL),
  (6, 6, 1, 6, 'CLASSE 6: COMPTES DES CHARGES DES ACTIVITES ORDINAIRES', 0, 0, '2016-10-22 14:40:45', NULL),
  (7, 6, 1, 7, 'CLASSE 7: COMPTES DES PRODUITS DES ACTIVITES ORDINAIRES', 0, 0, '2016-10-22 14:41:12', NULL),
  (8, 6, 1, 8, 'CLASSE 8: COMPTES DES AUTRES CHARGES ET DES AUTRES PRODUITS', 0, 0, '2016-10-22 14:41:34', NULL),
  (9, 6, 1, 10, 'CAPITAL', 1, 0, '2016-10-22 16:27:40', NULL),
  (10, 6, 1, 11, 'RESERVES', 1, 0, '2016-10-22 16:28:02', NULL),
  (11, 6, 1, 12, 'REPORT A NOUVEAU', 1, 0, '2016-10-22 16:28:24', NULL),
  (12, 6, 1, 13, 'RESULTAT NET DE L\'EXERCICE', 1, 0, '2016-10-22 16:28:45', NULL),
  (13, 6, 1, 14, 'SUBVENTIONS D\'INVESTISSEMENT', 1, 0, '2016-10-22 16:29:16', NULL),
  (14, 6, 1, 16, 'EMPRUNTS ET DETTES ASSIMILEES', 1, 0, '2016-10-22 16:29:41', NULL),
  (15, 6, 1, 17, 'DETTES DE CREDIT-BAIL ET CONTRATS ASSIMILES', 1, 0, '2016-10-22 16:30:08', NULL),
  (16, 6, 1, 18, 'DETTES LIEES A DES PARTICIPATIONS ET COMPTES DE LIAISON DES ETABLISSEMENTS ET SOCIETES EN PARTICIPATION', 1, 0, '2016-10-22 16:30:32', NULL),
  (17, 6, 1, 19, 'PROVISIONS FINANCIERES POUR RISQUES ET CHARGES', 1, 0, '2016-10-22 16:30:49', NULL),
  (18, 6, 1, 20, 'CHARGES IMMOBILISEES', 2, 0, '2016-10-22 16:31:19', NULL),
  (19, 6, 1, 21, 'IMMOBILISATIONS INCORPORELLES', 2, 0, '2016-10-22 16:32:58', NULL),
  (20, 6, 1, 22, 'TERRAINS', 2, 0, '2016-10-22 16:33:24', NULL),
  (21, 6, 1, 23, 'BATIMENTS, INSTALLATIONS TECHNIQUES ET AGENCEMENTS', 2, 0, '2016-10-22 16:33:44', NULL),
  (22, 6, 1, 24, 'MATERIELS', 2, 0, '2016-10-22 16:34:05', NULL),
  (23, 6, 1, 27, 'AUTRES IMMOBILISATIONS FINANCIERES', 2, 0, '2016-10-22 16:34:41', NULL),
  (24, 6, 1, 28, 'AMORTISSEMENTS', 2, 0, '2016-10-22 16:34:59', NULL),
  (25, 6, 1, 29, 'PROVISIONS POUR DEPRECIATIONS', 2, 0, '2016-10-22 16:35:16', NULL),
  (26, 6, 1, 31, 'MARCHANDISES', 3, 0, '2016-10-22 16:35:40', NULL),
  (27, 6, 1, 32, 'MATIERES PREMIERES ET FOURNITURES LIEES', 3, 0, '2016-10-22 16:36:00', NULL),
  (28, 6, 1, 33, 'AUTRES APPROVISIONNEMENTS', 3, 0, '2016-10-22 16:36:19', NULL),
  (29, 6, 1, 36, 'PRODUITS FINIS', 3, 0, '2016-10-22 16:36:39', NULL),
  (30, 6, 1, 38, 'STOCKS EN COURS DE ROUTE, EN CONSIGNATION OU EN DÉPÔT', 3, 0, '2016-10-22 16:37:19', NULL),
  (31, 6, 1, 39, 'DÉPRÉCIATIONS DES STOCKS', 3, 0, '2016-10-22 16:37:39', NULL),
  (32, 6, 1, 40, 'FOURNISSEURS ET COMPTE  RATTACHES', 4, 0, '2016-10-22 16:38:02', NULL),
  (33, 6, 1, 41, 'CLIENTS ET COMPTE RATTACHES', 4, 0, '2016-10-22 16:38:22', NULL),
  (34, 6, 1, 42, 'PERSONNEL', 4, 0, '2016-10-22 16:38:43', NULL),
  (35, 6, 1, 43, 'ORGANISMES  SOCIAUX', 4, 0, '2016-10-22 16:38:59', NULL),
  (36, 6, 1, 44, 'ETAT ET COLLECTIVITES PUBLIQUES', 4, 0, '2016-10-22 16:39:20', NULL),
  (37, 6, 1, 47, 'DEBITEURS  ET CREDITEURS  DIVERS', 4, 0, '2016-10-22 16:39:45', NULL),
  (38, 6, 1, 48, 'CREANCES ET DETTES  HORS ACTIVITE ORDINAIRE', 4, 0, '2016-10-22 16:39:59', NULL),
  (39, 6, 1, 49, 'DEPRECIATION ET RISQUES PROVISIONNES (Tiers)', 4, 0, '2016-10-22 16:40:23', NULL),
  (40, 6, 1, 51, 'VALEURS A ENCAISSER', 5, 0, '2016-10-22 16:40:48', NULL),
  (41, 6, 1, 52, 'BANQUES', 5, 0, '2016-10-22 16:41:05', NULL),
  (42, 6, 1, 53, 'ETABLISSEMENTS FINANCIERS ET ASSIMILES', 5, 0, '2016-10-22 16:41:19', NULL),
  (43, 6, 1, 56, 'BANQUES, CREDIT DE TRESORERIE ET D\'ESCOMPTE', 5, 0, '2016-10-22 16:41:40', NULL),
  (44, 6, 1, 57, 'CAISSE', 5, 0, '2016-10-22 16:42:13', NULL),
  (45, 6, 1, 58, 'REGIES D\'AVANCES, ACCREDITIFS ET VIREMENTS INTERNE', 5, 0, '2016-10-22 16:42:34', NULL),
  (46, 6, 1, 59, 'DEPRECIATIONS ET RISQUES PROVISIONNES', 5, 0, '2016-10-22 16:43:12', NULL),
  (47, 6, 1, 60, 'ACHATS ET VARIATIONS DE STOCKS', 6, 0, '2016-10-22 16:43:34', NULL),
  (48, 6, 1, 61, 'TRANSPORTS', 6, 0, '2016-10-22 16:43:57', NULL),
  (49, 6, 1, 62, 'SERVICES EXTÉRIEURS A', 6, 0, '2016-10-22 16:44:10', NULL),
  (50, 6, 1, 63, 'SERVICES EXTÉRIEURS B', 6, 0, '2016-10-22 16:44:30', NULL),
  (51, 6, 1, 64, 'IMPÔTS ET TAXES', 6, 0, '2016-10-22 16:44:49', NULL),
  (52, 6, 1, 65, 'AUTRES CHARGES', 6, 0, '2016-10-22 16:45:02', NULL),
  (53, 6, 1, 66, 'CHARGES DE PERSONNEL', 6, 0, '2016-10-22 16:45:18', NULL),
  (54, 6, 1, 67, 'FRAIS FINANCIERS ET CHARGES ASSIMILÉES', 6, 0, '2016-10-22 16:45:36', NULL),
  (55, 6, 1, 68, 'DOTATIONS AUX AMORTISSEMENTS', 6, 0, '2016-10-22 16:45:52', NULL),
  (56, 6, 1, 69, 'DOTATIONS AUX PROVISIONS', 6, 0, '2016-10-22 16:46:07', NULL),
  (57, 6, 1, 70, 'VENTES', 7, 0, '2016-10-22 16:47:00', NULL),
  (58, 6, 1, 71, 'SUBVENTIONS D\'EXPLOITATION', 7, 0, '2016-10-22 16:47:15', NULL),
  (59, 6, 1, 72, 'PRODUCTION IMMOBILISÉE', 7, 0, '2016-10-22 16:47:29', NULL),
  (60, 6, 1, 73, 'VARIATIONS DES STOCKS DE BIENS ET DE SERVICES PRODUITS', 7, 0, '2016-10-22 16:47:48', NULL),
  (61, 6, 1, 75, 'AUTRES PRODUITS', 7, 0, '2016-10-22 16:48:15', NULL),
  (62, 6, 1, 77, 'REVENUS FINANCIERS ET PRODUITS ASSIMILÉS', 7, 0, '2016-10-22 16:48:31', NULL),
  (63, 6, 1, 78, 'TRANSFERTS DE CHARGES', 7, 0, '2016-10-22 16:48:49', NULL),
  (64, 6, 1, 79, 'REPRISES DE PROVISIONS', 7, 0, '2016-10-22 16:49:07', NULL),
  (65, 6, 1, 81, 'VALEURS COMPTABLE DES CESSIONS D\'IMMOBILISATIONS', 8, 0, '2016-10-22 16:49:36', NULL),
  (66, 6, 1, 82, 'PRODUITS DES CESSIONS D\'IMMOBILISATIONS', 8, 0, '2016-10-22 16:49:50', NULL),
  (67, 6, 1, 83, 'CHARGES HORS ACTIVITES ORDINAIRES', 8, 0, '2016-10-22 16:50:03', NULL),
  (68, 6, 1, 84, 'PRODUITS HORS ACTIVITES ORDINAIRES', 8, 0, '2016-10-22 16:50:22', NULL),
  (69, 6, 1, 85, 'DOTATIONS HORS ACTIVITES ORDINAIRES', 8, 0, '2016-10-22 16:50:43', NULL),
  (70, 6, 1, 86, 'REPRISES HORS ACTIVITES ORDINAIRES', 8, 0, '2016-10-22 16:50:57', NULL),
  (71, 6, 1, 88, 'SUBVENTIONS D\'EQUILIBRE', 8, 0, '2016-10-22 16:51:15', NULL),
  (72, 6, 1, 89, 'IMPOTS SUR LE RESULTAT', 8, 0, '2016-10-22 16:51:30', NULL),
  (73, 6, 1, 101, 'Capital Social', 9, 0, '2016-10-22 16:56:20', NULL),
  (74, 6, 1, 105, 'Primes liées aux capitaux propres', 9, 0, '2016-10-22 16:56:46', NULL),
  (75, 6, 1, 106, 'Ecart de réévaluation', 9, 0, '2016-10-22 16:57:30', NULL),
  (76, 6, 1, 109, 'Actionnaire, Capital souscrit, non appelé', 9, 0, '2016-10-22 16:58:03', NULL),
  (77, 6, 1, 1013, 'Capital souscrit, appelé,  versé, non amorti', 73, 0, '2016-10-22 16:59:19', NULL),
  (81, 3, 1, 10133000, 'Compte - Capital souscrit, appelé,  versé, non amorti', 77, 0, '2016-10-22 17:25:29', NULL),
  (82, 6, 1, 1052, 'Primes d\'apport', 74, 0, '2016-10-22 20:55:08', NULL),
  (83, 3, 1, 10521010, 'Compte Primes d\'apport', 82, 0, '2016-10-22 20:56:08', NULL),
  (84, 6, 1, 1053, 'Primes de fusion', 74, 0, '2016-10-22 20:57:27', NULL),
  (85, 3, 1, 10531010, 'Compte Primes de fusion', 84, 0, '2016-10-22 20:58:15', NULL),
  (86, 6, 1, 1054, 'Primes de conversion', 74, 0, '2016-10-22 20:59:49', NULL),
  (87, 3, 1, 10541010, 'Compte Primes de conversion', 86, 0, '2016-10-22 21:00:28', NULL),
  (88, 6, 1, 1061, 'Ecart de réévaluation *', 75, 0, '2016-10-22 21:02:53', NULL),
  (89, 3, 1, 10610000, 'Ecart de réévaluation légal', 88, 0, '2016-10-22 21:03:47', NULL),
  (90, 6, 1, 1091, 'Actionnaire, Capital souscrit, non appelé *', 76, 0, '2016-10-22 21:06:36', NULL),
  (91, 3, 1, 10911010, 'Compte Actionnaire, Capital souscrit, non appelé', 90, 0, '2016-10-22 21:07:10', NULL),
  (92, 6, 1, 111, 'Reserve légale', 10, 0, '2016-10-22 23:39:20', NULL),
  (93, 6, 1, 1111, 'Reserve légale *', 92, 0, '2016-10-22 23:40:17', NULL),
  (94, 3, 1, 11110000, 'Compte Reserve légale', 93, 0, '2016-10-22 23:41:23', NULL),
  (95, 6, 1, 112, 'Reserve statutaires ou contractuelles', 10, 0, '2016-10-22 21:37:09', NULL),
  (96, 6, 1, 118, 'Autres reserves', 10, 0, '2016-10-22 21:37:09', NULL),
  (97, 6, 1, 1121, 'Reserve statutaires ou contractuelles *', 95, 0, '2016-10-22 21:37:09', NULL),
  (98, 6, 1, 1181, 'Autres reserves *', 96, 0, '2016-10-22 21:37:09', NULL),
  (99, 6, 1, 1188, 'Reserves diverses', 96, 0, '2016-10-22 21:37:09', NULL),
  (100, 6, 1, 121, 'Report à nouveau créditeur', 11, 0, '2016-10-22 21:37:09', NULL),
  (101, 6, 1, 129, 'Report à nouveau debiteur', 11, 0, '2016-10-22 21:37:09', NULL),
  (102, 6, 1, 1211, 'Report à nouveau créditeur *', 100, 0, '2016-10-22 21:37:09', NULL),
  (103, 6, 1, 1291, 'Perte nette à reporter', 101, 0, '2016-10-22 21:37:09', NULL),
  (104, 6, 1, 1292, 'Perte-Amortissements réputés différés', 101, 0, '2016-10-22 21:37:09', NULL),
  (105, 6, 1, 130, 'Résultat en instance d\'affectation', 12, 0, '2016-10-22 21:37:09', NULL),
  (106, 6, 1, 131, 'Résusltat net : Bénéfice', 12, 0, '2016-10-22 21:37:09', NULL),
  (107, 6, 1, 139, 'Résultat net: perte', 12, 0, '2016-10-22 21:37:09', NULL),
  (108, 6, 1, 1301, 'Résultat en instance d\'affectation: Benefice', 105, 0, '2016-10-22 21:37:09', NULL),
  (109, 6, 1, 1309, 'Résultat en instance d\'affectation: Perte', 105, 0, '2016-10-22 21:37:09', NULL),
  (111, 6, 1, 1311, 'Résusltat net : Bénéfice *', 106, 0, '2016-10-22 21:37:09', NULL),
  (112, 6, 1, 1391, 'Résultat net: perte *', 107, 0, '2016-10-22 21:37:09', NULL),
  (113, 6, 1, 141, 'Subventions d\'équipement', 13, 0, '2016-10-22 21:37:09', NULL),
  (114, 6, 1, 1411, 'Etat', 113, 0, '2016-10-22 21:37:09', NULL),
  (115, 6, 1, 1417, 'Entreprises et organismes privés', 113, 0, '2016-10-22 21:37:09', NULL),
  (116, 6, 1, 1418, 'Autres', 113, 0, '2016-10-22 21:37:09', NULL),
  (117, 6, 1, 165, 'Depots et Cautionnement recus *', 14, 0, '2016-10-22 21:37:09', NULL),
  (118, 6, 1, 168, 'Autres emprunts et dettes', 14, 0, '2016-10-22 21:37:09', NULL),
  (119, 6, 1, 1651, 'Depots', 117, 0, '2016-10-22 21:37:09', NULL),
  (120, 6, 1, 1652, 'Cautionnement', 117, 0, '2016-10-22 21:37:09', NULL),
  (121, 6, 1, 1688, 'Autres emprunts et dettes *', 118, 0, '2016-10-22 21:37:09', NULL),
  (122, 6, 1, 172, 'Emprunts équivalents de crédit-bail immobilier', 15, 0, '2016-10-22 21:37:09', NULL),
  (123, 6, 1, 186, 'Comptes de liaison charges', 16, 0, '2016-10-22 21:37:09', NULL),
  (124, 6, 1, 187, 'Comptes de liaison produits', 16, 0, '2016-10-22 21:37:09', NULL),
  (125, 6, 1, 1861, 'Comptes de liaison charges *', 123, 0, '2016-10-22 21:37:09', NULL),
  (126, 6, 1, 1871, 'Comptes de liaison produits *', 124, 0, '2016-10-22 21:37:09', NULL),
  (127, 6, 1, 191, 'Provisions pour litiges', 17, 0, '2016-10-22 21:37:09', NULL),
  (128, 6, 1, 194, 'Provisions pour pertes de change', 17, 0, '2016-10-22 21:37:09', NULL),
  (129, 6, 1, 195, 'Provisions pour impôts', 17, 0, '2016-10-22 21:37:09', NULL),
  (130, 6, 1, 196, 'Provisions pour pensions et obligations similaires', 17, 0, '2016-10-22 21:37:09', NULL),
  (131, 6, 1, 197, 'Provisions pour charges à repartir sur plusieurs exercices', 17, 0, '2016-10-22 21:37:09', NULL),
  (132, 6, 1, 198, 'Autres provisions financières pour risques et charges', 17, 0, '2016-10-22 21:37:09', NULL),
  (133, 6, 1, 1911, 'Provisions pour litiges *', 127, 0, '2016-10-22 21:37:09', NULL),
  (134, 6, 1, 1941, 'Provisions pour pertes de change *', 128, 0, '2016-10-22 21:37:09', NULL),
  (135, 6, 1, 1951, 'Provisions pour impôts *', 129, 0, '2016-10-22 21:37:09', NULL),
  (136, 6, 1, 1961, 'Provisions pour pensions et obligations similaires *', 130, 0, '2016-10-22 21:37:09', NULL),
  (137, 6, 1, 1971, 'Provisions pour charges à repartir sur plusieurs exercices *', 131, 0, '2016-10-22 21:37:09', NULL),
  (138, 6, 1, 1981, 'Autres provisions financières pour risques et charges *', 132, 0, '2016-10-22 21:37:09', NULL),
  (150, 1, 1, 22321000, 'Batiment Hopital', 20, 0, '2016-10-23 16:05:34', NULL),
  (151, 1, 1, 23131000, 'Batiment Hopital *', 21, 0, '2016-10-23 16:05:34', NULL),
  (152, 1, 1, 24480040, 'Mobiliers Hopital', 21, 0, '2016-10-23 16:05:34', NULL),
  (156, 1, 1, 28310010, 'Amortissement Batiments', 24, 0, '2016-10-23 16:05:34', NULL),
  (160, 6, 1, 311, 'MARCHANDISES A', 26, 0, '2016-10-23 16:05:34', NULL),
  (161, 6, 1, 3111, 'Médicaments', 160, 0, '2016-10-23 16:05:34', NULL),
  (162, 1, 1, 31110010, 'Médicaments en comprimes *', 161, 0, '2016-10-23 16:05:34', NULL),
  (163, 1, 1, 31110011, 'Médicaments en Sirop *', 161, 0, '2016-10-23 16:05:34', NULL),
  (170, 6, 1, 4011, 'Fournisseurs', 32, 0, '2016-10-23 16:05:34', NULL),
  (171, 1, 1, 41111000, 'SNEL', 173, 0, '2016-10-23 16:05:34', NULL),
  (172, 1, 1, 41111001, 'REGIDESO', 173, 0, '2016-10-23 16:05:34', NULL),
  (173, 6, 1, 4111, 'Client (Groupe Debiteur)', 32, 0, '2016-10-23 16:05:34', NULL),
  (174, 1, 1, 41111010, 'CHURCH', 173, 0, '2016-10-23 16:05:34', NULL),
  (175, 1, 1, 41111011, 'NGO', 173, 0, '2016-10-23 16:05:34', NULL),
  (176, 1, 1, 41111012, 'CASH PAYMENT CLIENT', 173, 0, '2016-10-23 16:05:34', NULL),
  (177, 1, 1, 41111013, 'GUEST HOUSE', 173, 0, '2016-10-23 16:05:34', NULL),
  (178, 6, 1, 422, 'REMUNERATION DUE', 34, 0, '2016-10-23 16:05:34', NULL),
  (179, 1, 1, 42210010, 'Salaires à payer', 178, 0, '2016-10-23 16:05:34', NULL),
  (180, 6, 1, 521, 'Banques locales', 41, 0, '2016-10-23 16:05:34', NULL),
  (181, 6, 1, 5211, 'Banques en Franc congolais', 180, 0, '2016-10-23 16:05:34', NULL),
  (182, 1, 1, 52111010, 'BCDC CDF', 181, 0, '2016-10-23 16:05:34', NULL),
  (183, 6, 1, 5212, 'Banques locales en Devises', 180, 0, '2016-10-23 16:05:34', NULL),
  (184, 1, 1, 52121010, 'BCDC USD', 183, 0, '2016-10-23 16:05:34', NULL),
  (185, 6, 1, 571, 'Caisse HOPITAL', 44, 0, '2016-10-23 16:05:34', NULL),
  (186, 6, 1, 5711, 'Caisse en franc congolais', 185, 0, '2016-10-23 16:05:34', NULL),
  (187, 1, 1, 57110010, 'Caisse Principale CDF', 186, 0, '2016-10-23 16:05:34', NULL),
  (188, 1, 1, 57110011, 'Caisse Auxiliaire CDF', 187, 0, '2016-10-23 16:05:34', NULL),
  (189, 6, 1, 5712, 'Caisse en devises', 185, 0, '2016-10-23 16:05:34', NULL),
  (190, 1, 1, 57120010, 'Caisse Principale USD', 189, 0, '2016-10-23 16:05:34', NULL),
  (191, 1, 1, 57120011, 'Caisse Auxiliaire USD', 189, 0, '2016-10-23 16:05:34', NULL),
  (192, 6, 1, 585, 'Virement des fonds', 45, 0, '2016-10-23 16:05:34', NULL),
  (193, 6, 1, 5851, 'Virement des fonds *', 192, 0, '2016-10-23 16:05:34', NULL),
  (194, 1, 1, 58511010, 'Virement des fonds Caisse Auxiliaire - Caisse Principale USD', 193, 0, '2016-10-23 16:05:34', NULL),
  (195, 1, 1, 58511011, 'Virement des fonds Caisse Principale - Caisse Auxiliaire USD', 193, 0, '2016-10-23 16:05:34', NULL),
  (196, 1, 1, 58511012, 'Virement des fonds Banque-Caisse Principale USD', 193, 0, '2016-10-23 16:05:34', NULL),
  (197, 1, 1, 58511013, 'Virement des fonds Caisse Auxiliaire - Caisse Principale CDF', 193, 0, '2016-10-23 16:05:34', NULL),
  (198, 1, 1, 58511014, 'Virement des fonds Caisse Principale - Caisse Auxiliaire CDF', 193, 0, '2016-10-23 16:05:34', NULL),
  (199, 1, 1, 58511015, 'Virement des fonds Banque-Caisse Principale CDF', 193, 0, '2016-10-23 16:05:34', NULL),
  (200, 6, 1, 601, 'ACHATS DE MARCHANDISES', 47, 0, '2016-10-23 16:05:34', NULL),
  (201, 5, 1, 60111010, 'Achat Médicaments en comprimés', 200, 0, '2016-10-23 16:05:34', NULL),
  (202, 5, 1, 60111011, 'Achat Médicaments en Sirop', 200, 0, '2016-10-23 16:05:34', NULL),
  (203, 5, 1, 60111012, 'Achat Médicaments en crème', 200, 0, '2016-10-23 16:05:34', NULL),
  (204, 5, 1, 60111013, 'Achat Médicaments en Poudre et Capsul', 200, 0, '2016-10-23 16:05:34', NULL),
  (205, 5, 1, 60111014, 'Achat Injectables', 200, 0, '2016-10-23 16:05:34', NULL),
  (206, 5, 1, 60111015, 'Achat Produit  de Perfusion', 200, 0, '2016-10-23 16:05:34', NULL),
  (207, 5, 1, 60111016, 'Achat Produits Ophtamologiques', 200, 0, '2016-10-23 16:05:34', NULL),
  (208, 6, 1, 603, 'VARIATIONS DES STOCKS DE BIENS ACHETÉS', 47, 0, '2016-10-23 16:05:34', NULL),
  (209, 5, 1, 60310010, 'Médicaments en comprimés', 208, 0, '2016-10-23 16:05:34', NULL),
  (210, 5, 1, 60310011, 'Médicaments en Sirop', 208, 0, '2016-10-23 16:05:34', NULL),
  (211, 5, 1, 60310012, 'Achat Médicaments en crème', 208, 0, '2016-10-23 16:05:34', NULL),
  (212, 5, 1, 60310013, 'Achat Médicaments en Poudre et Capsul', 208, 0, '2016-10-23 16:05:34', NULL),
  (213, 5, 1, 60310014, 'Achat Injectables', 208, 0, '2016-10-23 16:05:34', NULL),
  (214, 5, 1, 60310015, 'Achat Produit  de Perfusion', 208, 0, '2016-10-23 16:05:34', NULL),
  (215, 5, 1, 60310016, 'Achat Produits Ophtamologiques', 208, 0, '2016-10-23 16:05:34', NULL),
  (216, 6, 1, 605, 'AUTRES ACHATS', 47, 0, '2016-10-23 16:05:34', NULL),
  (217, 5, 1, 60511010, 'Eau', 216, 0, '2016-10-23 16:05:34', NULL),
  (218, 5, 1, 60521010, 'Electricité', 216, 0, '2016-10-23 16:05:34', NULL),
  (219, 6, 1, 661, 'RÉMUNÉRATIONS DIRECTES VERSÉES AU PERSONNEL NATIONAL', 53, 0, '2016-10-23 16:05:34', NULL),
  (341, 6, 1, 6611, 'Appointements salaires et commissions', 219, 0, '2018-03-14 14:07:01', NULL),
  (220, 5, 1, 66110011, 'Remunération Personnel', 219, 0, '2016-10-23 16:05:34', NULL),
  (221, 6, 1, 676, 'PERTES DE CHANGE', 54, 0, '2016-10-23 16:05:34', NULL),
  (222, 5, 1, 67611010, 'Différences de change', 221, 0, '2016-10-23 16:05:34', NULL),
  (240, 6, 1, 701, 'VENTES DE MARCHANDISES', 57, 0, '2016-10-23 16:05:34', NULL),
  (241, 6, 1, 7011, 'Vente des Médicaments dans la Region Ohada', 240, 0, '2016-10-23 16:05:34', NULL),
  (242, 4, 1, 70111010, 'Vente Médicaments en comprimes', 241, 0, '2016-10-23 16:05:34', NULL),
  (243, 4, 1, 70111011, 'Vente Médicaments en Sirop', 241, 0, '2016-10-23 16:05:34', NULL),
  (244, 6, 1, 706, 'SERVICES VENDUS', 57, 0, '2016-10-23 16:05:34', NULL),
  (245, 6, 1, 7061, 'Services vendus dans la Region ohada', 244, 0, '2016-10-23 16:05:34', NULL),
  (246, 4, 1, 70611010, 'Consultations', 245, 0, '2016-10-23 16:05:34', NULL),
  (247, 4, 1, 70611011, 'Optique', 245, 0, '2016-10-23 16:05:34', NULL),
  (248, 4, 1, 70611012, 'Hospitalisation', 245, 0, '2016-10-23 16:05:34', NULL),
  (249, 4, 1, 70611017, 'Administration', 245, 0, '2016-10-23 16:05:34', NULL),
  (250, 4, 1, 70611036, 'URGENCES', 245, 0, '2016-10-23 16:05:34', NULL),
  (251, 6, 1, 754, 'PRODUITS DES CESSIONS D IMMOBILISATIONS', 61, 0, '2016-10-23 16:05:34', NULL),
  (252, 4, 1, 75411010, 'Produits des Cessions d Immobilisations *', 251, 0, '2016-10-23 16:05:34', NULL),
  (253, 6, 1, 758, 'PRODUITS DIVERS', 61, 0, '2016-10-23 16:05:34', NULL),
  (254, 6, 1, 7581, 'Jetons de presence et autres remunerations d\'administrateurs', 253, 0, '2016-10-23 16:05:34', NULL),
  (255, 4, 1, 75811010, 'Jeton de presence', 254, 0, '2016-10-23 16:05:34', NULL),
  (256, 4, 1, 75811011, 'Autres remunerations d administrateurs', 254, 0, '2016-10-23 16:05:34', NULL),
  (257, 6, 1, 7582, 'Indemnites d\'assurances recues', 253, 0, '2016-10-23 16:05:34', NULL),
  (258, 4, 1, 75821010, 'Indemnites d\'assurances recues', 257, 0, '2016-10-23 16:05:34', NULL),
  (259, 6, 1, 7588, 'Autres Produits divers', 253, 0, '2016-10-23 16:05:34', NULL),
  (260, 4, 1, 75881010, 'Autres revenus', 259, 0,'2016-10-23 16:05:34', NULL),
  (261, 6, 1, 771, 'INTERETS DE PRETS', 62, 0, '2016-10-23 16:05:34', NULL),
  (262, 4, 1, 77111010, 'Interets de Prets *', 261, 0, '2016-10-23 16:05:34', NULL),
  (264, 6, 1, 773, 'ESCOMPTES OBTENUS', 62, 0, '2016-10-23 16:05:34', NULL),
  (265, 4, 1, 77311010, 'Escomptes obtenus *', 264, 0, '2016-10-23 16:05:34', NULL),
  (266, 6, 1, 776, 'GAINS DE CHANGE', 62, 0, '2016-10-23 16:05:34', NULL),
  (267, 4, 1, 77611010, 'Gain de change *', 266, 0,  '2016-10-23 16:05:34', NULL),
  (280, 5, 1, 81111010, 'Compte Immobilisations incorporelles', 65, 0, '2016-10-23 16:05:34', NULL),
  (281, 5, 1, 81211010, 'Compte Immobilisations corporelles', 65, 0, '2016-10-23 16:05:34', NULL),
  (282, 5, 1, 81611010, 'Compte Immobilisations financières', 65, 0, '2016-10-23 16:05:34', NULL),
  (283, 3, 1, 13110001, 'Résusltat de l\'exercise', 111, 0, '2017-06-09 12:29:04', NULL),
  (284, 1, 1, 40111000, 'SNEL SUPPLIER', 170, 0, '2016-10-23 16:05:34', NULL),
  (285, 1, 1, 40111001, 'REGIDESO SUPPLIER', 170, 0, '2016-10-23 16:05:34', NULL),
  (300, 1, 1, 40111002, 'SUPPLIER\'S ACCOUNT 1', 170, 0, '2017-11-06 15:07:21', NULL),
  (301, 1, 1, 40111003, 'SUPPLIER\'S ACCOUNT 2', 170, 0, '2017-11-06 15:07:21', NULL),
  (303, 6, 1, 431, 'SECURITE SOCIAL', 35, 0, '2018-03-14 11:57:04', NULL),
  (304, 6, 1, 4313, 'Caisse de retraite obligatoire', 303, 0, '2018-03-14 11:58:19', NULL),
  (305, 2, 1, 43130010, 'Cotisation INSS Employés', 304, 0, '2018-03-14 12:01:32', NULL),
  (306, 2, 1, 43130011, 'Cotisation INSS Employeur', 304, 0, '2018-03-14 12:08:57', NULL),
  (307, 6, 1, 433, 'AUTRES ORGANISMES SOCIAUX', 35, 0, '2018-03-14 12:13:06', NULL),
  (308, 6, 1, 4331, 'Mutuelle', 307, 0, '2018-03-14 12:13:45', NULL),
  (311, 2, 1, 43311011, 'INPP', 308, 0, '2018-03-14 12:15:19', NULL),
  (312, 6, 1, 441, 'ETAT ; IMPOTS SUR LE BENEFICES', 36, 0, '2018-03-14 12:59:42', NULL),
  (313, 6, 1, 442, 'ETAT ; AUTRES IMPOTS ET TAXE', 36, 0, '2018-03-14 13:00:18', NULL),
  (314, 6, 1, 443, 'ETAT ; TVA FACTUREE', 36, 0, '2018-03-14 13:00:40', NULL),
  (315, 6, 1, 445, 'TVA RECUPERABLE', 36, 0, '2018-03-14 13:02:33', NULL),
  (317, 6, 1, 447, 'ETAT ; IMPOTS RETENUES A LA SOURCE', 36, 0, '2018-03-14 13:03:51', NULL),
  (318, 6, 1, 4472, 'IMPOTS SUR SALAIRES', 317, 0, '2018-03-14 13:04:37', NULL),
  (319, 2, 1, 44720010, 'IPR', 317, 0, '2018-03-14 13:05:13', NULL),
  (320, 2, 1, 43311010, 'ONEM', 308, 0, '2018-03-14 13:08:07', NULL),
  (321, 6, 1, 423, 'PERSONNEL SAISIE ARRET', 34, 0, '2018-03-14 13:12:51', NULL),
  (322, 6, 1, 424, 'PERSONNEL OEUVRES SOCIALES', 34, 0, '2018-03-14 13:14:08', NULL),
  (323, 6, 1, 4241, 'ASSISTANCE MEDICALE', 322, 0, '2018-03-14 13:37:24', NULL),
  (324, 6, 1, 4242, 'ALLOCATIONS FAMILIALES', 322, 0, '2018-03-14 13:38:02', NULL),
  (325, 2, 1, 42421010, 'Allocations Familiales', 324, 0, '2018-03-14 13:38:40', NULL),
  (326, 6, 1, 4248, 'AUTRES OEUVRES SOCIALES INTERNES', 322, 0, '2018-03-14 13:39:45', NULL),
  (327, 2, 1, 42481010, 'Logement', 326, 0, '2018-03-14 13:40:17', NULL),
  (328, 6, 1, 425, 'REPRESENTANT DU PERSONNEL', 34, 0, '2018-03-14 13:46:26', NULL),
  (329, 6, 1, 428, 'PERSONNEL CHARGES A PAYER ET PRODUITS A RECEVOIR', 34, 0, '2018-03-14 13:47:56', NULL),
  (330, 6, 1, 4281, 'DETTES PROVISIONNEES POUR CONGE A PAYER', 329, 0, '2018-03-14 13:48:46', NULL),
  (331, 6, 1, 4286, 'AUTRES CHARGES A PAYER', 329, 0, '2018-03-14 13:49:46', NULL),
  (332, 2, 1, 42860010, 'Primes', 331, 0, '2018-03-14 13:52:25', NULL),
  (333, 2, 1, 42860011, 'Indemnité vie chère', 331, 0, '2018-03-14 13:53:43', NULL),
  (334, 2, 1, 42860012, 'Frais scolarité', 331, 0, '2018-03-14 13:54:31', NULL),
  (335, 6, 1, 421, 'PERSONNEL AVANCE ET ACOMPTES', 34, 0, '2018-03-14 13:56:28', NULL),
  (337, 6, 1, 4211, 'PERSONNELS AVANCES', 335, 0, '2018-03-14 13:57:58', NULL),
  (338, 2, 1, 42110010, 'Avances sur salaires', 337, 0, '2018-03-14 13:58:36', NULL),
  (339, 6, 1, 4212, 'PERSONNEL ACOMPTE', 335, 0, '2018-03-14 14:00:38', NULL),
  (340, 2, 1, 42120010, 'Acompte sur salaires', 339, 0, '2018-03-14 14:01:03', NULL),
  (342, 6, 1, 6612, 'Primes et gratifications', 219, 0, '2018-03-14 14:08:34', NULL),
  (343, 5, 1, 66121011, 'Primes', 342, 0, '2018-03-14 14:09:05', NULL),
  (344, 6, 1, 6613, 'Conges payes', 219, 0, '2018-03-14 14:31:17', NULL),
  (345, 5, 1, 66131010, 'Indemnité de congé', 344, 0, '2018-03-14 14:32:16', NULL),
  (346, 6, 1, 6616, 'Supplement familial', 219, 0, '2018-03-14 14:34:14', NULL),
  (347, 5, 1, 66161010, 'Allocations familiales légales', 346, 0, '2018-03-14 14:34:56', NULL),
  (348, 6, 1, 663, 'INDEMNITES FORFAITAIRES VERSEES AU PERSONNEL', 53, 0, '2018-03-14 14:38:36', NULL),
  (349, 6, 1, 6631, 'Indemnités de logement', 348, 0, '2018-03-14 14:39:34', NULL),
  (350, 5, 1, 66311010, 'Indemnités de logement', 349, 0, '2018-03-14 14:40:27', NULL),
  (351, 6, 1, 664, 'CHARGES SOCIALES', 53, 0, '2018-03-14 14:43:34', NULL),
  (352, 6, 1, 6641, 'Charges sociales sur remuneration du personnel', 351, 0, '2018-03-14 14:44:22', NULL),
  (353, 5, 1, 66411010, 'Cotisation INSS (QPP)', 352, 0, '2018-03-14 14:45:00', NULL),
  (354, 5, 1, 66411011, 'Cotisations INPP', 352, 0, '2018-03-14 14:45:36', NULL),
  (355, 5, 1, 66411012, 'Cotisation ONEM', 352, 0, '2018-03-14 14:45:55', NULL),
  (357, 6, 1, 6141, 'Transport du Personnel', 48, 0, '2018-03-14 14:58:55', NULL),
  (358, 5, 1, 61411010, 'Transport personnel', 357, 0, '2018-03-14 14:59:59', NULL),
  (359, 6, 1, 24110010, 'Véhicules de transport', 22, 0, '2022-08-08 07:59:00', NULL),
  (360, 6, 1, 24210010, 'Matériel informatique', 22, 0, '2022-08-08 07:59:01', NULL),
  (361, 5, 1, 60112010, "Achat d'actifs", 200, 0, '2022-08-07 16:05:34', NULL),
  (362, 4, 1, 70112010, "Vente d'actifs", 241, 0, '2022-08-07 16:05:35', NULL),
  (363, 4, 1, 71100010, 'Subvention Versées par l''Etat', 58, 0, '2024-12-10 06:31:19', NULL),
  (364, 4, 1, 71100011, 'Subvention Versées par les ONG Internationaux', 58, 0, '2024-12-10 06:32:13', NULL);


-- set one hidden account 52121010 - BCDC USD
UPDATE account set hidden = 1 WHERE id = 184;


-- attach gain/loss accounts to the enterprise
UPDATE enterprise SET `gain_account_id` = 267, `loss_account_id` = 134;

-- create test users
INSERT INTO user (id, username, password, display_name, email, deactivated, is_admin) VALUES
  (1, 'superuser', MYSQL5_PASSWORD('superuser'), 'Super User', 'SuperUser@test.org', 0, 1),
  (2, 'RegularUser', MYSQL5_PASSWORD('RegularUser'), 'Regular User', 'RegUser@test.org', 0, 0),
  (3, 'NoUserPermissions', MYSQL5_PASSWORD('NoUserPermissions'), 'No Permissrepertoireions', 'Invalid@test.org', 1, 0),
  (4, 'admin', MYSQL5_PASSWORD('1'), 'Admin User', 'admin@test.org', 1, 1);

SET @superUser = 1;

-- the super user has permission to everything user
INSERT INTO permission (unit_id, user_id)
SELECT unit.id, @superUser FROM unit ON DUPLICATE KEY UPDATE unit_id = unit_id, user_id = user_id;

-- Update permission for Regular user
INSERT INTO permission (unit_id, user_id) VALUES
-- Account Management
(6,2),

-- [Folder] Finance
(5,2),

-- Fiscal Year
(13,2);

-- Fiscal Year 2015
SET @fiscalYear2015 = 0;
CALL CreateFiscalYear(1, NULL, @superUser, 'Test Fiscal Year 2015', 12, DATE('2015-01-01'), DATE('2015-12-31'), 'Note for 2015', @fiscalYear2015);

-- Fiscal Year 2016
SET @fiscalYear2016 = 0;
CALL CreateFiscalYear(1, @fiscalYear2015, @superUser, 'Test Fiscal Year 2016', 12, DATE('2016-01-01'), DATE('2016-12-31'), 'Note for 2016', @fiscalYear2016);

-- Fiscal Year 2017
SET @fiscalYear2017 = 0;
CALL CreateFiscalYear(1, @fiscalYear2016, @superUser, 'Test Fiscal Year 2017', 12, DATE('2017-01-01'), DATE('2017-12-31'), 'Note for 2017', @fiscalYear2017);

SET @fiscalYear2018 = 0;
CALL CreateFiscalYear(1, @fiscalYear2017, @superUser, 'Fiscal Year 2018', 12, DATE('2018-01-01'), DATE('2018-12-31'), 'Notes for 2018', @fiscalYear2018);

SET @fiscalYear2019 = 0;
CALL CreateFiscalYear(1, @fiscalYear2018, @superUser, 'Fiscal Year 2019', 12, DATE('2019-01-01'), DATE('2019-12-31'), 'Notes for 2019', @fiscalYear2019);

SET @fiscalYear2020 = 0;
CALL CreateFiscalYear(1, @fiscalYear2019, @superUser, 'Fiscal Year 2020', 12, DATE('2020-01-01'), DATE('2020-12-31'), 'Notes for 2020', @fiscalYear2020);

SET @fiscalYear2021 = 0;
CALL CreateFiscalYear(1, @fiscalYear2020, @superUser, 'Fiscal Year 2021', 12, DATE('2021-01-01'), DATE('2021-12-31'), 'Notes for 2021', @fiscalYear2021);

SET @fiscalYear2022 = 0;
CALL CreateFiscalYear(1, @fiscalYear2021, @superUser, 'Fiscal Year 2022', 12, DATE('2022-01-01'), DATE('2022-12-31'), 'Notes for 2022', @fiscalYear2022);

SET @fiscalYear2023 = 0;
CALL CreateFiscalYear(1, @fiscalYear2022, @superUser, 'Fiscal Year 2023', 12, DATE('2023-01-01'), DATE('2023-12-31'), 'Notes for 2023', @fiscalYear2023);

SET @fiscalYear2024 = 0;
CALL CreateFiscalYear(1, @fiscalYear2024, @superUser, 'Fiscal Year 2024', 12, DATE('2024-01-01'), DATE('2024-12-31'), 'Notes for 2024', @fiscalYear2024);

-- give test permission to all projects
INSERT INTO `project_permission` VALUES (1, 1, 1),(2, 1, 2),(3, 2, 1),(4, 4, 1);

SET @USD = 1;
SET @FC = 2;
SET @EUR = 3;

-- exchange rate for the current date
INSERT INTO `exchange_rate` VALUES
  (1, 1, @USD, 900.0000, DATE('2016-01-01')),
  (2, 1, @USD, 930.0000, NOW()),
  (3, 1, @EUR, 0.8400, NOW());

INSERT INTO `cash_box` (id, label, project_id, is_auxiliary) VALUES
  (1, 'Caisse Principale', 1, 0),
  (2, 'Caisse Auxiliaire', 1, 1);

SET @CaissePrincipale = 1;
SET @CaisseAux = 2;

INSERT INTO `cash_box_account_currency` (id, currency_id, cash_box_id, account_id, transfer_account_id) VALUES
  (1, @USD, @CaissePrincipale, 190, 195),
  (2, @FC, @CaissePrincipale, 187, 198),
  (3, @FC, @CaisseAux, 191, 194),
  (4, @USD, @CaisseAux, 188, 197);

-- Set Cashbox Management By User
INSERT INTO cashbox_permission (user_id, cashbox_id) VALUES
  (@superUser, 1),
  (@superUser, 2),
  (2, 1);

-- instead of repeating inventory here, pick it up from our data/inventories.sql file
SOURCE test/data/inventories.sql;

INSERT INTO `debtor_group` VALUES
  (1, HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 'Church Employees', 174, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), NULL, NULL, NULL, 0, 10, 0, NULL, 1, 1, 1, '#ff0000', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, HUID('66f03607-bfbc-4b23-aa92-9321ca0ff586'), 'NGO IMA World Health', 175, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), NULL, NULL, NULL, 0, 300, 1, NULL, 1, 1, 1, '#00ff00', 0, 0,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, HUID('a11e6b7f-fbbb-432e-ac2a-5312a66dccf4'), 'Cash Paying Clients', 176, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), NULL, NULL, NULL, 0, 20, 1, NULL, 1, 1, 1, '#0000ff', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO `patient_group` VALUES
  (HUID('0b8fcc00-8640-479d-872a-31d36361fcfd'), 1, NULL, 'Test Patient Group 1', 'Test Patient Group 1 Note', '2016-03-10 08:44:23'),
  (HUID('112a9fb5-847d-4c6a-9b20-710fa8b4da24'), 1, NULL, 'Test Patient Group 2', 'Test Patient Group 2 Note', '2016-03-10 08:44:23'),
  (HUID('112a9fb5-847d-4c6a-9b20-710fa8b4da22'), 1, NULL, 'Test Patient Group 3', 'Test Patient Group 2 Note', '2016-03-12 08:44:23');

INSERT INTO `debtor` (uuid, group_uuid, text) VALUES
  (HUID('3be232f9-a4b9-4af6-984c-5d3f87d5c107'), HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 'Patient/2/Patient'),
  (HUID('a11e6b7f-fbbb-432e-ac2a-5312a66dccf4'), HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 'Patient/1/Patient'),
  (HUID('76976710-27eb-46dd-b3f5-cb5eb4abbc92'), HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 'Debiteur [Employee Test 1]'),
  (HUID('dfbe4cd4-40fd-401f-bc7b-d4325119cb72'), HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 'Bad Patient Doublon');

-- Patients
INSERT INTO `patient` VALUES
  (HUID('274c51ae-efcc-4238-98c6-f402bfb39866'), 1, 2, HUID('3be232f9-a4b9-4af6-984c-5d3f87d5c107'), 'Test 2 Patient', '1990-06-01 00:00:00', FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M', NULL, NULL, NULL, NULL, NULL, NULL, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), (NOW() - INTERVAL 1 HOUR), NULL, NULL, '110', '', 1, '2015-11-14 07:04:49', NULL, NULL),
  (HUID('81af634f-321a-40de-bc6f-ceb1167a9f65'), 1, 1, HUID('a11e6b7f-fbbb-432e-ac2a-5312a66dccf4'), 'Test 1 Patient', '1990-06-01 00:00:00', FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', NULL, NULL, NULL, NULL, NULL, NULL, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), NOW(), NULL, NULL, '100', '', 2, '2015-11-14 07:04:49', NULL, NULL),
  (HUID('d1d7f856-d414-4400-8b94-8ba9445a2bc0'), 1, 4, HUID('76976710-27eb-46dd-b3f5-cb5eb4abbc92'), 'Employee Test 1', '1960-06-30', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', NULL, NULL, NULL, NULL, NULL, NULL, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), '2018-04-09 13:56:19', NULL, NULL, 'SOF-14', NULL, 1, '2018-04-09 13:56:19', NULL, NULL),
  (HUID('0f2ddc0e-686b-47c0-ad80-989671aa9f1f'), 1, 5, HUID('dfbe4cd4-40fd-401f-bc7b-d4325119cb72'), 'Bad Patient Doublon', '2017-08-24 00:00:00', FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M', NULL, NULL, NULL, NULL, NULL, NULL, HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), HUID('1f162a10-9f67-4788-9eff-c1fea42fcc9b'), (NOW() - INTERVAL 1 HOUR), NULL, NULL, '1110', '', 1, '2015-11-14 07:04:49', NULL, NULL);

-- Patient Visits
INSERT INTO `patient_visit` (`uuid`, `patient_uuid`, `start_date`, `end_date`, `start_notes`, `end_notes`, `start_diagnosis_id`, `end_diagnosis_id`, `user_id`, `last_service_uuid`) VALUES
  (HUID('5d3f87d5c107-a4b9-4af6-984c-3be232f9'), HUID('274c51ae-efcc-4238-98c6-f402bfb39866'), '2016-04-25 00:00:00', '2016-04-29 00:00:00', 'He was sick', 'He got better', NULL, NULL, 1, @testService),
  (HUID('710fa8b4da22-847d-4c6a-9b20-112a9fb5'), HUID('81af634f-321a-40de-bc6f-ceb1167a9f65'), '2015-11-14 14:25:00', '2015-11-15 00:00:00', 'He was sick', 'He got better', NULL, NULL, 1, @testService);

INSERT INTO `patient_assignment` VALUES
  (HUID('49b90fec-e69c-11e5-8606-843a4bc830ac'),HUID('112a9fb5-847d-4c6a-9b20-710fa8b4da24'),HUID('81af634f-321a-40de-bc6f-ceb1167a9f65')),
  (HUID('e35b525e-923b-4fee-87f1-a069c7dc7234'),HUID('112a9fb5-847d-4c6a-9b20-710fa8b4da24'),HUID('274c51ae-efcc-4238-98c6-f402bfb39866'));

-- Creditor Groups
INSERT INTO `creditor_group` VALUES
  (1, HUID('8bedb6df-6b08-4dcf-97f7-0cfbb07cf9e2'), 'SNEL', 171, 0),
  (1, HUID('b0fa5ed2-04f9-4cb3-92f7-61d6404696e7'), 'Employees', 179, 0),
  (1, HUID('c0fa5ed2-04f9-4cb3-93f7-61d6404696e7'), 'Regideso', 172, 0);

-- Creditors
INSERT INTO `creditor` VALUES
  (HUID('42d3756a-7770-4bb8-a899-7953cd859892'), HUID('b0fa5ed2-04f9-4cb3-92f7-61d6404696e7'), 'Crediteur[Test 2 Patient]'),
  (HUID('7ac4e83c-65f2-45a1-8357-8b025003d794'), HUID('8bedb6df-6b08-4dcf-97f7-0cfbb07cf9e2'), 'SNEL'),
  (HUID('18dcada5-f149-4eea-8267-19c346c2744f'), HUID('b0fa5ed2-04f9-4cb3-92f7-61d6404696e7'), 'Crediteur[Employee Test 1]');

-- Supplier
INSERT INTO `supplier` (uuid, creditor_uuid, display_name, address_1, address_2, email) VALUES
  (HUID('3ac4e83c-65f2-45a1-8357-8b025003d793'), HUID('7ac4e83c-65f2-45a1-8357-8b025003d794'), 'SNEL', '12th Avenue', 'New York City, NY 34305', 'supplier@test.org');

-- Grade
INSERT INTO `grade` VALUES
  (HUID('71e9f21c-d9b1-11e5-8ab7-78eb2f2a46e0'), 'G1', 'grade 1', 500.0000),
  (HUID('61e9f21c-d9b1-11e4-8ab6-78eb2f2a46e0'), 'test', 'grade 3', 650.0000),
  (HUID('9ee06e4a-7b59-48e6-812c-c0f8a00cf7d3'), 'A1', '1.1', 50.0000);

-- title_employee
INSERT INTO `title_employee` (`id`, `title_txt`) VALUES
  (1, 'Medical biologist'),
  (2, 'Nurse'),
  (3, 'Laboratory assistant');

INSERT INTO `staffing_grade_indice` (`uuid`, `value`, `grade_uuid`) VALUES
 (HUID(UUID()), 125.0000, HUID('61e9f21c-d9b1-11e4-8ab6-78eb2f2a46e0')),
(HUID(UUID()), 60.0000, HUID('71e9f21c-d9b1-11e5-8ab7-78eb2f2a46e0')),
(HUID('71e9f21c-d9b1-11e5-8ab7-78eb2f2a46e0'), 10.0000, HUID('9ee06e4a-7b59-48e6-812c-c0f8a00cf7d3'));


-- Offday
INSERT INTO `offday` VALUES
  (1, 'Martyre', '2017-01-04', 100),
  (2, 'Independance', '2017-06-30', 50.0000);

INSERT INTO `section_bilan` VALUES (1, 'Section Bilan 1', 1, 1), (2, 'Section Bilan 2', 1, 1);
INSERT INTO `section_resultat` VALUES (1, 'Section Resultat 1', 1, 1);
INSERT INTO `reference_group` VALUES (1, 'AA', 'Reference Group 1', 1, 1);

INSERT INTO `reference` VALUES
  (1, 0, 'AB', 'Reference bilan 1', 1, 1, NULL),
  (3, 0, 'AC', 'Reference resultat 1', 1, NULL, 1),
  (4, 0, 'XX', 'Deletable reference 1', 1, NULL, NULL);

INSERT INTO `employee` (`uuid`, `code`, `hiring_date`, `grade_uuid`, `nb_spouse`, `nb_enfant`, `individual_salary`, `bank`, `bank_account`, `fonction_id`, `service_uuid`, `creditor_uuid`, `locked`, `patient_uuid`) VALUES
  (HUID('75e09694-65f2-45a1-a8a2-8b025003d793'),'E1','2016-02-02 00:00:00',HUID('71e9f21c-d9b1-11e5-8ab7-78eb2f2a46e0'),1,3,500,'TMB','1201-3456-5423-03', 1, @medicineInterneService, HUID('42d3756a-7770-4bb8-a899-7953cd859892'), 0, HUID('274c51ae-efcc-4238-98c6-f402bfb39866')),
  (HUID('75e69409-562f-a2a8-45a1-3d7938b02500'), 'WWEFCB', '2016-01-01 01:00:00', HUID('9ee06e4a7b5948e6812cc0f8a00cf7d3'), 0, 0, 0, 'BCOL', '00-99-88-77', 1, @testService, HUID('18dcada5-f149-4eea-8267-19c346c2744f'), 0, HUID('d1d7f856-d414-4400-8b94-8ba9445a2bc0'));

-- invoicing fee configuration

-- both these are "autres revenues"
SET @AutresRevenuesAccount = 260;

INSERT INTO `invoicing_fee` VALUES
  (1, @AutresRevenuesAccount, 'Test Invoicing Fee', 'Example Invoicing Fee', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, @AutresRevenuesAccount, 'Second Test Invoicing Fee', 'Example Invoicing Fee 2', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO `patient_group_invoicing_fee` VALUES
  (1, HUID('112a9fb5-847d-4c6a-9b20-710fa8b4da24'), 1, CURRENT_TIMESTAMP);

INSERT INTO `debtor_group_invoicing_fee` VALUES
  (1, HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 2, CURRENT_TIMESTAMP);

-- subsidy configuration
-- both these are "Remuneration Personnel"
SET @RemunerationPersonnelAccount = 220;
INSERT INTO `subsidy` VALUES
  (1, @RemunerationPersonnelAccount, 'Test Subsidy', 'Subsidy for test purposes', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, @RemunerationPersonnelAccount, 'Second Test Subsidy', 'Second subsidy for test purposes', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO `patient_group_subsidy` VALUES
  (1, HUID('112a9fb5-847d-4c6a-9b20-710fa8b4da24'), 1, CURRENT_TIMESTAMP);

INSERT INTO `debtor_group_subsidy` VALUES
  (1, HUID('4de0fe47-177f-4d30-b95f-cff8166400b4'), 1, CURRENT_TIMESTAMP);

-- patient invoices
SET @first_invoice = HUID('957e4e79-a6bb-4b4d-a8f7-c42152b2c2f6');
SET @second_invoice = HUID('c44619e0-3a88-4754-a750-a414fc9567bf');
SET @third_invoice = HUID('f24619e0-3a88-4784-a750-a414fc9567bf');
SET @fourth_invoice = HUID('8460def8-b1b1-11e8-92f9-c3fddff20f76');

INSERT INTO invoice (project_id, uuid, cost, debtor_uuid, service_uuid, user_id, date, description, created_at) VALUES
  (1, @first_invoice, 75.0000, HUID('3be232f9-a4b9-4af6-984c-5d3f87d5c107'), @testService, 1, NOW(), 'TPA_VENTE/ TODAY GMT+0100 (WAT)/Test 2 Patient', NOW()),
  (1, @second_invoice, 25.0000, HUID('3be232f9-a4b9-4af6-984c-5d3f87d5c107'),@testService, 1, '2016-01-07 14:34:35', 'TPA_VENTE/Thu Jan 07 2016 15:30:59 GMT+0100 (WAT)/Test 2 Patient', '2016-01-07 14:31:14'),
  (1, @third_invoice, 5.1300, HUID('3be232f9-a4b9-4af6-984c-5d3f87d5c107'), @testService,  1, '2016-01-02 09:34:35', 'TPA_VENTE/Thu Jan 02 2016 09:30:59 GMT+0100 (WAT)/Test 2 Patient', '2016-01-02 09:31:14'),
  (1, @fourth_invoice, 10, HUID('3be232f9-a4b9-4af6-984c-5d3f87d5c107'), @medicineInterneService, 1, '2016-01-02 11:54:00', 'Facture a Test Patient 2 pour 10$', '2016-01-02 11:54:00');

-- inventory items to use in invoice
SET @quinine = HUID('43f3decb-fce9-426e-940a-bc2150e62186');
SET @paracetemol = HUID('6b4825f1-4e6e-4799-8a81-860531281437');
SET @multivitamine = HUID('f6556e72-9d05-4799-8cbd-0a03b1810185');
SET @prednisone = HUID('c3fd5a02-6a75-49fc-b2f3-76ee4c3fbfb7');

INSERT INTO invoice_item VALUES
  (@first_invoice, HUID('507e3594-b1b2-11e8-b9e8-d7a78252f137'), @quinine, 3,25.0000,25.0000,0.0000,75.0000),
  (@second_invoice, HUID('587008d6-b1b2-11e8-8cc6-df2e118fe467'), @paracetemol,1,25.0000,25.0000,0.0000,25.0000),
  (@third_invoice, HUID('593f800c-b1b2-11e8-88dd-c7c4fcb9ed4d'), @multivitamine,1,5.13,5.13,0.0000,5.130000),
  (@fourth_invoice, HUID('54f8d3e0-b1b2-11e8-b839-4b42ae00050a'), @multivitamine,10,1,1,0.0000,10);

CALL PostInvoice(@first_invoice);
CALL PostInvoice(@second_invoice);
CALL PostInvoice(@third_invoice);
CALL PostInvoice(@fourth_invoice);

-- cash payment
SET @cash_payment = HUID('2e1332b7-3e63-411e-827d-42ad585ff517');
SET @cash_payment_2 = HUID('25b69e1d-c9bc-46f2-98a5-5dd948de3636');

INSERT INTO cash (uuid, project_id, reference, date, created_at, debtor_uuid, currency_id, amount, user_id, cashbox_id, description, is_caution) VALUES
  (@cash_payment, 1, 1, (NOW() - INTERVAL 1 HOUR), (NOW() - INTERVAL 1 HOUR), HUID('3be232f9-a4b9-4af6-984c-5d3f87d5c107'), 1, 100, 1, 2, "Some cool description", 0),
  (@cash_payment_2, 1, 2, '2016-01-10 15:33:00', '2016-01-10 15:33:00', HUID('3be232f9-a4b9-4af6-984c-5d3f87d5c107'), 1, 25, 1, 2, "This will be deleted in tests", 1);

INSERT INTO cash_item (uuid, cash_uuid, amount, invoice_uuid) VALUES
  (HUID('f21ba860-a4f1-11e7-b598-507b9dd6de91'), @cash_payment, 100, @first_invoice);

CALL PostCash(@cash_payment);
CALL PostCash(@cash_payment_2);

-- voucher sample data
SET @first_voucher = HUID('a5a5f950-a4c9-47f0-9a9a-2bfc3123e534');
SET @second_voucher = HUID('304cfa94-0249-466c-9870-95eb3c221b0a');
SET @third_voucher = HUID('3688e9ce-85ea-4b5c-9144-688177edcb63');
SET @fourth_voucher = HUID('19b4d28c-cbb3-11e8-bf7e-7f323238856c');

SET @sixth_voucher = HUID('4B90FE0C05544D49A8A5B45CCEDA53C8');
SET @seventh_voucher = HUID('1FAFE14CFA874220AC1F73F6A136AB46');
SET @eighth_voucher = HUID('1C8FCF924EA441B9AEF6BFE1E2077154');
SET @nineth_voucher = HUID('002D36301642421080EDE136F1535A4E');
SET @tenth_voucher = HUID('036EC673A579467790A260AB896242E9');
SET @eleventh_voucher = HUID('E7FFBED7304040A89160A22CFBC6477C');
SET @twelfth_voucher = HUID('95F64A9656834CE38BD11DBD33A262D6');
SET @thirteenth_voucher = HUID('66C2F642332B4826B0C249458570ABB5');

SET @fourteenth_voucher = HUID('A8A6385F51F0490EAAB2399A513BF66D');
SET @fifteenth_voucher = HUID('C3B6C18D995A4F7199B4C6D8DE06BEFA');
SET @sixteenth_voucher = HUID('B77B0803E67848ABBF4764F0F41D8AAF');


INSERT INTO `voucher` (uuid, `date`, project_id, currency_id, amount, description, user_id, type_id) VALUES
  (@first_voucher, CURRENT_TIMESTAMP, 1, 2, 100, 'Sample voucher data one', 1, 1),
  (@second_voucher, CURRENT_TIMESTAMP, 2, 2, 200, 'Sample voucher data two', 1, 9),
  (@third_voucher, CURRENT_TIMESTAMP, 3, 1, 300, 'Sample voucher data three', 1, 9),
  (@fourth_voucher, CURRENT_TIMESTAMP, 1, 1, 75, 'Fourth Voucher to be Posted', 1, 9);

INSERT INTO `voucher` (uuid, date, project_id, currency_id, amount, description, user_id, type_id) VALUES
  (@thirteenth_voucher, CURRENT_TIMESTAMP, 1, 2, 67500.0000, 'Commitment', 1, 15),
  (@twelfth_voucher, CURRENT_TIMESTAMP, 1, 2, 85000.0000, 'Purchases', 1, 9),
  (@eleventh_voucher, CURRENT_TIMESTAMP, 1, 2, 26000.0000, 'Money Transfer', 1, 5),
  (@tenth_voucher, CURRENT_TIMESTAMP, 1, 2, 26000.0000, 'Transfer of the funds Auxiliary Cashbox', 1, 20),
  (@nineth_voucher, CURRENT_TIMESTAMP, 1, 2, 33000.0000, 'Other Income', 1, 1),
  (@eighth_voucher, CURRENT_TIMESTAMP, 1, 2, 15000.0000, 'Other Income', 1, 1),
  (@seventh_voucher, CURRENT_TIMESTAMP, 1, 2, 11000.0000, 'Client Payment', 1, 2),
  (@sixth_voucher, CURRENT_TIMESTAMP, 1, 2, 25000.0000, 'Client Payment', 1, 2);

INSERT INTO `voucher` (`uuid`, `date`, `project_id`, `currency_id`, `amount`, `description`, `user_id`, `type_id`) VALUES
  (@fourteenth_voucher, '2024-12-11 06:09:45', 1, 2, 62000.0000, 'Other Income', 1, 1),
  (@fifteenth_voucher, '2024-12-11 06:07:43', 1, 2, 24300.0000, 'Other Income', 1, 1),
  (@sixteenth_voucher, '2024-12-11 06:05:29', 1, 2, 28650.0000, 'Client paiement', 1, 2);

-- voucher items sample data
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES
  (HUID('90583c32-b1b2-11e8-9689-0b54421d0e49'), 187, 100, 0, @first_voucher, @first_invoice, HUID('2c6c48a2-b1b3-11e8-ae9b-1fa4024347ab')),
  (HUID('9317a11a-b1b2-11e8-93d6-b30828591803'), 182, 0, 100, @first_voucher, NULL, NULL),
  (HUID('941ae478-b1b2-11e8-9492-6385e74c37a0'), 188, 200, 0, @second_voucher, NULL, NULL),
  (HUID('953defee-b1b2-11e8-ac16-3b802412d42d'), 242, 0, 200, @second_voucher, NULL, NULL),
  (HUID('97ad9a22-b1b2-11e8-acba-6b85fd27d57d'), 213, 300, 0, @third_voucher, @cash_payment, HUID('2f0b966c-b1b3-11e8-8dd2-1715a827ad9b')),
  (HUID('8ba0571a-b1b2-11e8-8688-fb9547361273'), 163, 0, 300, @third_voucher, NULL, NULL),
  (HUID('1033b476-cbbd-11e8-957e-ebcbf45a948a'), 242, 75, 0, @fourth_voucher, NULL, NULL),
  (HUID('1955afa0-cbbd-11e8-84bd-03f165897e6a'), 188, 0, 75, @fourth_voucher, NULL, NULL);


INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x0257F0D8C61544C38DA190937B2CD803, 191, 11000.0000, 0.0000, @seventh_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x0854A92678684F7A999F8FCD3D270B71, 361, 2000.0000, 0.0000, @twelfth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x345A51C6711A4F1EBBF6E95AE26892B4, 220, 35500.0000, 0.0000, @thirteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x3A753DA1C8D643B889CA32D41A316CF7, 179, 0.0000, 67500.0000, @thirteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x3AF97481C96A4435B71222F676FA3522, 207, 11500.0000, 0.0000, @twelfth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x4FBA6CB6C60543B59CFDAB901C576BE4, 202, 22000.0000, 0.0000, @twelfth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x5785DDD7999F4F75947FB6B8A63F1386, 190, 0.0000, 85000.0000, @twelfth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x5B2BDB5B6D994748885379DBC69F1124, 194, 0.0000, 26000.0000, @eleventh_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x5FB9E38D20F04077863F78149C432067, 191, 0.0000, 26000.0000, @tenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x67C3D778258C409F9406898DB61E92BC, 191, 25000.0000, 0.0000, @sixth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x6A39C70AC6C6497EB90CA06EBEBD9796, 194, 26000.0000, 0.0000, @tenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x7B79C2103A80424F9720FBC45F2B0DD2, 190, 33000.0000, 0.0000, @nineth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x825ED79954D84C68A0F922D003FFE7BD, 190, 15000.0000, 0.0000, @eighth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x935BA182FC324A389DC5AC6E451F1C2A, 345, 32000.0000, 0.0000, @thirteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0xA8114A4A90514FFDAAA7C2385AC399E6, 205, 9000.0000, 0.0000, @twelfth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0xA8984522228C4B5C86733B2114410D0D, 364, 0.0000, 33000.0000, @nineth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0xAF47D8484A7D4E06A2D0FAA38F746278, 363, 0.0000, 15000.0000, @eighth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0xC2CEE6853C20488F9E58C53097938EB2, 190, 26000.0000, 0.0000, @eleventh_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0xD556A10FCB48434BB090D31A9B74BB4C, 242, 0.0000, 25000.0000, @sixth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0xD697EC0AD14D41CBBAE308967B27AC9F, 206, 2500.0000, 0.0000, @twelfth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0xF9F24AEE65364AF2AB1C54765725619B, 201, 38000.0000, 0.0000, @twelfth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0xF9FE56328149483EB28B44B85E3EAAF2, 243, 0.0000, 11000.0000, @seventh_voucher, NULL, NULL);

INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x17E0DD3F371A4661B1BB58FA9E0013D8, 190, 62000.0000, 0.0000, @fourteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0xAB32A52A55B74A47BB403AA4C0A4A81A, 262, 0.0000, 62000.0000, @fourteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x07DA12E72D6543B8953F87BBA9844C78, 248, 0.0000, 1150.0000, @sixteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x0FFDD979DFED4D0A91319B68190B3B17, 190, 28650.0000, 0.0000, @sixteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x6A74D30BD7B74CD1A2C9957325070245, 247, 0.0000, 11500.0000, @sixteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x97D409FC4C10440A9D6B3A9FD125CA63, 246, 0.0000, 16000.0000, @sixteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x3733C043FDEC470A97E09C79D5924127, 258, 0.0000, 4800.0000, @fifteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x5BEEF7EDA3F94D9BB4CAF2E8AEC53573, 256, 0.0000, 1500.0000, @fifteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0x988EE14FA4BA4C8CADDB0D5B98A8F139, 260, 0.0000, 18000.0000, @fifteenth_voucher, NULL, NULL);
INSERT INTO `voucher_item` (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (0xBCFBD9D9AEED47E199D830712D286093, 190, 24300.0000, 0.0000, @fifteenth_voucher, NULL, NULL);


-- post voucher data to the general ledger
CALL PostVoucher(@first_voucher);
CALL PostVoucher(@second_voucher);
CALL PostVoucher(@third_voucher);
CALL PostVoucher(@fourth_voucher);

CALL PostVoucher(@sixth_voucher);
CALL PostVoucher(@seventh_voucher);
CALL PostVoucher(@eighth_voucher);
CALL PostVoucher(@nineth_voucher);
CALL PostVoucher(@tenth_voucher);
CALL PostVoucher(@eleventh_voucher);
CALL PostVoucher(@twelfth_voucher);
CALL PostVoucher(@thirteenth_voucher);

CALL PostVoucher(@fourteenth_voucher);
CALL PostVoucher(@fifteenth_voucher);
CALL PostVoucher(@sixteenth_voucher);

INSERT INTO `price_list` VALUES
  (HUID('75e09694-dd5c-11e5-a8a2-6c29955775b0'), 1, 'Test Price List', 'Price list for test purposes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO `price_list_item` VALUES
  (HUID('e65b881e-b1b2-11e8-96c6-f730ee8acf0e'), @quinine, HUID('75e09694-dd5c-11e5-a8a2-6c29955775b0'), 'label 1', 100, 1, CURRENT_TIMESTAMP),
  (HUID('e763764a-b1b2-11e8-bc50-ffc5618e09c7'), @prednisone, HUID('75e09694-dd5c-11e5-a8a2-6c29955775b0'), 'label 2', 100, 1, CURRENT_TIMESTAMP);

UPDATE debtor_group SET price_list_uuid = HUID('75e09694-dd5c-11e5-a8a2-6c29955775b0') WHERE uuid = HUID('4de0fe47-177f-4d30-b95f-cff8166400b4');

SET @purchase_order = HUID('e07ceadc-82cf-4ae2-958a-6f6a78c87588');
INSERT INTO `purchase`
  (uuid, project_id, reference, cost, currency_id, supplier_uuid, date, user_id, payment_method, status_id) VALUES
  (@purchase_order, 1, 1, 300, 2, HUID('3ac4e83c-65f2-45a1-8357-8b025003d793'), DATE_ADD(CURRENT_DATE, INTERVAL -1725 DAY), 1, NULL, 1);

INSERT INTO `purchase_item` VALUES
  (HUID('fca58822-b1b2-11e8-9103-7782f63484ff'), @purchase_order, @quinine, 1, 200, 200, 1),
  (HUID('fd505f72-b1b2-11e8-bc07-eb08d6c952b1'), @purchase_order, @prednisone, 10, 10, 100, 1);

-- confirmed purchase order
SET @purchase = HUID('8027d1c8-dd68-4686-9f4c-8860f856f8ba');
INSERT INTO `purchase` (uuid, project_id, reference, cost, currency_id, supplier_uuid, date, user_id, payment_method, note, status_id) VALUES
  (@purchase, 1, 2, (1000 * 0.05), 2, HUID('3ac4e83c-65f2-45a1-8357-8b025003d793'), DATE_ADD(CURRENT_DATE, INTERVAL -1321 DAY), 1, NULL, 'Purchase Order Confirmed', 2);

INSERT INTO `purchase_item` VALUES
  (HUID('1fcc1316-b1b3-11e8-b276-bfdbdae020fb'), @purchase, @prednisone, 1000, 0.05, (1000 * 0.05), 1);


-- default depots
SET @depot_uuid = HUID('f9caeb16-1684-43c5-a6c4-47dbac1df296');
SET @second_depot_uuid = HUID('d4bb1452-e4fa-4742-a281-814140246877');
SET @third_deposit_uuid = HUID('bd4b1452-4742-e4fa-a128-246814140877');

INSERT INTO `depot` VALUES
  (@depot_uuid, 'Depot Principal', NULL, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, NULL, 2, NULL, NULL, 0, 0),
  (@second_depot_uuid, 'Depot Secondaire', NULL, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, NULL, 3, NULL, NULL, 0, 0),
  (@third_deposit_uuid, 'Depot Tertiaire', NULL, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, NULL, 3, NULL, NULL, 0, 0);


-- Set Depot Management By User
INSERT INTO depot_permission (user_id, depot_uuid) VALUES
  (@superUser, @depot_uuid),
  (@superUser, @second_depot_uuid),
  (@superUser, @third_deposit_uuid);

-- TODO : As soon as the stored Procedure for Stock accounting landed, stock movement records should be posted also
SET @quinine = HUID('43f3decb-fce9-426e-940a-bc2150e62186');
SET @paracetemol = HUID('6b4825f1-4e6e-4799-8a81-860531281437');
SET @multivitamine = HUID('f6556e72-9d05-4799-8cbd-0a03b1810185');
SET @erythromycine = HUID('3cf8d982-eef9-11ea-8801-00155d871701');

-- stock lots
INSERT INTO `lot` (`uuid`, `label`, `quantity`, `unit_cost`, `expiration_date`, `inventory_uuid`) VALUES
  (HUID('064ab1d9-5246-4402-ae8a-958fcdb07b35'), 'VITAMINE-A', 100, 1.2000, DATE_ADD(CURRENT_DATE, INTERVAL 2 YEAR), @multivitamine),
  (HUID('5a0e06c2-6ca7-4633-8b17-92e2a59db44c'), 'VITAMINE-B', 20, 0.5000, DATE_ADD(CURRENT_DATE, INTERVAL 2 YEAR), @multivitamine),
  (HUID('6f80748b-1d94-4247-804e-d4be99e827d2'), 'QUININE-B', 200, 0.8000, DATE_ADD(CURRENT_DATE, INTERVAL 1 MONTH),  @quinine),
  (HUID('ae735e99-8faf-417b-aa63-9b404fca99ac'), 'QUININE-A', 100, 1.2000, '2017-04-30', @quinine),
  (HUID('ef24cf1a-d5b9-4846-b70c-520e601c1ea6'), 'QUININE-C', 50, 2.0000, DATE_ADD(CURRENT_DATE, INTERVAL 2 YEAR), @quinine),
  (HUID('aca917fe-5320-4c3c-bea6-590e48cfa26b'), 'ERYTHRO-A', 0,  3.1800, DATE_ADD(CURRENT_DATE, INTERVAL 3 MONTH), @erythromycine);

-- stock settings (go with defaults)
INSERT INTO `stock_setting` (`enterprise_id`, `enable_auto_stock_accounting`, `month_average_consumption`, `average_consumption_algo`, `default_purchase_interval`) VALUES (1, 0, 6, 'algo_msh', 0);

-- stock lots movements
INSERT INTO `stock_movement` (`uuid`, `lot_uuid`, `document_uuid`, `depot_uuid`, `entity_uuid`, `flux_id`, `date`, `created_at`, `quantity`, `unit_cost`, `is_exit`, `period_id`, `user_id`) VALUES
  (HUID('5b7dd0d6-9273-4955-a703-126fbd504b61'), HUID('ae735e99-8faf-417b-aa63-9b404fca99ac'), HUID('682e11c0-93a7-49f8-b79b-a4bc8e3e6f47'), HUID('f9caeb16-1684-43c5-a6c4-47dbac1df296'), '', 1, DATE_ADD(NOW(), INTERVAL -1376 DAY), DATE_ADD(NOW(), INTERVAL -1376 DAY), 100, 1.2000, 0, DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -1376 DAY), '%Y%m'), 1),
  (HUID('6529ba0c-aef4-4527-b572-5ae77273de62'), HUID('6f80748b-1d94-4247-804e-d4be99e827d2'), HUID('682e11c0-93a7-49f8-b79b-a4bc8e3e6f47'), HUID('f9caeb16-1684-43c5-a6c4-47dbac1df296'), '', 1, DATE_ADD(NOW(), INTERVAL -1376 DAY), DATE_ADD(NOW(), INTERVAL -1376 DAY), 200, 0.8000, 0, DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -1376 DAY), '%Y%m'), 1),
  (HUID('a4ff7358-f1f8-4301-86e4-e9e6fe99bd31'), HUID('5a0e06c2-6ca7-4633-8b17-92e2a59db44c'), HUID('682e11c0-93a7-49f8-b79b-a4bc8e3e6f47'), HUID('f9caeb16-1684-43c5-a6c4-47dbac1df296'), '', 1, DATE_ADD(NOW(), INTERVAL -1376 DAY), DATE_ADD(NOW(), INTERVAL -1376 DAY), 20, 0.5000, 0, DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -1376 DAY), '%Y%m'), 1),
  (HUID('d8c83ad9-a3ea-4f9f-96f9-456a435f480d'), HUID('ef24cf1a-d5b9-4846-b70c-520e601c1ea6'), HUID('682e11c0-93a7-49f8-b79b-a4bc8e3e6f47'), HUID('f9caeb16-1684-43c5-a6c4-47dbac1df296'), '', 1, DATE_ADD(NOW(), INTERVAL -1376 DAY), DATE_ADD(NOW(), INTERVAL -1376 DAY), 50, 2.0000, 0, DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -1376 DAY), '%Y%m'), 1),
  (HUID('f9aa33f1-65e2-4e37-89cb-843d27b2c586'), HUID('064ab1d9-5246-4402-ae8a-958fcdb07b35'), HUID('682e11c0-93a7-49f8-b79b-a4bc8e3e6f47'), HUID('f9caeb16-1684-43c5-a6c4-47dbac1df296'), '', 1, DATE_ADD(NOW(), INTERVAL -1376 DAY), DATE_ADD(NOW(), INTERVAL -1376 DAY), 100, 1.2000, 0, DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -1376 DAY), '%Y%m'), 1),
  (HUID('e8502c3e-7483-11e7-a8de-507b9dd6de91'), HUID('064ab1d9-5246-4402-ae8a-958fcdb07b35'), HUID('0cc6c435-7484-11e7-a8de-507b9dd6de91'), HUID('f9caeb16-1684-43c5-a6c4-47dbac1df296'), HUID('d4bb1452-e4fa-4742-a281-814140246877'), 8, DATE_ADD(NOW(), INTERVAL -1375 DAY), DATE_ADD(NOW(), INTERVAL -1375 DAY), 75, 1.2000, 1, DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -1375 DAY), '%Y%m'), 1),
  (HUID('5c0e5c53-8437-4694-85af-4b3f2135243c'), HUID('aca917fe-5320-4c3c-bea6-590e48cfa26b'), HUID('76d46d03-030f-49ec-80d9-c863aae1a407'), HUID('f9caeb16-1684-43c5-a6c4-47dbac1df296'), '', 1, DATE_ADD(NOW(), INTERVAL -66 DAY), DATE_ADD(NOW(), INTERVAL -66 DAY), 10, 3.1800, 0, DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -66 DAY), '%Y%m'), 1),
  (HUID('ec78f1ab-e339-41a8-8545-436ebdde358d'), HUID('aca917fe-5320-4c3c-bea6-590e48cfa26b'), HUID('61a151fc-f6e8-41ec-b7a4-f70d6766f8f3'), HUID('f9caeb16-1684-43c5-a6c4-47dbac1df296'), '', 11, DATE_ADD(NOW(), INTERVAL -66 DAY), DATE_ADD(NOW(), INTERVAL -66 DAY), 10, 3.1800, 1, DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -66 DAY), '%Y%m'), 1);

-- This segment was added to simulate the allocation of drugs to patients as well as the loss of stock
INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `invoice_uuid`, `created_at`, `period_id`) VALUES
  (0xB8E73617428B49FDB256DE9C0DFAB743, 0xECE15AAFA73B4A3C880B828CBEB11FE2, 0xF9CAEB16168443C5A6C447DBAC1DF296, 0x6F80748B1D944247804ED4BE99E827D2, NULL, 'Perte de stock', 11, DATE_ADD(NOW(), INTERVAL -378 DAY), 180, 0.8000, 1, 1, NULL, DATE_ADD(NOW(), INTERVAL -378 DAY), DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -378 DAY), '%Y%m')),
  (0xAD36BEC6350A4E1E8961782468FDAADB, 0xA4F26E8C74F84CD29A908CFDB9352A72, 0xF9CAEB16168443C5A6C447DBAC1DF296, 0xAE735E998FAF417BAA639B404FCA99AC, 0xB1816006555845F993A0C222B5EFA6CB, 'Distribution vers un service', 10, DATE_ADD(NOW(), INTERVAL -378 DAY), 80, 1.2000, 1, 1, NULL, DATE_ADD(NOW(), INTERVAL -378 DAY), DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -378 DAY), '%Y%m')),
  (0x00068A69CBF54B10960234E913B6EE2C, 0xB88D7A6CCA094F0689C03738DC55C3CC, 0xF9CAEB16168443C5A6C447DBAC1DF296, 0x064AB1D952464402AE8A958FCDB07B35, 0x274C51AEEFCC423898C6F402BFB39866, 'Distribution to Test 2 Patient', 9, DATE_ADD(NOW(), INTERVAL -1 WEEK), 10, 1.2000, 1, 1, NULL, DATE_ADD(NOW(), INTERVAL -1 WEEK), DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -1 WEEK), '%Y%m')),
  (0xA45397EC170B43D7A246947BFE40EE81, 0x63C5CBB248CE452B97FF0D6BD6B9120B, 0xF9CAEB16168443C5A6C447DBAC1DF296, 0x6F80748B1D944247804ED4BE99E827D2, 0xD1D7F856D41444008B948BA9445A2BC0, 'Distribution to the patient Employee Test 1', 9, DATE_ADD(NOW(), INTERVAL -2 WEEK), 5, 0.8000, 1, 1, NULL, DATE_ADD(NOW(), INTERVAL -2 WEEK), DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -2 WEEK), '%Y%m'));

-- Stock movement for aggregate-consumption-test
INSERT INTO `lot` (`uuid`, `label`, `quantity`, `unit_cost`, `description`, `expiration_date`, `inventory_uuid`, `is_assigned`) VALUES (0xACAA9876EF834D9F84E1BB7C2AF22777, 'lot 2', 1000, 1.4600, NULL, DATE_ADD(CURRENT_DATE, INTERVAL 2 YEAR), 0x43F3DECBFCE9426E940AB2150E62186C,  0);
INSERT INTO `lot` (`uuid`, `label`, `quantity`, `unit_cost`, `description`, `expiration_date`, `inventory_uuid`, `is_assigned`) VALUES (0xD080D354417D47F18E8B1561E98823D9, 'PL1', 1000, 9.5100, NULL, DATE_ADD(CURRENT_DATE, INTERVAL 2 YEAR),   0x43F3DECBFCE9940A426EE62186BC2150,  0);
INSERT INTO `lot` (`uuid`, `label`, `quantity`, `unit_cost`, `description`, `expiration_date`, `inventory_uuid`, `is_assigned`) VALUES (0xE36AFF4F99C244A897B770E34A21E658, 'lot 1', 1000, 1.4600, NULL, DATE_ADD(CURRENT_DATE, INTERVAL 2 YEAR), 0x43F3DECBFCE9426E940AB2150E62186C,  0);

INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `created_at`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`) VALUES (0x32A81E1C81134CA5AA0A63ECF9B3435E, 0x957E34378E664E25B62E771C6443E209, 0xBD4B14524742E4FAA128246814140877, 0xACAA9876EF834D9F84E1BB7C2AF22777, NULL, 'Entrée de stock par intégration - agrege', 13, DATE_ADD(CURRENT_DATE, INTERVAL -12 WEEK), DATE_ADD(CURRENT_DATE, INTERVAL -12 WEEK), 1000, 1.4600, 0, 1, 9, NULL, NULL, DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL -12 WEEK), '%Y%m'));
INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `created_at`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`) VALUES (0x5AB8E771153449549A3EE2D7149ABB9D, 0x9985985CB9A549D4BF8C1E64B273724C, 0xBD4B14524742E4FAA128246814140877, 0xD080D354417D47F18E8B1561E98823D9, NULL, 'Entrée de stock par intégration - agrege', 13, DATE_ADD(CURRENT_DATE, INTERVAL -12 WEEK), DATE_ADD(CURRENT_DATE, INTERVAL -12 WEEK), 1000, 9.5100, 0, 1, 10, NULL, NULL, DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL -12 WEEK), '%Y%m'));
INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `created_at`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`) VALUES (0x63352AD0F54E483195A14E0A6A14493E, 0x957E34378E664E25B62E771C6443E209, 0xBD4B14524742E4FAA128246814140877, 0xE36AFF4F99C244A897B770E34A21E658, NULL, 'Entrée de stock par intégration - agrege', 13, DATE_ADD(CURRENT_DATE, INTERVAL -12 WEEK), DATE_ADD(CURRENT_DATE, INTERVAL -12 WEEK), 1000, 1.4600, 0, 1, 9, NULL, NULL, DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL -12 WEEK), '%Y%m'));

-- Rubric Payroll
INSERT INTO `rubric_payroll` (`id`, `label`, `abbr`, `is_employee`, `is_percent`, `is_discount`, `is_tax`, `is_social_care`, `is_defined_employee`, `is_membership_fee`, `debtor_account_id`, `expense_account_id`, `is_ipr`, `is_associated_employee`, `value`) VALUES
  (1, 'INSS Code part Patronale', 'INSS2', 0, 1, 1, 0, 0, 0, 1, 306, 353, 0, 0, 5),
  (2, 'Impôt Professionnel sur le Revenue', 'IPR', 1, 0, 1, 1, 0, 0, 0, 319, 179, 1, 0, NULL),
  (3, 'Institut National des Pratiques Professionels', 'INPP', 0, 1, 1, 1, 0, 0, 0, 311, 354, 0, 0, 2),
  (4, 'INSS Code Part Ouvriere', 'INSS1', 1, 1, 1, 0, 0, 0, 1, 305, 179, 0, 0, 3.5),
  (5, 'Transport', 'TPR', 0, 0, 0, 0, 1, 1, 0, 179, 358, 0, 0, NULL),
  (6, 'Primes', 'PRI', 0, 0, 0, 0, 0, 0, 0, 179, 343, 0, 0, NULL),
  (7, 'Indemnité vie chère', 'v_cher', 0, 0, 0, 0, 0, 1, 0, 179, 343, 0, 0, NULL),
  (8, 'Frais scolarité', 'f_scol', 0, 0, 0, 0, 0, 1, 0, 179, 343, 0, 0, NULL),
  (9, 'Logement', 'logm', 0, 1, 0, 0, 1, 0, 0, 179, 350, 0, 0, 30),
  (10, 'Allocation Familiale', 'allc', 0, 0, 0, 0, 1, 1, 0, 179, 347, 0, 0, NULL),
  (11, 'Office Nationale de l\emploie', 'ONEM', 0, 1, 1, 1, 0, 0, 0, 320, 355, 0, 0, 0.2),
  (12, 'Acompte sur salaires', 'ac_sal', 1, 0, 1, 0, 0, 1, 0, 340, 179, 0, 1, NULL);

INSERT INTO `rubric_payroll` (`id`, `label`, `abbr`, `is_employee`, `is_percent`, `is_discount`, `is_tax`, `is_social_care`,
 `is_defined_employee`, `is_membership_fee`, `debtor_account_id`, `expense_account_id`, `is_ipr`, `is_associated_employee`,
 `is_seniority_bonus`, `is_family_allowances`, `is_monetary_value`, `position`, `is_indice`, `indice_type`, `value`, `indice_to_grap`)
VALUES
  (13, 'Jours_prestes', 'Jr_preste', 0, 0, 0, 0, 0, 1, 0, NULL, NULL, 0, 0, 0, 0, 0, 7, 1, 'is_day_worked', NULL, 1),
  (14, 'Jours_supplementaires', 'jr_Suppl', 0, 0, 0, 0, 0, 1, 0, NULL, NULL, 0, 0, 0, 0, 0, 8, 1, 'is_extra_day', NULL, 1),
  (15, 'BASE_INDEX', 'Indice-base', 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, 1, 1, 'is_base_index', NULL, 0),
  (16, 'DAY_INDEX', 'Indice-jour', 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, 2, 1, 'is_day_index', NULL, 0),
  (17, 'REAGISTERED_INDEX', 'Indice-reag', 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, 3, 1, 'is_reagistered_index', NULL, 0),
  (18, 'Responsability_', 'Responsability_', 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, 4, 1, 'is_responsability', NULL, 0),
  (19, 'Autres_profit', 'autr-profit', 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, 5, 1, 'is_other_profits', NULL, 1),
  (20, 'Total_code', 'totCod', 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, 6, 1, 'is_total_code', NULL, 0),
  (21, 'total_Jrs', 'total_days', 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, 9, 1, 'is_total_days', NULL, 0),
  (22, 'taux_de_paie', 'TauxPaie', 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, 10, 1, 'is_pay_rate', NULL, 0),
  (23, 'Salire_brute', 'Salaire brute', 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, 11, 1, 'is_gross_salary', NULL, 0),
  (24, 'Nombre_deJours', 'Nbr_jrs', 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, 12, 1, 'is_number_of_days', NULL, 0);

-- Configuration of Rubrinc
INSERT INTO `config_rubric` (`id`, `label`)
 VALUES (1, 'Configuration des rubriques'),
 (2, 'Configuration des rubriques (indices)');

-- Configuration of Rubric Items
INSERT INTO `config_rubric_item` (`id`, `config_rubric_id`, `rubric_payroll_id`) VALUES
  (1, 1, 1),
  (2, 1, 2),
  (3, 1, 3),
  (4, 1, 4),
  (5, 1, 5),
  (6, 1, 6),
  (7, 1, 7),
  (8, 1, 8),
  (9, 1, 9),
  (10, 1, 10),
  (11, 1, 11),
  (12, 1, 12),
  (13, 2, 13),
  (14, 2, 14),
  (15, 2, 15),
  (16, 2, 16),
  (17, 2, 17),
  (18, 2, 18),
  (19, 2, 19),
  (20, 2, 20),
  (21, 2, 21),
  (22, 2, 22),
  (23, 2, 23);

-- Configuration of weekend
INSERT INTO `weekend_config` (`id`, `label`) VALUES
(1, 'Configuration Semaine Anglaise'),
(2, 'Configuration Semaine Normale');

-- Days of weekend configuration
INSERT INTO `config_week_days` (`id`, `indice`, `weekend_config_id`) VALUES
(1, 0, 1),
(2, 6, 1),
(3, 6, 2);

-- Tax IPR
INSERT INTO `taxe_ipr` (`id`, `label`, `description`, `currency_id`) VALUES
(1, 'Bareme IPR 2013', 'Barème Impôt Professionnel sur les revenus', 1);

-- Tax IPR Configuration
INSERT INTO `taxe_ipr_configuration` (`rate`, `tranche_annuelle_debut`, `tranche_annuelle_fin`, `tranche_mensuelle_debut`, `tranche_mensuelle_fin`, `ecart_annuel`, `ecart_mensuel`, `impot_annuel`, `impot_mensuel`, `cumul_annuel`, `cumul_mensuel`, `taxe_ipr_id`) VALUES
  (0, 0, 524160, 0, 43680, 524160, 43680, 0, 0, 0, 0, 1),
  (15, 524160, 1428000, 43680, 119000, 903840, 75320, 135576, 11298, 135576, 11298, 1),
  (20, 1428000, 2700000, 119000, 225000, 1272000, 106000, 254400, 21200, 389976, 32498, 1),
  (22.5, 2700000, 4620000, 225000, 385000, 1920000, 160000, 432000, 36000, 821976, 68498, 1),
  (25, 4620000, 7260000, 385000, 605000, 2640000, 220000, 660000, 55000, 1481980, 123498, 1),
  (30, 7260000, 10260000, 605000, 855000, 3000000, 250000, 900000, 75000, 2381980, 198498, 1),
  (32.5, 10260000, 13908000, 855000, 1159000, 3648000, 304000, 1185600, 98800, 3567580, 297298, 1),
  (35, 13908000, 16824000, 1159000, 1402000, 2916000, 243000, 1020600, 85050, 4588180, 382348, 1),
  (37.5, 16824000, 22956000, 1402000, 1913000, 6132000, 511000, 2299500, 191625, 6887680, 573973, 1),
  (40, 22956000, 100000000000000, 1913000, 1913000, 0, 0, 0, 0, 6887680, 573973, 1);

-- Configuration Accounting Payroll
INSERT INTO `config_accounting` (`label`, `account_id`) VALUES ('Configuration Compte Rémunération', 220);

-- Configuration Employee Payroll
INSERT INTO `config_employee` (`id`, `label`) VALUES ('1', 'Configuration des Employés');
INSERT INTO `config_employee` (`id`, `label`) VALUES ('2', 'Configuration des Employés Indices');

INSERT INTO `config_employee_item` (`id`, `config_employee_id`, `employee_uuid`) VALUES
  (1, 1, 0x75E0969465F245A1A8A28B025003D793),
  (2, 1, 0x75E69409562FA2A845A13D7938B02500);

-- Payroll Configuration Period
INSERT INTO `payroll_configuration` (`id`, `label`, `dateFrom`, `dateTo`,
 `config_rubric_id`, `config_accounting_id`, `config_weekend_id`, `config_employee_id`, `config_ipr_id`) VALUES
(1, 'Février 2018', '2018-02-01', '2018-02-28', 1, 1, 1, 1, 1),
(2, 'Juin 2019', '2019-06-01', '2019-06-30', 2, 1, 1, 1, 1);

SET @paymentUuid = HUID('2a3f17b0ae3242bb9333a760825fd257');
SET @employeeUuid = HUID('75e0969465f245a1a8a28b025003d793');
-- payment DATA

INSERT INTO `payment` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `payment_date`, `total_day`, `working_day`, `basic_salary`, `daily_salary`, `base_taxable`, `gross_salary`, `net_salary`, `amount_paid`, `status_id`)
VALUES (@paymentUuid, @employeeUuid, 1, 2, NULL, 20, 20, 500.0000, 25.0000, 550.0000, 730.0000, 614.0700, 0.0000, 2);

-- rubric_payment DATA
INSERT INTO `rubric_payment` (`id`, `payment_uuid`, `rubric_payroll_id`, `value`, `posted`) VALUES
  (1, @paymentUuid, 5, 20, NULL),
  (2, @paymentUuid, 9, 150, NULL),
  (3, @paymentUuid, 10, 10, NULL),
  (4, @paymentUuid, 6, 20, NULL),
  (5, @paymentUuid, 7, 20, NULL),
  (6, @paymentUuid, 8, 10, NULL),
  (7, @paymentUuid, 1, 27.5, NULL),
  (8, @paymentUuid, 2, 96.68, NULL),
  (9, @paymentUuid, 3, 11, NULL),
  (10, @paymentUuid, 4, 19.25, NULL),
  (11, @paymentUuid, 11, 1.1, NULL);

-- ACCOUNT REFERENCE
INSERT INTO `account_reference` (`id`, `abbr`, `description`, `parent`, `is_amo_dep`, `reference_type_id`) VALUES
  (1, 'c_admin', 'Section Administration', NULL, 0, 1),
  (2, 'p_admin', 'Profit Administration', NULL, 0, 1),
  (3, 'p_test_1', 'Profit Test 1', NULL, 0, 1),
  (4, 'p_test_2', 'Profit Test 2', NULL, 0, 1),
  (5, 'c_test_1', 'Cost Test 1', NULL, 0, 1),
  (6, 'c_test_2', 'Cost Test 2', NULL, 0, 1),
  (7, 'p_test_3', 'Profit Test 3', NULL, 0, 1),
  (8, 'p_test_4', 'Profit Test 4', NULL, 0, 1),
  (9, 'c_test_3', 'Cost Test 3', NULL, 0, 1);

-- ACCOUNT REFERENCE ITEM
INSERT INTO `account_reference_item` (`id`, `account_reference_id`, `account_id`, `is_exception`, `credit_balance`, `debit_balance`) VALUES
  (3, 2, 246, 0, 0, 0),
  (4, 2, 249, 0, 0, 0),
  (5, 2, 242, 0, 0, 0),
  (6, 3, 258, 0, 0, 0),
  (7, 4, 243, 0, 0, 0),
  (8, 5, 201, 0, 0, 0),
  (9, 6, 210, 0, 0, 0),
  (10, 7, 256, 0, 0, 0),
  (12, 8, 256, 0, 0, 0),
  (13, 1, 347, 0, 0, 0),
  (14, 9, 215, 0, 0, 0),
  (15, 9, 53, 0, 0, 0);


-- COST CENTER
INSERT INTO `cost_center` (`id`, `label`, `is_principal`, `project_id`, `allocation_method`, `allocation_basis_id`) VALUES
  (1, 'Administration', 1, 1, 'proportional', 1),
  (2, 'Principale TPA', 1, 1, 'proportional', 2),
  (3, 'Principale TPB', 1, 1, 'proportional', 3),
  (4, 'Auxiliary 1', 0, 1, 'proportional', 2),
  (5, 'Auxiliary 2', 0, 1, 'proportional', 2),
  (6, 'Auxiliary 3', 0, 1, 'flat', 2);

-- set test cost center
UPDATE account set cost_center_id = 4 WHERE id = 215;


-- REFERENCE FEE CENTER
INSERT INTO `reference_cost_center` (`id`, `cost_center_id`, `account_reference_id`, `is_cost`, `is_variable`, `is_turnover`) VALUES
  (1, 1, 1, 1, 1, 0),
  (2, 1, 2, 0, 0, 1),
  (11, 5, 7, 0, 0, 1),
  (15, 3, 3, 0, 0, 1),
  (21, 6, 4, 0, 0, 1),
  (22, 4, 9, 1, 0, 0);

-- GENERAL LEDGER FOR DISTRIBUTION FEE CENTER TEST
INSERT INTO `general_ledger` (`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_id_reference_number`, `trans_date`, `record_uuid`, `description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, `entity_uuid`, `reference_uuid`, `comment`, `transaction_type_id`, `user_id`, `created_at`, `updated_at`) VALUES
  (0xE70109CCE0DC11E89F4F507B9DD6DEA5, 1, 4, 201811, 'TPA37', 37, '2018-11-05 10:26:05', 0x79B0393553C54498A5ECA8CA6DFEA7AC, 'Facture de Test 2 Patient (PA.TPA.2) pour 2 items dans le service Medecine Interne. ', 175, 256.6200, 0.0000, 256.6200, 0.0000, 2, 0x3BE232F9A4B94AF6984C5D3F87D5C107, NULL, NULL, 11, 1, '2018-11-05 10:29:21', NULL),
  (0xE7011804E0DC11E89F4F507B9DD6DEA5, 1, 4, 201811, 'TPA37', 37, '2018-11-05 10:26:05', 0x79B0393553C54498A5ECA8CA6DFEA7AC, 'IV.TPA.1: Tylenol sirop (cold multivit)', 243, 0.0000, 204.8000, 0.0000, 204.8000, 2, NULL, NULL, NULL, 11, 1, '2018-11-05 10:29:21', NULL),
  (0xE7011C13E0DC11E89F4F507B9DD6DEA5, 1, 4, 201811, 'TPA37', 37, '2018-11-05 10:26:05', 0x79B0393553C54498A5ECA8CA6DFEA7AC, 'IV.TPA.1: Multivitamine sirop500 ml', 243, 0.0000, 190.0000, 0.0000, 190.0000, 2, NULL, NULL, NULL, 11, 1, '2018-11-05 10:29:21', NULL),
  (0xE701230AE0DC11E89F4F507B9DD6DEA5, 1, 4, 201811, 'TPA37', 37, '2018-11-05 10:26:05', 0x79B0393553C54498A5ECA8CA6DFEA7AC, 'Facture de Test 2 Patient (PA.TPA.2) pour 2 items dans le service Medecine Interne. ', 220, 256.6200, 0.0000, 256.6200, 0.0000, 2, NULL, NULL, NULL, 11, 1, '2018-11-05 10:29:21', NULL),
  (0xE7012ADCE0DC11E89F4F507B9DD6DEA5, 1, 4, 201811, 'TPA37', 37, '2018-11-05 10:26:05', 0x79B0393553C54498A5ECA8CA6DFEA7AC, 'Facture de Test 2 Patient (PA.TPA.2) pour 2 items dans le service Medecine Interne. ', 260, 0.0000, 78.9600, 0.0000, 78.9600, 2, NULL, NULL, NULL, 11, 1, '2018-11-05 10:29:21', NULL),
  (0xE702756EE0DC11E89F4F507B9DD6DEA5, 1, 4, 201811, 'TPA37', 37, '2018-11-05 10:26:05', 0x79B0393553C54498A5ECA8CA6DFEA7AC, 'Facture de Test 2 Patient (PA.TPA.2) pour 2 items dans le service Medecine Interne. ', 260, 0.0000, 39.4800, 0.0000, 39.4800, 2, NULL, NULL, NULL, 11, 1, '2018-11-05 10:29:21', NULL),
  (0xF768B326DDB111E8A8B3507B9DD6DEA5, 1, 2, 201601, 'TPA3', 3, '2016-01-02 09:34:35', 0xF24619E03A884784A750A414FC9567BF, 'TPA_VENTE/Thu Jan 02 2016 09:30:59 GMT+0100 (WAT)/Test 2 Patient', 175, 5.1300, 0.0000, 5.1300, 0.0000, 2, 0x3BE232F9A4B94AF6984C5D3F87D5C107, NULL, NULL, 11, 1, '2018-11-01 09:42:17', NULL),
  (0xF769555FDDB111E8A8B3507B9DD6DEA5, 1, 2, 201601, 'TPA3', 3, '2016-01-02 09:34:35', 0xF24619E03A884784A750A414FC9567BF, 'IV.TPA.3: Multivitamine tab', 242, 0.0000, 5.1300, 0.0000, 5.1300, 2, NULL, NULL, NULL, 11, 1, '2018-11-01 09:42:17', NULL),
  (0xF76E0838DDB111E8A8B3507B9DD6DEA5, 1, 4, 201811, 'TPA5', 5, '2018-11-01 08:41:46', 0x2E1332B73E63411E827D42AD585FF517, 'Some cool description', 191, 100.0000, 0.0000, 0.1111, 0.0000, 1, NULL, NULL, NULL, 2, 1, '2018-11-01 09:42:17', NULL),
  (0xF7711ED8DDB111E8A8B3507B9DD6DEA5, 1, 4, 201811, 'TPA5', 5, '2018-11-01 08:41:46', 0x2E1332B73E63411E827D42AD585FF517, 'Some cool description', 175, 0.0000, 10.0000, 0.0000, 0.0111, 1, 0x3BE232F9A4B94AF6984C5D3F87D5C107, 0x957E4E79A6BB4B4DA8F7C42152B2C2F6, NULL, 2, 1, '2018-11-01 09:42:17', NULL),
  (0xF7773CC1DDB111E8A8B3507B9DD6DEA5, 1, 4, 201811, 'TPA7', 7, '2018-11-01 09:41:46', 0xA5A5F950A4C947F09A9A2BFC3123E534, 'Sample voucher data one', 187, 100.0000, 0.0000, 100.0000, 0.0000, 2, 0x2C6C48A2B1B311E8AE9B1FA4024347AB, 0x957E4E79A6BB4B4DA8F7C42152B2C2F6, NULL, 1, 1, '2018-11-01 09:42:17', NULL),
  (0xF77740B0DDB111E8A8B3507B9DD6DEA5, 1, 4, 201811, 'TPA7', 7, '2018-11-01 09:41:46', 0xA5A5F950A4C947F09A9A2BFC3123E534, 'Sample voucher data one', 182, 0.0000, 100.0000, 0.0000, 100.0000, 2, NULL, NULL, NULL, 1, 1, '2018-11-01 09:42:17', NULL);

-- INVOICE FOR DISTRIBUTION FEE CENTER
INSERT INTO `invoice` (`project_id`, `uuid`, `cost`, `debtor_uuid`, `service_uuid`, `user_id`, `date`, `description`, `reversed`, `edited`, `created_at`) VALUES
  (1, 0x79B0393553C54498A5ECA8CA6DFEA7AC, 256.6200, 0x3BE232F9A4B94AF6984C5D3F87D5C107, @medicineInterneService, 1, '2018-11-05 10:26:05', 'Facture de Test 2 Patient (PA.TPA.2) pour 2 items dans le service Medecine Interne. ', 0, 0, '2018-11-05 10:26:32');

INSERT INTO `invoice_item` (`invoice_uuid`, `uuid`, `inventory_uuid`, `quantity`, `inventory_price`, `transaction_price`, `debit`, `credit`) VALUES
  (0x79B0393553C54498A5ECA8CA6DFEA7AC, 0x3B456F6FAA594CE5BD80C91647EB6CF9, @multivitamine, 100, 1.9000, 1.9000, 0.0000, 190.0000),
  (0x79B0393553C54498A5ECA8CA6DFEA7AC, 0xC150EFE416144C428643BFEA00608800, @prednisone, 40, 5.1200, 5.1200, 0.0000, 204.8000);

-- SERVICE FEE CENTER
INSERT INTO `service_cost_center` (`id`, `cost_center_id`, `service_uuid`) VALUES (1, 2, @medicineInterneService);
INSERT INTO `service_cost_center` (`id`, `cost_center_id`, `service_uuid`) VALUES (2, 3, @testService);

-- ------------- AFFECTING ALL unit to admin role ----------------------------------------
-- creates a default role

SET @roleUUID = HUID('5b7dd0d6-9273-4955-a703-126fbd504b61');
SET @regularRoleUUID = HUID('5f7dd0c6-9273-4955-a703-126fbd504b61');

DELETE FROM role;

INSERT INTO `role`(uuid, label)
  VALUES (@roleUUID, 'Admin'), (@regularRoleUUID, 'Regular');

-- superuser
INSERT INTO role_unit
 SELECT HUID(UUID()) as uuid,@roleUUID, id FROM unit;

-- actions
INSERT INTO role_actions
  SELECT HUID(UUID()) as uuid, @roleUUID, id FROM actions;

INSERT INTO `user_role`(uuid, user_id, role_uuid)
  VALUES (HUID('9df98fca-b1b3-11e8-a403-1f1cd9345667'), 1, @roleUUID);

-- regular user
INSERT INTO role_unit
 VALUES
  (HUID('76b1c46e-b1b3-11e8-9c1e-87e393921fe3'), @regularRoleUUID , 0 ),
  (HUID('77af2154-b1b3-11e8-ac24-931d721bd446'), @regularRoleUUID , 1 ),
  (HUID('78537ee8-b1b3-11e8-9838-3f6a169f8138'), @regularRoleUUID , 2 ),
  (HUID('78bb7872-b1b3-11e8-ad43-1f4fc435053e'), @regularRoleUUID , 3 ),
  (HUID('7b35eec0-b1b3-11e8-95b3-37d9cf076502'), @regularRoleUUID , 4 );

INSERT INTO `user_role`(uuid, user_id, role_uuid)
  VALUES (HUID('6050a2bc-b1b3-11e8-a0f5-8b6d28d94cad'), 2, @regularRoleUUID);

-- ----------------------------------------------------------------------------------------

-- default entities
INSERT INTO entity (uuid, display_name, gender, email, phone, address, entity_type_id) VALUES
  (HUID('00099B1D184A48DEB93D45FBD0AB3790'), 'Bruce Wayne', 'M', 'thebat@bhi.ma', '+243000000', 'Gotham City', 1),
  (HUID('037AC6C6B75A4E328E9DCDE5DA22BACE'), 'Wayne Enterprise', 'o', 'thebat@bhi.ma', '+243000000', 'Gotham City', 4);

-- default entity groups
INSERT INTO entity_group (uuid, label) VALUES
  (HUID('00099B1D184A48DEB93D45FBD0AB3898'), 'Developers');

-- entity group entity
INSERT INTO entity_group_entity (entity_uuid, entity_group_uuid) VALUES
  (HUID('00099B1D184A48DEB93D45FBD0AB3790'), HUID('00099B1D184A48DEB93D45FBD0AB3898')),
  (HUID('037AC6C6B75A4E328E9DCDE5DA22BACE'), HUID('00099B1D184A48DEB93D45FBD0AB3898'));

-- default room type
INSERT INTO room_type VALUES
  (1, 'Public Room'),
  (2, 'Private Room'),
  (3, 'Privilege Room');

-- default wards for test
SET @ward1 = HUID('f5a72649-26c9-4f5d-bffa-098207a7f24d');
SET @ward2 = HUID('f4ce5f9f-edd3-4bd2-9b9c-43b116c02747');
INSERT INTO ward (uuid, name, description, service_uuid) VALUES
  (@ward1, 'Pavillon A', 'Test pavillon A', @testService),
  (@ward2, 'Pavillon B', 'Test pavillon B', @adminService);

-- default rooms for tests
INSERT INTO room VALUES
  (HUID('A6F9527BA7B44A2C9F4FDD7323BBCF72'), 'Room A in Ward A', 'Room A description', @ward1, 1),
  (HUID('3BD2C0DB6A574B748AE774554BCBC35D'), 'Room B in Ward B', 'Room B description', @ward2, NULL);

-- default bed
INSERT INTO bed VALUES
  (1, 'BED 001', HUID('A6F9527BA7B44A2C9F4FDD7323BBCF72'), 0, 1),
  (2, 'BED 002', HUID('A6F9527BA7B44A2C9F4FDD7323BBCF72'), 0, 1),
  (3, 'BED 003', HUID('A6F9527BA7B44A2C9F4FDD7323BBCF72'), 0, 1);

-- Default Auxiliary Cost Center Distribution Key
INSERT INTO `allocation_key` (`id`, `auxiliary_cost_center_id`, `principal_cost_center_id`, `rate`, `user_id`) VALUES
  (1, 4, 1, 60.00, 1),
  (2, 4, 2, 20.00, 1),
  (3, 4, 3, 20.00, 1);

-- data_collector_management
INSERT INTO `data_collector_management` (`id`, `label`, `description`, `version_number`, `color`, `is_related_patient`, `include_patient_data`) VALUES
  (1, 'Fiche Kardex', 'Fiche de consommation Médicament', 1, '#E0FFFF', 1, 1),
  (3, 'Formulaire Special', NULL, 1, '#EE82EE', 0, 0);

-- choices_list_management
INSERT INTO `choices_list_management` (`id`, `name`, `label`, `fixed`, `parent`, `group_label`, `is_group`, `is_title`) VALUES
  (1, 'genre', 'Genre', 0, 0, 0, 1, 1),
  (2, 'm', 'Masculin', 0, 1, 1, 0, 0),
  (3, 'f', 'Féminin', 0, 1, 1, 0, 0),
  (4, 'pays', 'Pays', 0, 0, 0, 1, 1),
  (5, 'province', 'Province', 0, 4, 0, 1, 1),
  (6, 'districte', 'Districte', 0, 5, 0, 1, 1),
  (7, 'ville', 'Ville', 0, 6, 0, 1, 1),
  (8, 'commune', 'Commune', 0, 7, 0, 1, 1),
  (9, 'quartier', 'Quartier', 0, 8, 0, 1, 1),
  (10, 'rdc', 'RD Congo', 0, 0, 4, 0, 1),
  (11, 'kin', 'Kinshasa', 0, 10, 4, 0, 1),
  (12, 'mont_amba', 'Mont Amba', 0, 11, 6, 0, 1),
  (13, 'lemba', 'Lemba', 0, 12, 8, 0, 1),
  (14, 'salongo', 'Salongo', 0, 13, 9, 0, 1),
  (15, 'avenue', 'Avenue', 0, 9, 0, 1, 1),
  (16, 'bypass', 'By Pass', 0, 14, 15, 0, 0),
  (17, 'kalala', 'Kalala', 0, 14, 0, 0, 0),
  (18, 'funa', 'Funa', 0, 11, 6, 0, 1),
  (19, 'kv', 'Kasa vubu', 0, 18, 8, 0, 1),
  (20, 'mtg', 'Matonge', 0, 19, 9, 0, 1),
  (21, 'masimanimba', 'Masimanimba', 0, 20, 15, 0, 0),
  (22, 'medicament', 'Médicament', 0, 0, 0, 1, 1),
  (23, 'ciprofloxacineCifin', 'ciprofloxacine (cifin ) 500 mg tab', 0, 22, 22, 0, 0),
  (24, 'artesunate60mgInjFl', 'Artesunate 60mg inj. fl', 0, 22, 22, 0, 0),
  (25, 'vitamineA50000iu', 'Vitamine A 50.000 iu', 0, 22, 22, 0, 0),
  (26, 'paracetamol500mg', 'Paracetamol500 mg', 0, 22, 22, 0, 0),
  (27, 'pentazocinetromadol30mg/ml', 'Pentazocine, Tromadol30mg/ml', 0, 22, 22, 0, 0);

-- survey_form
INSERT INTO `survey_form` (`id`, `data_collector_management_id`, `type`, `choice_list_id`, `filter_choice_list_id`, `other_choice`, `name`, `label`, `hint`, `required`, `constraint`, `default`, `calculation`, `rank`) VALUES
  (1, 1, '3', 22, NULL, 0, 'label', 'Médicament', 'Sélectionner le médicament', 1, NULL, NULL, NULL, 1),
  (2, 1, '1', NULL, NULL, 0, 'poids', 'Poids', NULL, 1, NULL, NULL, NULL, 2),
  (3, 1, '2', NULL, NULL, 0, 'dosekilos', 'Dose par kilogramme', NULL, 1, NULL, NULL, NULL, 3),
  (4, 1, '1', NULL, NULL, 0, 'nombreFois', 'Nombre de fois', NULL, 1, NULL, NULL, NULL, 4),
  (5, 1, '2', NULL, NULL, 0, 'voie', 'Voie', NULL, 1, NULL, NULL, NULL, 5),
  (6, 1, '6', NULL, NULL, 0, 'date', 'Date', NULL, 1, NULL, NULL, NULL, 6),
  (7, 1, '7', NULL, NULL, 0, 'temps', 'Temps', NULL, 1, NULL, NULL, NULL, 7),
  (8, 3, '2', NULL, NULL, 0, 'label', 'Structure', NULL, 1, NULL, NULL, NULL, 1),
  (9, 3, '1', NULL, NULL, 0, 'longueur', 'Longueur', 'en mètre (m)', 1, NULL, NULL, NULL, 2),
  (10, 3, '1', NULL, NULL, 0, 'largeur', 'largeur', 'en mètre (m)', 1, NULL, NULL, NULL, 3),
  (11, 3, '9', NULL, NULL, 0, 'surface', 'Surface (m²)', NULL, 0, NULL, NULL, '.{longueur} * .{largeur}', 4),
  (12, 3, '1', NULL, NULL, 0, 'nombre_agent', 'Nombre d''agent', NULL, 1, NULL, NULL, NULL, 5),
  (13, 3, '1', NULL, NULL, 0, 'nombre_femme', 'Nombre des femmes', NULL, 1, NULL, NULL, NULL, 6),
  (14, 3, '5', NULL, NULL, 0, 'note_1', 'Nombre des femmes inferieurs a 25', NULL, 1, '.{nombre_femme} < 25', '25', NULL, 7),
  (15, 3, '10', NULL, NULL, 0, 'raison', 'Raison inferieure', NULL, 0, '.{nombre_femme} < 25', NULL, NULL, 8);

-- survey_data
INSERT INTO `survey_data` (`uuid`, `data_collector_management_id`, `date`, `user_id`, `is_deleted`) VALUES (0x24804F5966E74A8D83E8FE57EE60EFC3, 1, '2019-08-28 08:04:03', 1, 0);
INSERT INTO `survey_data` (`uuid`, `data_collector_management_id`, `date`, `user_id`, `is_deleted`) VALUES (0x2E6753DE87784432B1AE96F6220E7F85, 3, '2019-08-28 08:43:16', 1, 0);
INSERT INTO `survey_data` (`uuid`, `data_collector_management_id`, `date`, `user_id`, `is_deleted`) VALUES (0x7E10BE6083BF4EC5810FD47E2013E7AD, 3, '2019-08-27 21:15:58', 1, 0);

-- survey_data_item
INSERT INTO `survey_data_item` (`uuid`, `survey_form_id`, `survey_form_label`, `survey_data_uuid`, `value`) VALUES
  (0x56CBC3715A3C45699C3612AD0E00BF00, 6, 'date', 0x24804F5966E74A8D83E8FE57EE60EFC3, '2019-08-16'),
  (0x01DDEAFBBC1540DEAE408B75BF8E117B, 3, 'dosekilos', 0x24804F5966E74A8D83E8FE57EE60EFC3, '20'),
  (0xF0D06189F43447A6A18AE710339C13FF, 8, 'label', 0x2E6753DE87784432B1AE96F6220E7F85, 'Access Project'),
  (0x9FC0EA45085E40B8AEBF9FDEBE276373, 1, 'label', 0x24804F5966E74A8D83E8FE57EE60EFC3, '23'),
  (0xCB7A4838D6F544029DC3C44973298C22, 10, 'largeur', 0x7E10BE6083BF4EC5810FD47E2013E7AD, '40'),
  (0x4A64E8AC16ED4D5DA521759A44F9C151, 10, 'largeur', 0x2E6753DE87784432B1AE96F6220E7F85, '50'),
  (0xB39690C2DD924A689D3A644D60D81AC5, 9, 'longueur', 0x7E10BE6083BF4EC5810FD47E2013E7AD, '75'),
  (0xDE878918262B4A41ABC11DADA19F01BE, 9, 'longueur', 0x2E6753DE87784432B1AE96F6220E7F85, '110'),
  (0x8A45E9C704474CCE9A53518D979DC435, 12, 'nombre_agent', 0x7E10BE6083BF4EC5810FD47E2013E7AD, '112'),
  (0xBE53A92025D942E39A1E69CA839C700B, 12, 'nombre_agent', 0x2E6753DE87784432B1AE96F6220E7F85, '1359'),
  (0x3D145F3311CE4AF4A59B80A495F4DBCF, 13, 'nombre_femme', 0x7E10BE6083BF4EC5810FD47E2013E7AD, '23'),
  (0x0B906678C97F4C1281641B6B9447997E, 13, 'nombre_femme', 0x2E6753DE87784432B1AE96F6220E7F85, '860'),
  (0xD375C86040304E62AAE4C03C3B111CB3, 4, 'nombreFois', 0x24804F5966E74A8D83E8FE57EE60EFC3, '2'),
  (0xBA712ED252CF45F9A693750FA04313DE, 14, 'note_1', 0x7E10BE6083BF4EC5810FD47E2013E7AD, '25'),
  (0x0E57EFF1142F4F5E8416FBDBE53E4319, 14, 'note_1', 0x2E6753DE87784432B1AE96F6220E7F85, '25'),
  (0xE55FCC70352546F6A20B39FFFCFD9203, 2, 'poids', 0x24804F5966E74A8D83E8FE57EE60EFC3, '13'),
  (0x05DAAC76E4864FFEA21B4228236D96DD, 15, 'raison', 0x7E10BE6083BF4EC5810FD47E2013E7AD, 'Faible candidature'),
  (0x1B17203E39A848B3ABB1BA6655297BDA, 8, 'structure', 0x7E10BE6083BF4EC5810FD47E2013E7AD, 'IMA World Health'),
  (0xEC7A04D98171476BB6A18CCA79C8A67F, 11, 'surface', 0x7E10BE6083BF4EC5810FD47E2013E7AD, '3000'),
  (0x3EEB3F9A5F5C4B5AB1C82E67DDD12D0B, 11, 'surface', 0x2E6753DE87784432B1AE96F6220E7F85, '5500'),
  (0x083E7B7DCC3642BCB03599B23C02CB62, 7, 'temps', 0x24804F5966E74A8D83E8FE57EE60EFC3, '12:24'),
  (0x9C388012F6CF408FBDD5B510649DBD58, 5, 'voie', 0x24804F5966E74A8D83E8FE57EE60EFC3, 'IV');

INSERT INTO `account_reference` (`id`, `abbr`, `description`, `parent`, `reference_type_id`, `is_amo_dep`) VALUES
  (11, 'charges', 'Charges', NULL, 5, 0),
  (12, 'profits', 'Profits', NULL, 5, 0),
  (13, 'deb', 'Débiteurs', NULL, 5, 0),
  (14, 'cred', 'Créditeurs', NULL, 5, 0);

INSERT INTO `account_reference_item` (`id`, `account_reference_id`, `account_id`, `is_exception`, `credit_balance`, `debit_balance`) VALUES
  (22, 11, 6, 0, 0, 0),
  (23, 11, 208, 1, 0, 0),
  (24, 12, 7, 0, 0, 0),
  (25, 12, 58, 1, 0, 0),
  (26, 13, 173, 0, 0, 0),
  (27, 13, 335, 0, 0, 0),
  (28, 14, 32, 0, 0, 0),
  (29, 14, 178, 0, 0, 0),
  (30, 14, 36, 0, 0, 0);

INSERT INTO `configuration_analysis_tools` (`id`, `label`, `account_reference_id`, `analysis_tool_type_id`) VALUES
  (1, 'Coûts', 11, 1),
  (3, 'Creances', 13, 2),
  (2, 'Profits', 12, 3),
  (4, 'Dettes', 14, 4);

-- To test the display of stock movements linked to a patient
INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `created_at`, `period_id`)
VALUES (0xCDBC3B5BC15E40C7AE7B67F8BDCCF47F, 0x39741655AF0E49AABC917F33F0CA2609, 0xF9CAEB16168443C5A6C447DBAC1DF296, 0x064AB1D952464402AE8A958FCDB07B35, 0x274C51AEEFCC423898C6F402BFB39866, 'Distribution vers le patient Test 2 Patient (PA.TPA.2) à partir du dépôt Depot Principal : Distribution vers un patient', 9, '2020-04-08 18:41:17', 5, 1.2000, 1, 1, 5, NULL, '2020-04-08 18:41:38', 202004);

-- DATA FOR MERGE LOCATION
INSERT INTO `country` (`uuid`, `name`) VALUES (0xC17240C65F0244048D4D15809C7887B6, 'Merge Country');
INSERT INTO `province` (`uuid`, `name`, `country_uuid`) VALUES (0x9308D98C326F427D9E5BC62A894AA334, 'Merge Province', 0xC17240C65F0244048D4D15809C7887B6);

INSERT INTO `sector` (`uuid`, `name`, `province_uuid`) VALUES (0x0AA4E8785ACB4E0CBE0B8E7B61CAE782, 'Merge Secteur 1', 0x9308D98C326F427D9E5BC62A894AA334);
INSERT INTO `sector` (`uuid`, `name`, `province_uuid`) VALUES (0x5B4FBED5763743A090048FB053B17593, 'Merge Secteur 2', 0x9308D98C326F427D9E5BC62A894AA334);

INSERT INTO `village` (`uuid`, `name`, `sector_uuid`, `longitude`, `latitude`) VALUES (0x03C1C626183A4B549C2DB01434D44867, 'Merge village 2', 0x0AA4E8785ACB4E0CBE0B8E7B61CAE782, NULL, NULL);
INSERT INTO `village` (`uuid`, `name`, `sector_uuid`, `longitude`, `latitude`) VALUES (0xB472A67F24624EFC9CB52201530CCBD4, 'Merge Village 1', 0x5B4FBED5763743A090048FB053B17593, NULL, NULL);

INSERT INTO `donor`(`id`, `display_name`) VALUES(1, 'Jeremie LODI');

INSERT INTO `donation`(`uuid`, `project_id`, `date`, `donor_id`)
VALUES(HUID('ae735e99-8faf-417b-aa63-9b404fca390d'), 1, NOW(), 1);

-- DATA FOR REQUISITION
INSERT INTO `stock_requisition` (`uuid`, `requestor_uuid`, `requestor_type_id`, `depot_uuid`, `description`, `date`, `user_id`, `project_id`, `reference`, `status_id`, `updated_at`, `created_at`) VALUES (0x6742E10CE6FC4A0296F3D159A08DA075, 0xAFF85BDCD7C64047AFE71724F8CD369E, 1, 0xD4BB1452E4FA4742A281814140246877, 'Requisition for Test Service', DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY), 1, 1, 1, 1, DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY), DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY));
INSERT INTO `stock_requisition` (`uuid`, `requestor_uuid`, `requestor_type_id`, `depot_uuid`, `description`, `date`, `user_id`, `project_id`, `reference`, `status_id`, `updated_at`, `created_at`) VALUES (0xDAD1E243FD2048E09612BDBE95925254, 0xD4BB1452E4FA4742A281814140246877, 2, 0xF9CAEB16168443C5A6C447DBAC1DF296, 'Requisition for Depot Secondaire', DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY), 1, 1, 2, 1, DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY), DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY));
INSERT INTO `stock_requisition` (`uuid`, `requestor_uuid`, `requestor_type_id`, `depot_uuid`, `description`, `date`, `user_id`, `project_id`, `reference`, `status_id`, `updated_at`, `created_at`) VALUES (0x271C0EBEDDC24476BFCDBA9D31231141, 0xBD4B14524742E4FAA128246814140877, 2, 0xD4BB1452E4FA4742A281814140246877, 'Requisition for Depot Secondaire', DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY), 1, 1, 3, 5, DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY), DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY));
INSERT INTO `stock_requisition` (`uuid`, `requestor_uuid`, `requestor_type_id`, `depot_uuid`, `description`, `date`, `user_id`, `project_id`, `reference`, `status_id`, `updated_at`, `created_at`) VALUES (0x0172864221A6EAD091888FC4B421A279, 0xBD4B14524742E4FAA128246814140877, 2, 0xD4BB1452E4FA4742A281814140246877, 'Requisition for Depot Secondaire', DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY), 1, 1, 4, 1, DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY), DATE_ADD(CURRENT_DATE, INTERVAL -56 DAY));

INSERT INTO `stock_requisition_item` (`requisition_uuid`, `inventory_uuid`, `quantity`) VALUES (0x6742E10CE6FC4A0296F3D159A08DA075, 0x26051234F67811EAA705507B9DD6DEA5, 20);
INSERT INTO `stock_requisition_item` (`requisition_uuid`, `inventory_uuid`, `quantity`) VALUES (0x6742E10CE6FC4A0296F3D159A08DA075, 0xF6556E729D0547998CBD0A03B1810185, 20);
INSERT INTO `stock_requisition_item` (`requisition_uuid`, `inventory_uuid`, `quantity`) VALUES (0xDAD1E243FD2048E09612BDBE95925254, 0x43F3DECBFCE9426E940ABC2150E62186, 4);
INSERT INTO `stock_requisition_item` (`requisition_uuid`, `inventory_uuid`, `quantity`) VALUES (0xDAD1E243FD2048E09612BDBE95925254, 0xC3FD5A026A7549FCB2F376EE4C3FBFB7, 500);
INSERT INTO `stock_requisition_item` (`requisition_uuid`, `inventory_uuid`, `quantity`) VALUES (0x271C0EBEDDC24476BFCDBA9D31231141, 0x25FA9982F67811EAA705507B9DD6DEA5, 20);
INSERT INTO `stock_requisition_item` (`requisition_uuid`, `inventory_uuid`, `quantity`) VALUES (0x271C0EBEDDC24476BFCDBA9D31231141, 0x25FAB9D6F67811EAA705507B9DD6DEA5, 25);
INSERT INTO `stock_requisition_item` (`requisition_uuid`, `inventory_uuid`, `quantity`) VALUES (0x271C0EBEDDC24476BFCDBA9D31231141, 0x25FCAAC9F67811EAA705507B9DD6DEA5, 35);
INSERT INTO `stock_requisition_item` (`requisition_uuid`, `inventory_uuid`, `quantity`) VALUES (0x0172864221A6EAD091888FC4B421A279, 0x43F3DECBFCE9426E940ABC2150E62186, 4);
INSERT INTO `stock_requisition_item` (`requisition_uuid`, `inventory_uuid`, `quantity`) VALUES (0x0172864221A6EAD091888FC4B421A279, 0xF6556E729D0547998CBD0A03B1810185, 20);

-- DATA FOR TAGS
INSERT INTO `tags` (`uuid`, `name`, `color`) VALUES
  (HUID('983a6291-be1f-11eb-84e7-fe335098a4d5'), 'Medicament Traceur', '#0000ff'),
  (HUID('27cfe424-be27-11eb-84e7-fe335098a4d5'), 'Virologie', '#00ff00');


-- DATA FOR CHECK PAYROLL
INSERT INTO `payroll_configuration` (`id`, `label`, `dateFrom`, `dateTo`, `config_rubric_id`, `config_accounting_id`, `config_weekend_id`, `config_employee_id`, `config_ipr_id`) VALUES (4, 'Payroll sample 1', DATE_ADD(LAST_DAY(NOW()), INTERVAL -1 MONTH), LAST_DAY(NOW()), 1, 1, 2, 1, 1);
INSERT INTO `payroll_configuration` (`id`, `label`, `dateFrom`, `dateTo`, `config_rubric_id`, `config_accounting_id`, `config_weekend_id`, `config_employee_id`, `config_ipr_id`) VALUES (5, 'Payroll sample 2', DATE_ADD(LAST_DAY(NOW()), INTERVAL -1 MONTH), LAST_DAY(NOW()), 1, 1, 1, 1, 1);
INSERT INTO `payroll_configuration` (`id`, `label`, `dateFrom`, `dateTo`, `config_rubric_id`, `config_accounting_id`, `config_weekend_id`, `config_employee_id`, `config_ipr_id`) VALUES (6, 'Payroll sample 3', DATE_ADD(LAST_DAY(NOW()), INTERVAL -1 MONTH), LAST_DAY(NOW()), 2, 1, 2, 2, 1);

-- DATA FOR CHECK PAYROLL INDICE  stage_payment_indice
INSERT INTO `debtor` (`uuid`, `group_uuid`, `text`) VALUES (0x038AD65E52634CB095ECEE8AC16CAEC8, 0x4DE0FE47177F4D30B95FCFF8166400B4, 'Debiteur [Employee indice 2]');
INSERT INTO `debtor` (`uuid`, `group_uuid`, `text`) VALUES (0x286D0830E26E4906AD0718399F1C2BAE, 0x4DE0FE47177F4D30B95FCFF8166400B4, 'Debiteur [Employee indice 1]');

INSERT INTO `patient` (`uuid`, `project_id`, `reference`, `debtor_uuid`, `display_name`, `dob`, `dob_unknown_date`, `father_name`, `mother_name`, `profession`, `employer`, `spouse`, `spouse_profession`, `spouse_employer`, `sex`, `religion`, `marital_status`, `phone`, `email`, `address_1`, `address_2`, `origin_location_id`, `current_location_id`, `registration_date`, `title`, `notes`, `hospital_no`, `avatar`, `user_id`, `created_at`, `health_zone`, `health_area`) VALUES (0x4B23E6B9187F4CE69696542F798B5F32, 1, 6, 0x286D0830E26E4906AD0718399F1C2BAE, 'Employee indice 1', '1960-06-30', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'M', NULL, NULL, NULL, NULL, NULL, NULL, 0x1F162A109F6747889EFFC1FEA42FCC9B, 0x1F162A109F6747889EFFC1FEA42FCC9B, '2022-03-11 11:20:13', NULL, NULL, 'IMA-1', NULL, 1, '2022-03-11 11:20:13', NULL, NULL);
INSERT INTO `patient` (`uuid`, `project_id`, `reference`, `debtor_uuid`, `display_name`, `dob`, `dob_unknown_date`, `father_name`, `mother_name`, `profession`, `employer`, `spouse`, `spouse_profession`, `spouse_employer`, `sex`, `religion`, `marital_status`, `phone`, `email`, `address_1`, `address_2`, `origin_location_id`, `current_location_id`, `registration_date`, `title`, `notes`, `hospital_no`, `avatar`, `user_id`, `created_at`, `health_zone`, `health_area`) VALUES (0xA6643C4F310145BA961B54FD83D71E7C, 1, 7, 0x038AD65E52634CB095ECEE8AC16CAEC8, 'Employee indice 2', '1965-05-24', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'F', NULL, NULL, NULL, NULL, NULL, NULL, 0x1F162A109F6747889EFFC1FEA42FCC9B, 0x1F162A109F6747889EFFC1FEA42FCC9B, '2022-03-11 11:28:34', NULL, NULL, 'IMA-2', NULL, 1, '2022-03-11 11:28:34', NULL, NULL);

INSERT INTO `creditor` (`uuid`, `group_uuid`, `text`) VALUES (0x75ED6B1141764BF7821D34BA638B0647, 0xB0FA5ED204F94CB392F761D6404696E7, 'Crediteur [Employee indice 1]');
INSERT INTO `creditor` (`uuid`, `group_uuid`, `text`) VALUES (0x6150E9B14D214DC28E845BFAAB40DD5E, 0xB0FA5ED204F94CB392F761D6404696E7, 'Crediteur [Employee indice 2]');

INSERT INTO `employee` (`uuid`, `code`, `hiring_date`, `grade_uuid`, `nb_spouse`, `nb_enfant`, `individual_salary`, `bank`, `bank_account`, `fonction_id`, `service_uuid`, `creditor_uuid`, `locked`, `patient_uuid`, `reference`) VALUES (0x10F64A41DA594962AA9A90CF0D42257C, 'IMA-ASSR-1', DATE_ADD(CURRENT_DATE, INTERVAL -25 MONTH)   , 0x71E9F21CD9B111E58AB778EB2F2A46E0, 0, 0, 0, NULL, NULL, 2, 0xB1816006555845F993A0C222B5EFA6CB, 0x75ED6B1141764BF7821D34BA638B0647, 0 , 0x4B23E6B9187F4CE69696542F798B5F32, 3);
INSERT INTO `employee` (`uuid`, `code`, `hiring_date`, `grade_uuid`, `nb_spouse`, `nb_enfant`, `individual_salary`, `bank`, `bank_account`, `fonction_id`, `service_uuid`, `creditor_uuid`, `locked`, `patient_uuid`, `reference`) VALUES (0xD321099D01CD41029686B87CB70B9311, 'IMA-ASSP-2', DATE_ADD(CURRENT_DATE, INTERVAL -2 YEAR), 0x61E9F21CD9B111E48AB678EB2F2A46E0, 0, 2, 0, NULL, NULL, 1, 0xE3988489EF6641DF88FA8B8ED6AA03AC, 0x6150E9B14D214DC28E845BFAAB40DD5E, 0, 0xA6643C4F310145BA961B54FD83D71E7C, 4);

INSERT INTO `config_employee_item` (`id`, `config_employee_id`, `employee_uuid`) VALUES
  (3, 2, 0x10F64A41DA594962AA9A90CF0D42257C),
  (4, 2, 0xD321099D01CD41029686B87CB70B9311);

INSERT INTO `staffing_indice` (`uuid`, `employee_uuid`, `grade_uuid`, `fonction_id`, `grade_indice`, `function_indice`, `date`, `created_at`, `updated_at`) VALUES (0xD0EBC894A17411EC90BE65825D4A5AE8, 0x10F64A41DA594962AA9A90CF0D42257C, 0x71E9F21CD9B111E58AB778EB2F2A46E0, 2, 66.0000, 125.0000, NOW(), NOW(), NULL);
INSERT INTO `staffing_indice` (`uuid`, `employee_uuid`, `grade_uuid`, `fonction_id`, `grade_indice`, `function_indice`, `date`, `created_at`, `updated_at`) VALUES (0xD0EC4377A17411EC90BE65825D4A5AE8, 0xD321099D01CD41029686B87CB70B9311, 0x61E9F21CD9B111E48AB678EB2F2A46E0, 1, 138.0000, 60.0000, NOW(), NOW(), NULL);

INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x05DE78C86F9040358C1C263C7ACDF7C6, 0xD321099D01CD41029686B87CB70B9311, 6, 2, 16, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x409510DBED124D598E95026E89A50345, 0xD321099D01CD41029686B87CB70B9311, 6, 2, 20, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x67B16C41AACA4C569DAD53158D267F68, 0xD321099D01CD41029686B87CB70B9311, 6, 2, 18, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x739DEA5FBEAC46FB940C48501086FB52, 0xD321099D01CD41029686B87CB70B9311, 6, 2, 17, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x90D999B065744F9FBF1489B3CCA3B2CD, 0xD321099D01CD41029686B87CB70B9311, 6, 2, 14, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0xA347C991C7FA4378A80868879D6BE534, 0xD321099D01CD41029686B87CB70B9311, 6, 2, 21, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0xA6084D6876A6418592DED81787645F25, 0xD321099D01CD41029686B87CB70B9311, 6, 2, 13, 26.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0xA7F9DB4F99414DD4878F18895EE27240, 0xD321099D01CD41029686B87CB70B9311, 6, 2, 19, 10.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0xC13DE14D86F746EDA541AD8179FC4046, 0xD321099D01CD41029686B87CB70B9311, 6, 2, 22, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0xD21E547563294B83B564C84CF1CADDBF, 0xD321099D01CD41029686B87CB70B9311, 6, 2, 15, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0xD33531F941634C569E9DD3D63D431BE1, 0xD321099D01CD41029686B87CB70B9311, 6, 2, 23, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x0C45159962614A6AB03317B3FE517DA9, 0x10F64A41DA594962AA9A90CF0D42257C, 6, 2, 17, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x1847E08E16354FB49490437A338E2F7C, 0x10F64A41DA594962AA9A90CF0D42257C, 6, 2, 14, 4.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x2CC30FC35CE74B6CA16CD667C20BEE36, 0x10F64A41DA594962AA9A90CF0D42257C, 6, 2, 19, 4.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x40B7626365F84463A95AB9EA50F9448F, 0x10F64A41DA594962AA9A90CF0D42257C, 6, 2, 18, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x412A67B65104494E9B61914969153941, 0x10F64A41DA594962AA9A90CF0D42257C, 6, 2, 22, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x634697D12DF7416B8D337337961B1C44, 0x10F64A41DA594962AA9A90CF0D42257C, 6, 2, 20, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x7A3877AC802A485AA89E5FACB0ECAE77, 0x10F64A41DA594962AA9A90CF0D42257C, 6, 2, 13, 26.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x8A0A501BA72449AD82EDB4A3CBC46055, 0x10F64A41DA594962AA9A90CF0D42257C, 6, 2, 16, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0x9F74545F71C94EAC82309CCC21EE2DC8, 0x10F64A41DA594962AA9A90CF0D42257C, 6, 2, 23, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0xA8242F931EDD49C48257B019F8E72364, 0x10F64A41DA594962AA9A90CF0D42257C, 6, 2, 21, 0.0000);
INSERT INTO `stage_payment_indice` (`uuid`, `employee_uuid`, `payroll_configuration_id`, `currency_id`, `rubric_id`, `rubric_value`) VALUES (0xDC62269905C84CB0854F3407E7373220, 0x10F64A41DA594962AA9A90CF0D42257C, 6, 2, 15, 0.0000);


--
--  SAMPLE ASSET DATA (added by jmcameron 2022-03-25)
--

SET @inv_moto = HUID('46E4C0EC5C764A479D14F34394707EF4');
SET @asset_mot1 = HUID('F16982E279AC4FC397BFF69105CB33F1');
SET @asset_mot2 = HUID('4A1039DDF0644CDDBC945A9A40CF7EC5');

-- Define sample asset inventory item
INSERT INTO `inventory` (`enterprise_id`, `uuid`, `code`, `text`, `price`, `default_quantity`,
 `group_uuid`, `unit_id`, `unit_weight`, `unit_volume`, `type_id`, `consumable`, `is_asset`, `sellable`,
 `note`, `locked`, `delay`, `purchase_interval`, `last_purchase`, `num_purchase`,`num_delivery`,
 `importance`,`manufacturer_brand`,`manufacturer_model`, `created_at`, `updated_at`) VALUES
(1, @inv_moto, 'MOT.HCRF250RX', 'Honda CRF250RX', 8500.00, 1,
 0x552843E2F9234CFABEA321C65E350921, 23, 250.0, 0, 1, 0, 1, 0,
 NULL, 0, 1.0, 0.0, NULL, 0, 0,
 NULL, 'Honda', 'CRF250RX', '2022-02-25 09:12:32', NULL);

-- Insert sample assets
INSERT INTO `lot` (`uuid`, `label`, `quantity`, `unit_cost`, `description`, `expiration_date`, `inventory_uuid`, `is_assigned`, `serial_number`, `acquisition_date`) VALUES
(@asset_mot1, 'MOT1', 1, 8500.0000, NULL, '2027-03-01', @inv_moto, 1, '12345', DATE_ADD(CURRENT_DATE, INTERVAL -2 YEAR)),
(@asset_mot2, 'MOT2', 1, 8500.0000, NULL, '2027-03-01', @inv_moto, 0 , '12346', DATE_ADD(CURRENT_DATE, INTERVAL -2 YEAR));

-- Stock movements for the sample assets
INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`,
  `entity_uuid`, `description`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`,
  `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`, `created_at`) VALUES
(0x7A18A46C60AC40C3B0D673B0EA92F5A5, 0xDD6645B27FAA44E3AF766A6B10E91385, @depot_uuid, @asset_mot1,
  NULL, 'Stock Entry by Integration', 13, '2022-03-11 11:20:30', 1, 8500.0, 0, 1,
  11, NULL, NULL, 202203, '2022-03-11 11:21:14'),
(0xE43D4E4DC0DD4ECDA4B24681B28DB660, 0xDD6645B27FAA44E3AF766A6B10E91385, @depot_uuid, @asset_mot2,
  NULL, 'Stock Entry by Integration', 13, '2022-03-11 11:20:30', 1, 8500.0, 0, 1,
  11, NULL, NULL, 202203, '2022-03-11 11:21:14');

-- Add an asset assignment
INSERT INTO `stock_assign` (`uuid`, `lot_uuid`, `entity_uuid`, `depot_uuid`,
  `quantity`, `is_active`, `description`, `user_id`, `updated_at`, `created_at`) VALUES
(0xA25AE6744A584271A7FB81596FC62CFC, @asset_mot1, 0x00099B1D184A48DEB93D45FBD0AB3790, @depot_uuid,
 1, 1, NULL, 1, '2022-03-11 15:58:12', '2022-03-11 15:58:12');

-- Add asset management scans
INSERT INTO `asset_scan` (`uuid`, `asset_uuid`, `location_uuid`, `depot_uuid`,
  `scanned_by`, `condition_id`, `notes`, `created_at`) VALUES
(0xA215AE67494744271A7F81596FC62CFC, @asset_mot1, NULL, @depot_uuid, 1, 1, 'Initial entry', DATE_ADD(NOW(), INTERVAL -7 DAY)),
(0xA215AE6749474422345F81596FC62CFC, @asset_mot2, NULL, @depot_uuid, 1, 1, 'Initial entry', NOW());
