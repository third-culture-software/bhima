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
  `default_purchase_interval`
) VALUES (1, 0, 0);


-- default constant
SET @superUser = 1;
SET @depot_uuid = 0x4341F89CD1EB47BD9527DF9E13D2237C;
SET @second_depot_uuid = HUID('d4bb1452-e4fa-4742-a281-814140246877');
SET @third_deposit_uuid = HUID('bd4b1452-4742-e4fa-a128-246814140877');

--
-- depots
--

INSERT INTO `depot` VALUES
  (@depot_uuid, 'Depot Principal', NULL, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, NULL, 2, NULL, NULL, 0, 0),
  (@second_depot_uuid, 'Depot Secondaire', NULL, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, NULL, 3, NULL, NULL, 0, 0),
  (@third_deposit_uuid, 'Depot Tertiaire', NULL, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, NULL, 3, NULL, NULL, 0, 0);

--
-- Set Depot Management By User
--

INSERT INTO depot_permission (user_id, depot_uuid) VALUES
  (@superUser, @depot_uuid),
  (@superUser, @second_depot_uuid),
  (@superUser, @third_deposit_uuid);

--
-- Déchargement des données de la table `document_map`
--
INSERT INTO document_map (uuid,`text`) VALUES
(0x07ECF74060C5456096DC3F74DC1CB862,'SM.10.22')
,(0x0A9BF0AF1DB24B11B378A63C6106001F,'SM.10.21')
,(0x14403E28123540B1B1EF4B40374696E8,'SM.10.26')
,(0x1BBD32D0E62846C98DFE72016919A14E,'SM.10.24')
,(0x1FDF6A28E80544F59E0CC75D6AF847C0,'SM.10.2')
,(0x25A56BB00D5E11EBB53D54E1AD7439C7,'VO.IMA.3')
,(0x358DA8898203472A82181195EBBCC890,'SM.10.15')
,(0x36514BBE414C4BBC82E8E7735EB67C8E,'SM.10.7')
,(0x3AB34287A5A24D77A705327DE2D46FCE,'SM.10.28')
,(0x3E9F302EBE234FB680804A58763E083C,'SM.10.3')
;
INSERT INTO document_map (uuid,`text`) VALUES
(0x457D5E4EB3C24B96B328FB64FD86528B,'SM.13.17')
,(0x45A5D97E84CE4D019400B49B59F21E98,'SM.10.23')
,(0x468A21599EB14D77B6F698B15423BB6C,'SM.13.30')
,(0x475A7F4AA9824ADC811091E16BD417ED,'SM.10.8')
,(0x51B831A221F0484DA9870A17A96EC9FA,'SM.10.33')
,(0x67A820EF348611EBA0B954E1AD7439C7,'VO.IMA.4')
,(0x67FEEB5B8B1C454EBBCD0D8AB56AB1BB,'SM.10.6')
,(0x76DF3598887B4B4A92B426D90DDCE750,'SM.10.11')
,(0x780D2B1B10E54B66BAB7527264402001,'SM.13.1')
,(0x7DF64043023440229A528F84960A39F8,'SM.10.13')
;
INSERT INTO document_map (uuid,`text`) VALUES
(0x8199CED5776746FCADA2635B42AEFA32,'SM.10.20')
,(0x835E996AD7374EAA9CC5D6850DD4F644,'SM.10.32')
,(0x89210079806D4E91A2EE47A8D691445E,'SM.10.5')
,(0x91DD6D88BC624358A43C377896CA076C,'SM.10.16')
,(0xA83FAE630D5B11EBB53D54E1AD7439C7,'VO.IMA.1')
,(0xAA3958A6736E4ADB89FF90FAB02DB527,'SM.10.18')
,(0xAC7BFD31A5054862BCC855364C9A2111,'SM.10.12')
,(0xB294BE9710844A468817A704C31BC1D3,'SM.10.4')
,(0xBAB9A32B068740CCB5D272ABF33C0C27,'SM.10.27')
,(0xC869AFBA5A3045BE974C7E70A1C853B5,'SM.10.19')
;
INSERT INTO document_map (uuid,`text`) VALUES
(0xDDB377700D5C11EBB53D54E1AD7439C7,'VO.IMA.2')
,(0xE59B7703345F422D8012D2EC8AE308C4,'SM.10.9')
,(0xE7FE3A93B24C4BE1A40EF1D005BEC18B,'SM.10.31')
,(0xEA303A48731C48A4A7364FC3C648D4F8,'SM.10.29')
,(0xF31BE3E80AA44E7B8269E65F2E92A38B,'SM.10.25')
,(0xF95E5D9734C14D288018A077B7C29D1A,'SM.10.14')
,(0xFD34CEB3E19C41A482211FFCF2656C0D,'SM.13.10')
;

