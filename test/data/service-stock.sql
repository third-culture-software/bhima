SET names 'utf8mb4';
SET character_set_database = 'utf8mb4';
SET collation_database = 'utf8mb4_unicode_ci';
SET CHARACTER SET utf8mb4, CHARACTER_SET_CONNECTION = utf8mb4;

SET AUTOCOMMIT=0;

--
-- stock settings
--

INSERT INTO `stock_setting` (
  `enterprise_id`,
  `enable_auto_stock_accounting`,
  `month_average_consumption`,
  `default_purchase_interval`
) VALUES (1, 0, 12, 0);


-- default constant
SET @superUser = 1;
SET @depot_uuid = 0x4341F89CD1EB47BD9527DF9E13D2237C;
SET @second_depot_uuid = HUID('d4bb1452-e4fa-4742-a281-814140246877');
SET @third_depot_uuid = HUID('bd4b1452-4742-e4fa-a128-246814140877');

--
-- depots
--

INSERT INTO `depot` VALUES
  (@depot_uuid, 'Depot Principal', NULL, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, NULL, 2, NULL, NULL, 0, 0),
  (@second_depot_uuid, 'Depot Secondaire', NULL, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, NULL, 3, NULL, NULL, 0, 0),
  (@third_depot_uuid, 'Depot Tertiaire', NULL, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, NULL, 3, NULL, NULL, 0, 0);

--
-- Set Depot Management By User
--

INSERT INTO depot_permission (user_id, depot_uuid) VALUES
  (@superUser, @depot_uuid),
  (@superUser, @second_depot_uuid),
  (@superUser, @third_depot_uuid);


-- just after one year ago
-- SET @one_year_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 12 MONTH), INTERVAL (3000*RAND()) SECOND);
-- SET @eleven_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 11 MONTH), INTERVAL (3000*RAND()) SECOND);
-- SET @ten_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 10 MONTH), INTERVAL (3000*RAND()) SECOND);
-- SET @nine_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 9 MONTH), INTERVAL (3000*RAND()) SECOND);
-- SET @eight_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 8 MONTH), INTERVAL (3000*RAND()) SECOND);
-- SET @seven_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 7 MONTH), INTERVAL (3000*RAND()) SECOND);
-- SET @six_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 6 MONTH), INTERVAL (3000*RAND()) SECOND);
-- SET @five_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 5 MONTH), INTERVAL (3000*RAND()) SECOND);
-- SET @four_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 4 MONTH), INTERVAL (3000*RAND()) SECOND);
-- SET @three_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 MONTH), INTERVAL (3000*RAND()) SECOND);
-- SET @two_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 MONTH), INTERVAL (3000*RAND()) SECOND);
-- SET @one_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 1 MONTH), INTERVAL (3000*RAND()) SECOND);

-- Use true month intervals instead of day approximations
SET @one_year_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 12 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);
SET @eleven_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 11 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);
SET @ten_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 10 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);
SET @nine_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 9 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);
SET @eight_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 8 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);
SET @seven_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 7 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);
SET @six_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 6 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);
SET @five_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 5 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);
SET @four_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 4 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);
SET @three_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);
SET @two_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);
SET @one_months_ago = DATE_ADD(DATE_SUB(NOW(), INTERVAL 1 MONTH), INTERVAL FLOOR(3000 * RAND()) SECOND);

-- two years and some into the future
SET @expiration_date = DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 YEAR), INTERVAL (100000 *RAND()) SECOND);

DELIMITER $$
CREATE FUNCTION GetPeriodId(period_date DATETIME)
RETURNS TEXT DETERMINISTIC
BEGIN
 RETURN DATE_FORMAT(period_date,'%Y%m');
END $$

DELIMITER ;