--
-- Déchargement des données de la table `integration`
--

INSERT INTO `integration` (`uuid`, `reference`, `project_id`, `description`, `date`) VALUES
(0xf5212fa19e2b48f2afd15c1d131b919d, 1, 1, 'Entrée de stock par intégration', '2020-10-01'),
(0xc59ece8817b64d18b7316bf768325ff9, 2, 1, 'Entrée de stock par intégration', '2020-10-11'),
(0x7e68a63fcdd84230ab4a4087bb2bc41e, 3, 1, 'Entrée de stock par intégration', '2020-10-19'),
(0x9a54c2ea1b664a19bc5fad7c4f11a028, 4, 1, 'Entrée de stock par intégration', '2020-11-29');

--
-- Déchargement des données de la table `lot`
--

INSERT INTO `lot` (`uuid`, `label`, `quantity`, `unit_cost`, `description`, `expiration_date`, `inventory_uuid`, `origin_uuid`, `is_assigned`) VALUES
(0x0b89e88d4cbb462ea5dad3dcf31f2a26, 'Q', 100, '0.5000', NULL, '2022-12-02', 0x6D93A100393211EBA0B954E1AD7439C7, 0x9a54c2ea1b664a19bc5fad7c4f11a028, 0),
(0x2bacb3bedf9b42fe896c11ad300f2dc5, 'Q', 100, '0.5000', NULL, '2022-10-13', 0x6D93A100393211EBA0B954E1AD7439C7, 0xc59ece8817b64d18b7316bf768325ff9, 0),
(0x605ecb0f6a8e49f79c197ddcd8da3324, 'Q', 200, '0.5000', NULL, '2022-12-01', 0x6D93A100393211EBA0B954E1AD7439C7, 0x7e68a63fcdd84230ab4a4087bb2bc41e, 0),
(0xa8f8d186889f42cfa9279a7c4d52d8d2, 'Q', 100, '0.5000', NULL, '2022-10-13', 0x6D93A100393211EBA0B954E1AD7439C7, 0xf5212fa19e2b48f2afd15c1d131b919d, 0);

--
-- Déchargement des données de la table `stock_movement`
--

INSERT INTO `stock_movement` (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `entity_uuid`, `description`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `reference`, `invoice_uuid`, `stock_requisition_uuid`, `period_id`, `created_at`) VALUES
(0x0c561f4aa07640e392cfe3104b019444, 0x835e996ad7374eaa9cc5d6850dd4f644, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x0b89e88d4cbb462ea5dad3dcf31f2a26, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-11-29 11:10:37', 15, '0.5000', 1, 1, 32, NULL, NULL, 202011, '2020-12-02 10:11:45'),
(0x100309076b12460d83e3f2ec8b8aefce, 0x67feeb5b8b1c454ebbcd0d8ab56ab1bb, 0x4341f89cd1eb47bd9527df9e13d2237c, 0xa8f8d186889f42cfa9279a7c4d52d8d2, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-05 14:55:43', 15, '0.5000', 1, 1, 6, NULL, NULL, 202010, '2020-10-13 13:59:46'),
(0x13dae9e9b50043d4a879bb1231120944, 0x468a21599eb14d77b6f698b15423bb6c, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x0b89e88d4cbb462ea5dad3dcf31f2a26, NULL, 'Entrée de stock par intégration', 13, '2020-11-29 11:08:21', 100, '0.5000', 0, 1, 30, NULL, NULL, 202011, '2020-12-02 10:09:03'),
(0x1676970c925d49c0a3ecd80069254c71, 0x07ecf74060c5456096dc3f74dc1cb862, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-24 15:12:01', 15, '0.5000', 1, 1, 22, NULL, NULL, 202010, '2020-12-01 14:14:53'),
(0x1c19476fc6134f2392199c871395c13f, 0xc869afba5a3045be974c7e70a1c853b5, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-20 15:12:01', 10, '0.5000', 1, 1, 19, NULL, NULL, 202010, '2020-12-01 14:13:07'),
(0x26004611119c4b80bda9a1071fa473e4, 0x457d5e4eb3c24b96b328fb64fd86528b, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, NULL, 'Entrée de stock par intégration', 13, '2020-10-19 15:11:11', 200, '0.5000', 0, 1, 17, NULL, NULL, 202010, '2020-12-01 14:11:56'),
(0x2fa8a329e1794605a6efb1a59cead26d, 0x76df3598887b4b4a92b426d90ddce750, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x2bacb3bedf9b42fe896c11ad300f2dc5, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-11 15:03:36', 15, '0.5000', 1, 1, 11, NULL, NULL, 202010, '2020-10-13 14:04:12'),
(0x31653bb4d4304c2a92fc594edbf251b6, 0xbab9a32b068740ccb5d272abf33c0c27, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-30 15:12:01', 10, '0.5000', 1, 1, 27, NULL, NULL, 202010, '2020-12-01 14:17:45'),
(0x32db26fb74f7487e84e4961d8d1c41b4, 0x475a7f4aa9824adc811091e16bd417ed, 0x4341f89cd1eb47bd9527df9e13d2237c, 0xa8f8d186889f42cfa9279a7c4d52d8d2, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-08 14:55:43', 10, '0.5000', 1, 1, 8, NULL, NULL, 202010, '2020-10-13 14:00:55'),
(0x35d1d48c60994fe5874d469afef26cec, 0x7df64043023440229a528f84960a39f8, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x2bacb3bedf9b42fe896c11ad300f2dc5, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-13 15:03:36', 20, '0.5000', 1, 1, 13, NULL, NULL, 202010, '2020-10-13 14:05:17'),
(0x39c9de3a36a748d2bcef4d36ea0993c9, 0x36514bbe414c4bbc82e8e7735eb67c8e, 0x4341f89cd1eb47bd9527df9e13d2237c, 0xa8f8d186889f42cfa9279a7c4d52d8d2, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-06 14:55:43', 10, '0.5000', 1, 1, 7, NULL, NULL, 202010, '2020-10-13 14:00:15'),
(0x3c83d94b3e67417a852c20e472d5ff40, 0xf31be3e80aa44e7b8269e65f2e92a38b, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-27 15:12:01', 15, '0.5000', 1, 1, 25, NULL, NULL, 202010, '2020-12-01 14:16:34'),
(0x4d7db7ab3ee2477b89f148afb0991654, 0x8199ced5776746fcada2635b42aefa32, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-22 15:12:01', 15, '0.5000', 1, 1, 20, NULL, NULL, 202010, '2020-12-01 14:13:52'),
(0x53400b31261a4f4fb85f6175e1bd755a, 0x1bbd32d0e62846c98dfe72016919a14e, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-26 15:12:01', 15, '0.5000', 1, 1, 24, NULL, NULL, 202010, '2020-12-01 14:16:00'),
(0x57d1a3f9d111480cb536fd66fb2cca69, 0xe7fe3a93b24c4be1a40ef1d005bec18b, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x0b89e88d4cbb462ea5dad3dcf31f2a26, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-11-29 11:10:37', 20, '0.5000', 1, 1, 31, NULL, NULL, 202011, '2020-12-02 10:11:21'),
(0x674de4c663c04900ba07a63343af8b41, 0xaa3958a6736e4adb89ff90fab02db527, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-19 15:12:01', 15, '0.5000', 1, 1, 18, NULL, NULL, 202010, '2020-12-01 14:12:34'),
(0x6ce21bbf954b4a19aa4b50105c6f10ef, 0xf95e5d9734c14d288018a077b7c29d1a, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x2bacb3bedf9b42fe896c11ad300f2dc5, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-15 15:09:14', 10, '0.5000', 1, 1, 14, NULL, NULL, 202010, '2020-12-01 14:09:56'),
(0x81af73ac05664193b0f7e6a48389fe87, 0x89210079806d4e91a2ee47a8d691445e, 0x4341f89cd1eb47bd9527df9e13d2237c, 0xa8f8d186889f42cfa9279a7c4d52d8d2, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-04 14:55:43', 10, '0.5000', 1, 1, 5, NULL, NULL, 202010, '2020-10-13 13:59:14'),
(0x8c53297407124c91adbb5a69f6c4f1dc, 0x14403e28123540b1b1ef4b40374696e8, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-29 15:12:01', 15, '0.5000', 1, 1, 26, NULL, NULL, 202010, '2020-12-01 14:17:16'),
(0x8d320f1bab2d4c5e9d3a65754847731f, 0xea303a48731c48a4a7364fc3c648d4f8, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-11-01 11:07:25', 45, '0.5000', 1, 1, 29, NULL, NULL, 202011, '2020-12-02 10:07:59'),
(0x9ca2b35708764852b006db621d6a3eaa, 0x91dd6d88bc624358a43c377896ca076c, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x2bacb3bedf9b42fe896c11ad300f2dc5, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-17 15:09:14', 5, '0.5000', 1, 1, 16, NULL, NULL, 202010, '2020-12-01 14:10:54'),
(0xa038c431151a4ec783c20346fc06f9aa, 0x3ab34287a5a24d77a705327de2d46fce, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-31 15:12:01', 15, '0.5000', 1, 1, 28, NULL, NULL, 202010, '2020-12-01 14:18:26'),
(0xa5e0e9f1c1f64106ba00b7149f20af08, 0x3e9f302ebe234fb680804a58763e083c, 0x4341f89cd1eb47bd9527df9e13d2237c, 0xa8f8d186889f42cfa9279a7c4d52d8d2, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-02 14:55:43', 10, '0.5000', 1, 1, 3, NULL, NULL, 202010, '2020-10-13 13:57:22'),
(0xb382fbbecd7243239cf59200a7933730, 0x358da8898203472a82181195ebbcc890, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x2bacb3bedf9b42fe896c11ad300f2dc5, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-16 15:09:14', 45, '0.5000', 1, 1, 15, NULL, NULL, 202010, '2020-12-01 14:10:23'),
(0xb5d72bc1af1949c29c6effc5307f5e2d, 0xac7bfd31a5054862bcc855364c9a2111, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x2bacb3bedf9b42fe896c11ad300f2dc5, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-12 15:03:36', 5, '0.5000', 1, 1, 12, NULL, NULL, 202010, '2020-10-13 14:04:42'),
(0xbfaa80bdcf51478dbc39f9dedfe6eb90, 0xe59b7703345f422d8012d2ec8ae308c4, 0x4341f89cd1eb47bd9527df9e13d2237c, 0xa8f8d186889f42cfa9279a7c4d52d8d2, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-09 14:55:43', 15, '0.5000', 1, 1, 9, NULL, NULL, 202010, '2020-10-13 14:01:37'),
(0xc45aaacbe518496a82e4fd178b07be2d, 0x780d2b1b10e54b66bab7527264402001, 0x4341f89cd1eb47bd9527df9e13d2237c, 0xa8f8d186889f42cfa9279a7c4d52d8d2, NULL, 'Entrée de stock par intégration', 13, '2020-10-01 14:53:32', 100, '0.5000', 0, 1, 1, NULL, NULL, 202010, '2020-10-13 13:54:23'),
(0xd9ddb04fa23e46a5a40feb0d5366474a, 0xb294be9710844a468817a704c31bc1d3, 0x4341f89cd1eb47bd9527df9e13d2237c, 0xa8f8d186889f42cfa9279a7c4d52d8d2, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-03 14:55:43', 15, '0.5000', 1, 1, 4, NULL, NULL, 202010, '2020-10-13 13:58:38'),
(0xdb7d473435984850aa158b43a3d0738e, 0x1fdf6a28e80544f59e0cc75d6af847c0, 0x4341f89cd1eb47bd9527df9e13d2237c, 0xa8f8d186889f42cfa9279a7c4d52d8d2, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-01 14:55:43', 15, '0.5000', 1, 1, 2, NULL, NULL, 202010, '2020-10-13 13:56:48'),
(0xdbf4d6172eb34ae5b97114ed6c1dd1c1, 0xfd34ceb3e19c41a482211ffcf2656c0d, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x2bacb3bedf9b42fe896c11ad300f2dc5, NULL, 'Entrée de stock par intégration', 13, '2020-10-11 15:01:59', 100, '0.5000', 0, 1, 10, NULL, NULL, 202010, '2020-10-13 14:03:02'),
(0xdedd5f6b390a4696842e46230807ee83, 0x0a9bf0af1db24b11b378a63c6106001f, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-23 15:12:01', 20, '0.5000', 1, 1, 21, NULL, NULL, 202010, '2020-12-01 14:14:16'),
(0xf1f947806f644e95a54cab60f65a2685, 0x45a5d97e84ce4d019400b49b59f21e98, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x605ecb0f6a8e49f79c197ddcd8da3324, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-10-25 15:12:01', 10, '0.5000', 1, 1, 23, NULL, NULL, 202010, '2020-12-01 14:15:24'),
(0xfed53915dbe84ee3af7c08db8f842c07, 0x51b831a221f0484da9870a17a96ec9fa, 0x4341f89cd1eb47bd9527df9e13d2237c, 0x0b89e88d4cbb462ea5dad3dcf31f2a26, 0x9a7a281c4c414850a96eef942b2d0259, 'Distribution vers le service SERVICE Y à partir du dépôt MAGASIN : Distribution vers un service', 10, '2020-12-01 13:48:06', 65, '0.5000', 1, 1, 33, NULL, NULL, 202012, '2020-12-02 12:48:55');

COMMIT;

--
-- Compute quantities of all inventories and write into stock_movement_status table
--
CALL zRecomputeStockMovementStatus();