INSERT INTO `lot` (`uuid`, `label`, `quantity`, `unit_cost`, `description`, `expiration_date`, `inventory_uuid`, `is_assigned`) VALUES
  (0x3CAA76C5748041F5A55600D48B770B9D,'QUININE-C-XXX',100,9.4000,NULL,@expiration_date,0x6D93ED88393211EBA0B954E1AD7439C7,0),
  (0x6AA623AAA6EF4ECAB811E398D37C110D,'AMP-C-ZZZ',60,3.1800,NULL,@expiration_date,0x6D920858393211EBA0B954E1AD7439C7,0),
  (0x6E8A11992E8641758727F73A3648A1B8,'AMP-A-ZZZ',120,3.1800,NULL,@expiration_date,0x6D920858393211EBA0B954E1AD7439C7,0),
  (0x8E8D1F39D57348689800EB8EA707E813,'OXY-A-YYYY',10000,7.0600,NULL,@expiration_date,0x6D93A100393211EBA0B954E1AD7439C7,0),
  (0x8E8D1F39D57348689800EB8EA707E814,'OXY-B-YYYY',5000,9.0000,NULL,@expiration_date,0x6D93A100393211EBA0B954E1AD7439C7,0),
  (0x971F7AC3FF604A649773CE9539871A07,'QUININE-B-XXX',500,9.4000,NULL,@expiration_date,0x6D93ED88393211EBA0B954E1AD7439C7,0),
  (0xA44C718A6A2D45DD9EE4BD85A9E99958,'AMP-B-ZZZ',120,3.1800,NULL,@expiration_date,0x6D920858393211EBA0B954E1AD7439C7,0),
  (0xC26BA248149D4FAB882C97A368072F2B,'QUININE-A-XXX',200,9.4000,NULL,@expiration_date,0x6D93ED88393211EBA0B954E1AD7439C7,0),
  (0xD5C6BC2825A24C218025817F8F00B8A7,'QUININE-D-XXX',200,9.4000,NULL,@expiration_date,0x6D93ED88393211EBA0B954E1AD7439C7,0);

INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`, `created_at`) VALUES
  (0x04F19F9316DA4DE09DACD1F670424D7F,0x7FA5E0D14D7E436B89E4E7D0CDF0570F,@depot_uuid,0x8E8D1F39D57348689800EB8EA707E813,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption for Mai 2020',10,@seven_months_ago,100,7.0600,1,1,6,NULL,NULL,GetPeriodId(@seven_months_ago), @seven_months_ago),
  (0x05655DFD319144A7A52C5C8E1E2CBA2C,0x0BF8E5AB353F4C0BA6BDD2E119C5C58E,@depot_uuid,0xC26BA248149D4FAB882C97A368072F2B,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption for April 2020',10,@eight_months_ago,120,9.4000,1,1,5,NULL,NULL,GetPeriodId(@eight_months_ago), @eight_months_ago),
  (0x07E5A05008C7482C9BE0DB35ACDD36D3,0x5CEDC2C76BDF44A38346BC869217DE30,@depot_uuid,0xA44C718A6A2D45DD9EE4BD85A9E99958,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption for July 2020',10,@four_months_ago,75,3.1800,1,1,8,NULL,NULL,GetPeriodId(@four_months_ago), @four_months_ago),
  (0x0824C43D6F43459CB70CCDF63638E0FE,0xAE2714926A714AE9B56C96A102B0D98F,@depot_uuid,0x6E8A11992E8641758727F73A3648A1B8,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption of Jan 1',10,@eleven_months_ago,20,3.1800,1,1,2,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0x0B839A8A4F2E42639C48219F5A0E438A,0x0BF8E5AB353F4C0BA6BDD2E119C5C58E,@depot_uuid,0x6E8A11992E8641758727F73A3648A1B8,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption for April 2020',10,@eight_months_ago,30,3.1800,1,1,5,NULL,NULL,GetPeriodId(@eight_months_ago), @eight_months_ago),
  (0x0D85BC0968C345969388902964EDBE20,0xBE5B30E5BBC2403AA49B7B58D019B7E8,@depot_uuid,0x971F7AC3FF604A649773CE9539871A07,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption for August 2020',10,@three_months_ago,50,9.4000,1,1,9,NULL,NULL,GetPeriodId(@three_months_ago), @three_months_ago),
  (0x0FB0A5D108B54F5981FD33EF0FB32160,0x5D1695E2AE4C42EE80DDA6D80DE9BF07,@depot_uuid,0x6E8A11992E8641758727F73A3648A1B8,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption for June 2020',10,@six_months_ago,30,3.1800,1,1,7,NULL,NULL,GetPeriodId(@six_months_ago), @six_months_ago),
  (0x3138767AE6404C9D8BF536D64D11207F,0x60F74D25E1B94D8DACAAD51B3318216E,@depot_uuid,0x8E8D1F39D57348689800EB8EA707E813,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption of March.2020',10,@nine_months_ago,300,7.0600,1,1,4,NULL,NULL,GetPeriodId(@nine_months_ago), @nine_months_ago),
  (0x44D06FD1A86F4A32BA33CC9CA3ED7B79,0xAE2714926A714AE9B56C96A102B0D98F,@depot_uuid,0x3CAA76C5748041F5A55600D48B770B9D,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption of Jan 1',10,@eleven_months_ago,30,9.4000,1,1,2,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0x4DEA61312CEA466B956602AADEF50673,0xAE2714926A714AE9B56C96A102B0D98F,@depot_uuid,0x971F7AC3FF604A649773CE9539871A07,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption of Jan 1',10,@eleven_months_ago,20,9.4000,1,1,2,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0x4E6E8DA908EA4C5D82F21925ADEDD6FC,0x5D1695E2AE4C42EE80DDA6D80DE9BF07,@depot_uuid,0x8E8D1F39D57348689800EB8EA707E813,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption for June 2020',10,@six_months_ago,90,7.0600,1,1,7,NULL,NULL,GetPeriodId(@six_months_ago), @six_months_ago);

INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`, `created_at`) VALUES
  (0x4FD61D6DD31E406CB4F90AD76AF7FEF6,0xCC5446AF6CA44D29A955FC33AC75EAA3,@depot_uuid,0x6AA623AAA6EF4ECAB811E398D37C110D,NULL,'Initializing the inventory of the first depot.',13,@one_year_ago,60,3.1800,0,1,1,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0x568DB860F640468EA27D5088EE2ABC64,0xCC5446AF6CA44D29A955FC33AC75EAA3,@depot_uuid,0xC26BA248149D4FAB882C97A368072F2B,NULL,'Initializing the inventory of the first depot.',13,@one_year_ago,200,9.4000,0,1,1,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0x5D6539CF6D5A4AA4A5230669FC06BC77,0x0BF8E5AB353F4C0BA6BDD2E119C5C58E,@depot_uuid,0x8E8D1F39D57348689800EB8EA707E813,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption for April 2020',10,@eight_months_ago,60,7.0600,1,1,5,NULL,NULL,GetPeriodId(@eight_months_ago), @eight_months_ago),
  (0x5F25161D525A439885309ABAB3CE3B4E,0x5D1695E2AE4C42EE80DDA6D80DE9BF07,@depot_uuid,0xD5C6BC2825A24C218025817F8F00B8A7,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption for June 2020',10,@six_months_ago,100,9.4000,1,1,7,NULL,NULL,GetPeriodId(@six_months_ago), @six_months_ago),
  (0x62092088F2384008845EB7FFC18E2692,0x7FA5E0D14D7E436B89E4E7D0CDF0570F,@depot_uuid,0x6E8A11992E8641758727F73A3648A1B8,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption for Mai 2020',10,@seven_months_ago,30,3.1800,1,1,6,NULL,NULL,GetPeriodId(@seven_months_ago), @seven_months_ago),
  (0x65DC4EEC5F0249959A64E7B54C9F0F8E,0xCC5446AF6CA44D29A955FC33AC75EAA3,@depot_uuid,0x971F7AC3FF604A649773CE9539871A07,NULL,'Initializing the inventory of the first depot.',13,@one_year_ago,500,9.4000,0,1,1,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0x66B809243D054A44944445DCEF19A421,0x5CEDC2C76BDF44A38346BC869217DE30,@depot_uuid,0x8E8D1F39D57348689800EB8EA707E813,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption for July 2020',10,@four_months_ago,120,7.0600,1,1,8,NULL,NULL,GetPeriodId(@four_months_ago), @four_months_ago),
  (0x77A35840B74F49D5B47B3CE29840ABCD,0x5CEDC2C76BDF44A38346BC869217DE30,@depot_uuid,0xD5C6BC2825A24C218025817F8F00B8A7,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption for July 2020',10,@four_months_ago,80,9.4000,1,1,8,NULL,NULL,GetPeriodId(@four_months_ago), @four_months_ago),
  (0x7B974EF9F33E4A7A97B5CE3DBE252EAD,0x52289678498B42AAB50115796C953B19,@depot_uuid,0x3CAA76C5748041F5A55600D48B770B9D,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption of February 2020',10,@ten_months_ago,50,9.4000,1,1,3,NULL,NULL,GetPeriodId(@ten_months_ago), @ten_months_ago);

INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`, `created_at`) VALUES
  (0x7E064AE1E81F404C911B2451D115F67F,0x414E2B0856C840B981AB4AB7E7711D51,@depot_uuid,0x8E8D1F39D57348689800EB8EA707E813,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Distribution to a service',10,@two_months_ago,45,7.0600,1,1,10,NULL,NULL,GetPeriodId(@two_months_ago), @two_months_ago);

INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`, `created_at`) VALUES
  (0x7E8CE78750304740BCC7A42B491C5EF8,0x60F74D25E1B94D8DACAAD51B3318216E,@depot_uuid,0x3CAA76C5748041F5A55600D48B770B9D,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption of March.2020',10,@nine_months_ago,20,9.4000,1,1,4,NULL,NULL,GetPeriodId(@nine_months_ago), @nine_months_ago);

INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`, `created_at`) VALUES
  (0x7F50D2C7C40B4D2D81AF430F4BDF33FE,0xCC5446AF6CA44D29A955FC33AC75EAA3,@depot_uuid,0x3CAA76C5748041F5A55600D48B770B9D,NULL,'Initializing the inventory of the first depot.',13,@one_year_ago,100,9.4000,0,1,1,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago);


INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`, `created_at`) VALUES
  (0x82D8D6C347514C56BE0389240F04DA36,0x52289678498B42AAB50115796C953B19,@depot_uuid,0x8E8D1F39D57348689800EB8EA707E813,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption of February 2020',10,@ten_months_ago,25,7.0600,1,1,3,NULL,NULL,GetPeriodId(@ten_months_ago), @ten_months_ago),
  (0x85F8A8FA5C734D9E8A70A1E0045F60CF,0x52289678498B42AAB50115796C953B19,@depot_uuid,0x6E8A11992E8641758727F73A3648A1B8,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption of February 2020',10,@ten_months_ago,10,3.1800,1,1,3,NULL,NULL,GetPeriodId(@ten_months_ago), @ten_months_ago),
  (0x8CF662C80D4141E1B8C393CBBADC1D43,0x60F74D25E1B94D8DACAAD51B3318216E,@depot_uuid,0xC26BA248149D4FAB882C97A368072F2B,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption of March.2020',10,@nine_months_ago,40,9.4000,1,1,4,NULL,NULL,GetPeriodId(@nine_months_ago), @nine_months_ago),
  (0x91048BFFCB274D63960D4DC91C15587D,0x52289678498B42AAB50115796C953B19,@depot_uuid,0x6AA623AAA6EF4ECAB811E398D37C110D,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption of February 2020',10,@ten_months_ago,20,3.1800,1,1,3,NULL,NULL,GetPeriodId(@ten_months_ago), @seven_months_ago);

INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`, `created_at`) VALUES
  (0x938B11B7454D43C785D1AE8736530FDF,0x7FA5E0D14D7E436B89E4E7D0CDF0570F,@depot_uuid,0xD5C6BC2825A24C218025817F8F00B8A7,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption for Mai 2020',10,@seven_months_ago,20,9.4000,1,1,6,NULL,NULL,GetPeriodId(@seven_months_ago), @seven_months_ago),
  (0xA02C0EBF275A4F40BABDA6AF6EFB3554,0xBE5B30E5BBC2403AA49B7B58D019B7E8,@depot_uuid,0xA44C718A6A2D45DD9EE4BD85A9E99958,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption for August 2020',10,@three_months_ago,35,3.1800,1,1,9,NULL,NULL,GetPeriodId(@three_months_ago), @three_months_ago),
  (0xA376C333D663433687D9DB70B5411D88,0xAE2714926A714AE9B56C96A102B0D98F,@depot_uuid,0xC26BA248149D4FAB882C97A368072F2B,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption of Jan 1',10,@eleven_months_ago,10,9.4000,1,1,2,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0xA85C080AA1D34AA58AD8B07790309A01,0xBE5B30E5BBC2403AA49B7B58D019B7E8,@depot_uuid,0x8E8D1F39D57348689800EB8EA707E813,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption for August 2020',10,@three_months_ago,150,7.0600,1,1,9,NULL,NULL,GetPeriodId(@three_months_ago), @three_months_ago),
  (0xB6C3E21499964517A7EEA2D726FC622C,0xAE2714926A714AE9B56C96A102B0D98F,@depot_uuid,0x6AA623AAA6EF4ECAB811E398D37C110D,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption of Jan 1',10,@eleven_months_ago,10,3.1800,1,1,2,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0xBC0BB88D64CA49F7905917C1797E692F,0x0BF8E5AB353F4C0BA6BDD2E119C5C58E,@depot_uuid,0xA44C718A6A2D45DD9EE4BD85A9E99958,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption for April 2020',10,@eight_months_ago,10,3.1800,1,1,5,NULL,NULL,GetPeriodId(@eight_months_ago), @eight_months_ago),
  (0xBD43137B5C7943A1BCDF1F3554A020E5,0x414E2B0856C840B981AB4AB7E7711D51,@depot_uuid,0x971F7AC3FF604A649773CE9539871A07,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Distribution to a service',10,@two_months_ago,70,9.4000,1,1,10,NULL,NULL,GetPeriodId(@two_months_ago), @two_months_ago),
  (0xC1DF96C693FD494297313D0F4763EFEA,0xCC5446AF6CA44D29A955FC33AC75EAA3,@depot_uuid,0xA44C718A6A2D45DD9EE4BD85A9E99958,NULL,'Initializing the inventory of the first depot.',13,@one_year_ago,120,3.1800,0,1,1,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0xC634076C958A4EDEAEB0FEAB7E3796D8,0x7FA5E0D14D7E436B89E4E7D0CDF0570F,@depot_uuid,0xC26BA248149D4FAB882C97A368072F2B,0xB1816006555845F993A0C222B5EFA6CB,'Distribution to the service Administration from Depot Principal : Consumption for Mai 2020',10,@seven_months_ago,30,9.4000,1,1,6,NULL,NULL,GetPeriodId(@seven_months_ago), @seven_months_ago),
  (0xDCAA9887DDF24D7B8B89770B9D88EAD3,0xCC5446AF6CA44D29A955FC33AC75EAA3,@depot_uuid,0x8E8D1F39D57348689800EB8EA707E813,NULL,'Initializing the inventory of the first depot.',13,@one_year_ago,10000,7.0600,0,1,1,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0xDEB26BF75B934CFAB67220096825145F,0x60F74D25E1B94D8DACAAD51B3318216E,@depot_uuid,0x6AA623AAA6EF4ECAB811E398D37C110D,0xE3988489EF6641DF88FA8B8ED6AA03AC,'Distribution to the service Medecine Interne from Depot Principal : Consumption of March.2020',10,@nine_months_ago,30,3.1800,1,1,4,NULL,NULL,GetPeriodId(@nine_months_ago), @nine_months_ago),
  (0xDFA64BB33B064F32A61853D7921813EF,0xCC5446AF6CA44D29A955FC33AC75EAA3,@depot_uuid,0xD5C6BC2825A24C218025817F8F00B8A7,NULL,'Initializing the inventory of the first depot.',13,@one_year_ago,200,9.4000,0,1,1,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0xFF49CBF1A5A240E692859830840F2FC7,0xCC5446AF6CA44D29A955FC33AC75EAA3,@depot_uuid,0x6E8A11992E8641758727F73A3648A1B8,NULL,'Initializing the inventory of the first depot.',13,@one_year_ago,120,3.1800,0,1,1,NULL,NULL,GetPeriodId(@eleven_months_ago), @eleven_months_ago),
  (0xDCAA9887DDF24D7B8B89770B9D88EAD4,0xCC5446AF6CA44D29A955FC33AC75EAA4,@depot_uuid,0x8E8D1F39D57348689800EB8EA707E814,NULL,'Second stock entry',13,@two_months_ago,5000,9.0000,0,1,1,NULL,NULL,GetPeriodId(@two_months_ago), @two_months_ago);

COMMIT;

--
-- Compute quantities of all inventories and write into stock_movement_status table
--
CALL zRecomputeStockMovementStatus();
