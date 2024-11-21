/* migration script from the version 1.14.0 to the next */

/*
@jeremielodi
2020-08-06
rename all foreign key constraints
*/

-- DROP all foreign keys from a table

-- usage : CALL drop_constraints('account');

DELIMITER $$

DROP PROCEDURE IF EXISTS `drop_constraints`$$
CREATE   PROCEDURE `drop_constraints`(IN _table_name VARCHAR(100))
BEGIN
DECLARE _constraint_name VARCHAR(100);

DECLARE done BOOLEAN;
DECLARE curs1 CURSOR FOR
   SELECT CONSTRAINT_NAME
     FROM
      INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = _table_name;


DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

OPEN curs1;
  read_loop: LOOP
  FETCH curs1 INTO _constraint_name;
    IF done THEN
      LEAVE read_loop;
    END IF;

    SET @drop_foreign_key =  CONCAT('ALTER TABLE ', _table_name, ' DROP FOREIGN KEY ', _constraint_name);
    PREPARE drop_query FROM @drop_foreign_key;
    EXECUTE drop_query;

    END LOOP;
CLOSE curs1;
END$$
DELIMITER ;


    SET foreign_key_checks = 0;

    CALL drop_constraints('account');
    ALTER TABLE `account`
    ADD CONSTRAINT `account__account_type` FOREIGN KEY (`type_id`) REFERENCES `account_type` (`id`),
    ADD CONSTRAINT `account__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
    ADD CONSTRAINT `account__reference` FOREIGN KEY (`reference_id`) REFERENCES `reference` (`id`);

    CALL drop_constraints('account_type');
    ALTER TABLE `account_type` ADD
    CONSTRAINT `acc_type__acc_category` FOREIGN KEY (`account_category_id`) REFERENCES `account_category` (`id`);

    CALL drop_constraints('account_reference_item');
    ALTER TABLE `account_reference_item`
    ADD CONSTRAINT `acc_ref_item__acc_ref` FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`),
    ADD CONSTRAINT `acc_ref_item__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`);

    CALL drop_constraints('patient_assignment');
    ALTER TABLE `patient_assignment`
    ADD CONSTRAINT `patient_assignment__patient_group` FOREIGN KEY (`patient_group_uuid`) REFERENCES `patient_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `patient_assignment__patient` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;


    CALL drop_constraints('invoicing_fee');
    ALTER TABLE `invoicing_fee`
    ADD  CONSTRAINT `invoicing_fee__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`);

    CALL drop_constraints('budget');
    ALTER TABLE `budget`
    ADD CONSTRAINT `budget__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
    ADD CONSTRAINT `budget__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`);

    CALL drop_constraints('cash');
    ALTER TABLE `cash`
    ADD  CONSTRAINT `cash__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
    ADD CONSTRAINT `cash__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
    ADD CONSTRAINT `cash__debtor` FOREIGN KEY (`debtor_uuid`) REFERENCES `debtor` (`uuid`),
    ADD CONSTRAINT `cash__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    ADD CONSTRAINT `cash__cashbox` FOREIGN KEY (`cashbox_id`) REFERENCES `cash_box` (`id`);

    CALL drop_constraints('config_rubric_item');
    ALTER TABLE `config_rubric_item`
    ADD CONSTRAINT `config_rubric_item__config_rubric` FOREIGN KEY (`config_rubric_id`) REFERENCES `config_rubric` (`id`),
    ADD CONSTRAINT `config_rubric_item__rubric_payroll` FOREIGN KEY (`rubric_payroll_id`) REFERENCES `rubric_payroll` (`id`);



    CALL drop_constraints('cash_item');
    ALTER TABLE `cash_item`
    ADD CONSTRAINT `cash_item__cash`FOREIGN KEY (`cash_uuid`) REFERENCES `cash` (`uuid`) ON DELETE CASCADE;

    CALL drop_constraints('cash_box');
    ALTER TABLE `cash_box`
    ADD CONSTRAINT `cashbox__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`);

    CALL drop_constraints('payroll_configuration');
    ALTER TABLE `payroll_configuration`
    ADD  CONSTRAINT `payroll_conf__conf_rubric` FOREIGN KEY (`config_rubric_id`) REFERENCES `config_rubric` (`id`),
    ADD CONSTRAINT  `payroll_conf__conf_account` FOREIGN KEY (`config_accounting_id`) REFERENCES `config_accounting` (`id`),
    ADD CONSTRAINT  `payroll_conf__conf_weekend`FOREIGN KEY (`config_weekend_id`) REFERENCES `weekend_config` (`id`),
    ADD CONSTRAINT `payroll_conf__conf_employee` FOREIGN KEY (`config_employee_id`) REFERENCES `config_employee` (`id`);

    CALL drop_constraints('rubric_payroll');
    ALTER TABLE `rubric_payroll`
    ADD CONSTRAINT `rubric_payroll__debtor_account` FOREIGN KEY (`debtor_account_id`) REFERENCES `account` (`id`),
    ADD CONSTRAINT `rubric_payroll__expense_account` FOREIGN KEY (`expense_account_id`) REFERENCES `account` (`id`);
/*
    CALL drop_constraints('rubric_payroll_item');
    ALTER TABLE `rubric_payroll_item`
    ADD CONSTRAINT  `rubric_pay_item__rubric_pay1` FOREIGN KEY (`rubric_payroll_id`) REFERENCES `rubric_payroll` (`id`),
    ADD CONSTRAINT  `rubric_pay_item__rubric_pay2` FOREIGN KEY (`item_id`) REFERENCES `rubric_payroll` (`id`);

*/
    CALL drop_constraints('cash_box_account_currency');
    ALTER TABLE `cash_box_account_currency`
    ADD CONSTRAINT `cashbox_acc_currency__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
    ADD  CONSTRAINT `cashbox_acc_currency__cashbox` FOREIGN KEY (`cash_box_id`) REFERENCES `cash_box` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT `cashbox_acc_currency__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
    ADD CONSTRAINT `cashbox_acc_currency__transfert_acc` FOREIGN KEY (`transfer_account_id`) REFERENCES `account` (`id`);


    CALL drop_constraints('config_accounting');
    ALTER TABLE `config_accounting`
    ADD CONSTRAINT `config_acc__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`);


    CALL drop_constraints('config_week_days');
    ALTER TABLE `config_week_days`
    ADD CONSTRAINT `config_week_days__weekend_config` FOREIGN KEY (`weekend_config_id`) REFERENCES `weekend_config` (`id`);

    CALL drop_constraints('creditor');
    ALTER TABLE `creditor`
    ADD   CONSTRAINT `creditor__creditor_group` FOREIGN KEY (`group_uuid`) REFERENCES `creditor_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

    CALL drop_constraints('creditor_group');
    ALTER TABLE `creditor_group`
    ADD CONSTRAINT `creditor_group__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    add CONSTRAINT `creditor_group__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;


    CALL drop_constraints('debtor');
    ALTER TABLE `debtor`
    ADD
    CONSTRAINT `debtor__debtor_group` FOREIGN KEY (`group_uuid`) REFERENCES `debtor_group` (`uuid`) ON DELETE CASCADE;

    CALL drop_constraints('debtor_group');
    ALTER TABLE `debtor_group`
    ADD CONSTRAINT `debtor_group__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `debtor_group__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `debtor_group__location` FOREIGN KEY (`location_id`) REFERENCES `village` (`uuid`),
    ADD CONSTRAINT `debtor_group__pricelist` FOREIGN KEY (`price_list_uuid`) REFERENCES `price_list` (`uuid`);


    CALL drop_constraints('debtor_group_invoicing_fee');
    ALTER TABLE `debtor_group_invoicing_fee`
    ADD CONSTRAINT `ebtor_group_invoicing_fee__invoicing_fee` FOREIGN KEY (`invoicing_fee_id`) REFERENCES `invoicing_fee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `ebtor_group_invoicing_fee__debtor_group` FOREIGN KEY (`debtor_group_uuid`) REFERENCES `debtor_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;


    CALL drop_constraints('debtor_group_history');
    ALTER TABLE `debtor_group_history`
    ADD CONSTRAINT `debtor_group_history__debtor` FOREIGN KEY (`debtor_uuid`) REFERENCES `debtor` (`uuid`),
    ADD CONSTRAINT `debtor_group_history__prev_debtor_group` FOREIGN KEY (`previous_debtor_group`) REFERENCES `debtor_group` (`uuid`),
    ADD CONSTRAINT `debtor_group_history__next_debtor_group` FOREIGN KEY (`next_debtor_group`) REFERENCES `debtor_group` (`uuid`),
    ADD CONSTRAINT `debtor_group_history__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

    CALL drop_constraints('debtor_group_subsidy');
    ALTER TABLE `debtor_group_subsidy`
    ADD CONSTRAINT `debtorgroup_subsidy__subsidy` FOREIGN KEY (`subsidy_id`) REFERENCES `subsidy` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `debtorgroup_subsidy__debtor_group` FOREIGN KEY (`debtor_group_uuid`) REFERENCES `debtor_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;


    CALL drop_constraints('discount');
    ALTER TABLE `discount`
    ADD CONSTRAINT `discount__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `discount__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`);


    CALL drop_constraints('employee');
    ALTER TABLE `employee`
    ADD CONSTRAINT  `employee__fonction` FOREIGN KEY (`fonction_id`) REFERENCES `fonction` (`id`),
    ADD CONSTRAINT  `employee__service` FOREIGN KEY (`service_uuid`) REFERENCES `service` (`uuid`),
    ADD CONSTRAINT  `employee__creditor` FOREIGN KEY (`creditor_uuid`) REFERENCES `creditor` (`uuid`),
    ADD CONSTRAINT  `employee__grade` FOREIGN KEY (`grade_uuid`) REFERENCES `grade` (`uuid`),
    ADD CONSTRAINT `employee__patient` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`);

    CALL drop_constraints('rubric_paiement');
    ALTER TABLE `rubric_paiement`
    ADD CONSTRAINT  `rubric_paiement__paiement` FOREIGN KEY (`paiement_uuid`) REFERENCES `paiement` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT  `rubric_paiement__rubric_payroll` FOREIGN KEY (`rubric_payroll_id`) REFERENCES `rubric_payroll` (`id`);



    CALL drop_constraints('employee_advantage');
    ALTER TABLE `employee_advantage`
    ADD CONSTRAINT `employee_advantage__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`),
    ADD CONSTRAINT `employee_advantage__rubric_payroll` FOREIGN KEY (`rubric_payroll_id`) REFERENCES `rubric_payroll` (`id`);

    CALL drop_constraints('enterprise');
    ALTER TABLE `enterprise`
    ADD CONSTRAINT `enterprise__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
    ADD CONSTRAINT `enterprise__location` FOREIGN KEY (`location_id`) REFERENCES `village` (`uuid`),
    ADD CONSTRAINT `enterprise__gain_account` FOREIGN KEY (`gain_account_id`) REFERENCES `account` (`id`),
    ADD CONSTRAINT `enterprise__loss_account` FOREIGN KEY (`loss_account_id`) REFERENCES `account` (`id`);



    CALL drop_constraints('enterprise_setting');
    ALTER TABLE `enterprise_setting`
    ADD  CONSTRAINT `enterprise_setting__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`);

    CALL drop_constraints('exchange_rate');
    ALTER TABLE `exchange_rate`
    ADD CONSTRAINT `exchange_rate__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
    ADD CONSTRAINT `exchange_rate__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`);


    CALL drop_constraints('fiscal_year');
    ALTER TABLE `fiscal_year`
    ADD CONSTRAINT `fiscal_year__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
    ADD CONSTRAINT `fiscal_year__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE;


    CALL drop_constraints('general_ledger');
    ALTER TABLE `general_ledger`
    ADD CONSTRAINT `general_ledger__fiscal_year` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`),
    ADD CONSTRAINT `general_ledger__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
    ADD CONSTRAINT `general_ledger__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON UPDATE CASCADE,
    ADD CONSTRAINT `general_ledger__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE,
    ADD CONSTRAINT `general_ledger__account`  FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
    ADD CONSTRAINT `general_ledger__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE;


    CALL drop_constraints('holiday');
    ALTER TABLE `holiday`
    ADD  CONSTRAINT `holiday__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`);

    CALL drop_constraints('holiday_paiement');
    ALTER TABLE `holiday_paiement`
    ADD CONSTRAINT `holiday_paiement__paiment` FOREIGN KEY (`paiement_uuid`) REFERENCES `paiement` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `holiday_paiement__holiday` FOREIGN KEY (`holiday_id`) REFERENCES `holiday` (`id`);


    CALL drop_constraints('offday_paiement');
    ALTER TABLE `offday_paiement`
    ADD  CONSTRAINT `offday_paiement__paiment` FOREIGN KEY (`paiement_uuid`) REFERENCES `paiement` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD  CONSTRAINT `offday_paiement__offday` FOREIGN KEY (`offday_id`) REFERENCES `offday` (`id`);

    CALL drop_constraints('inventory');
    ALTER TABLE `inventory`
    ADD CONSTRAINT `inventory__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
    ADD CONSTRAINT `inventory__inventory_group` FOREIGN KEY (`group_uuid`) REFERENCES `inventory_group` (`uuid`),
    ADD CONSTRAINT `inventory__enventory_unit` FOREIGN KEY (`unit_id`) REFERENCES `inventory_unit` (`id`),
    ADD CONSTRAINT `inventory__inventory_type` FOREIGN KEY (`type_id`) REFERENCES `inventory_type` (`id`);


    CALL drop_constraints('paiement');
    ALTER TABLE `paiement`
    ADD CONSTRAINT `paiement__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`),
    ADD CONSTRAINT `paiement__payroll_configuration`  FOREIGN KEY (`payroll_configuration_id`) REFERENCES `payroll_configuration` (`id`),
    ADD CONSTRAINT `paiement__currency`  FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
    ADD CONSTRAINT `paiement__pay_status`  FOREIGN KEY (`status_id`) REFERENCES `paiement_status` (`id`);

    CALL drop_constraints('stage_payment_indice');
    ALTER TABLE `stage_payment_indice`
    ADD CONSTRAINT `stage_pay_indice__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`),
    ADD CONSTRAINT `stage_pay_indice__rubric` FOREIGN KEY (`rubric_id`) REFERENCES `rubric_payroll` (`id`),
    ADD CONSTRAINT `stage_pay_indice__payroll_config` FOREIGN KEY (`payroll_configuration_id`) REFERENCES `payroll_configuration` (`id`),
    ADD CONSTRAINT `stage_pay_indice__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`);

    CALL drop_constraints('price_list');
    ALTER TABLE `price_list`
    ADD  CONSTRAINT `price_list__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`);

    CALL drop_constraints('price_list_item');
    ALTER TABLE `price_list_item`
    ADD CONSTRAINT `price_list_item__price_list` FOREIGN KEY (`price_list_uuid`) REFERENCES `price_list` (`uuid`) ON DELETE CASCADE,
    ADD CONSTRAINT `price_list_item__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`) ON DELETE CASCADE;


    CALL drop_constraints('patient');
    ALTER TABLE `patient`
    ADD CONSTRAINT `patient__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
    ADD CONSTRAINT `patient__debtor` FOREIGN KEY (`debtor_uuid`) REFERENCES `debtor` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `patient__current_location` FOREIGN KEY (`current_location_id`) REFERENCES `village` (`uuid`) ON UPDATE CASCADE,
    ADD CONSTRAINT `patient__origin_location` FOREIGN KEY (`origin_location_id`) REFERENCES `village` (`uuid`) ON UPDATE CASCADE,
    ADD CONSTRAINT `patient__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

    CALL drop_constraints('patient_document');
    ALTER TABLE `patient_document`
    ADD CONSTRAINT `patient_document__patient` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `patient_document__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);


    CALL drop_constraints('patient_group');
    ALTER TABLE `patient_group`
        ADD CONSTRAINT `patient_group__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
        ADD CONSTRAINT `patient_group__pricelist` FOREIGN KEY (`price_list_uuid`) REFERENCES `price_list` (`uuid`) ON DELETE SET NULL ON UPDATE CASCADE;


    CALL drop_constraints('patient_group_invoicing_fee');
    ALTER TABLE `patient_group_invoicing_fee`
    ADD CONSTRAINT `patient_group_inv_fee__iv_fee` FOREIGN KEY (`invoicing_fee_id`) REFERENCES `invoicing_fee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `patient_group_inv_fee__patient_group` FOREIGN KEY (`patient_group_uuid`) REFERENCES `patient_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;


    CALL drop_constraints('patient_group_subsidy');
    ALTER TABLE `patient_group_subsidy`
    ADD CONSTRAINT `patient_group_subsidy__subsidy` FOREIGN KEY (`subsidy_id`) REFERENCES `subsidy` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `patient_group_subsidy__patient_group` FOREIGN KEY (`patient_group_uuid`) REFERENCES `patient_group` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

    CALL drop_constraints('patient_visit');
    ALTER TABLE `patient_visit`
    ADD CONSTRAINT `patient_visit__patient` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `patient_visit__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `patient_visit__start_diagnosis` FOREIGN KEY (`start_diagnosis_id`) REFERENCES `icd10` (`id`) ON UPDATE CASCADE,
    ADD CONSTRAINT `patient_visit__end_diagnosis`FOREIGN KEY (`end_diagnosis_id`) REFERENCES `icd10` (`id`) ON UPDATE CASCADE;

    CALL drop_constraints('patient_visit_service');
    ALTER TABLE `patient_visit_service`
    ADD CONSTRAINT `patient_visit_service__patient_visit` FOREIGN KEY (`patient_visit_uuid`) REFERENCES `patient_visit` (`uuid`) ON UPDATE CASCADE,
    ADD CONSTRAINT `patient_visit_service__service` FOREIGN KEY (`service_uuid`) REFERENCES `service` (`uuid`) ON UPDATE CASCADE;


    CALL drop_constraints('patient_hospitalization');
    ALTER TABLE `patient_hospitalization`
    ADD CONSTRAINT `patient_hosp__patient_visit` FOREIGN KEY (`patient_visit_uuid`) REFERENCES `patient_visit` (`uuid`) ON UPDATE CASCADE,
    ADD CONSTRAINT `patient_hosp__patient`  FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`) ON UPDATE CASCADE,
    ADD CONSTRAINT `patient_hosp__room`  FOREIGN KEY (`room_uuid`) REFERENCES `room` (`uuid`) ON UPDATE CASCADE,
    ADD CONSTRAINT `patient_hosp__bed`  FOREIGN KEY (`bed_id`) REFERENCES `bed` (`id`) ON UPDATE CASCADE;



    CALL drop_constraints('period');
    ALTER TABLE `period`
    ADD CONSTRAINT `period__fiscal_year` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`);

    CALL drop_constraints('period_total');
    ALTER TABLE `period_total`
    ADD CONSTRAINT `period_total__fiscal_year` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`),
    ADD CONSTRAINT `period_total__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
    ADD CONSTRAINT `period_total__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`),
    ADD CONSTRAINT `period_total__period`FOREIGN KEY (`period_id`) REFERENCES `period` (`id`);


    CALL drop_constraints('permission');
    ALTER TABLE `permission`
    ADD CONSTRAINT `permission__unit` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `permission__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

    CALL drop_constraints('cron_email_report');
    ALTER TABLE `cron_email_report`
    ADD  CONSTRAINT `cron_email_report__entity_group` FOREIGN KEY (`entity_group_uuid`) REFERENCES `entity_group` (`uuid`) ON UPDATE CASCADE;


    CALL drop_constraints('posting_journal');
    ALTER TABLE `posting_journal`
    ADD CONSTRAINT `pg__fiscal_year` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year` (`id`),
    ADD CONSTRAINT `pg__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
    ADD CONSTRAINT `pg__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON UPDATE CASCADE,
    ADD CONSTRAINT `pg__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
    ADD CONSTRAINT `pg__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE,
    ADD CONSTRAINT `pg__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE;


    CALL drop_constraints('project');
    ALTER TABLE `project`
    ADD CONSTRAINT `project__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `enterprise` (`id`);



    CALL drop_constraints('project_permission');
    ALTER TABLE `project_permission`
    ADD CONSTRAINT `project_permission__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
    ADD CONSTRAINT `project_permission__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

    CALL drop_constraints('province');
    ALTER TABLE `province` ADD CONSTRAINT `province__country` FOREIGN KEY (`country_uuid`) REFERENCES `country` (`uuid`);



    CALL drop_constraints('purchase');
    ALTER TABLE `purchase`
    ADD CONSTRAINT `purchase__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
    ADD CONSTRAINT `purchase__supplier` FOREIGN KEY (`supplier_uuid`) REFERENCES `supplier` (`uuid`),
    ADD CONSTRAINT `purchase__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    ADD CONSTRAINT `purchase__status` FOREIGN KEY (`status_id`) REFERENCES `purchase_status` (`id`);


    CALL drop_constraints('purchase_item');
    ALTER TABLE `purchase_item`
    ADD CONSTRAINT `purchase_item__purchase` FOREIGN KEY (`purchase_uuid`) REFERENCES `purchase` (`uuid`) ON DELETE CASCADE,
    ADD CONSTRAINT `purchase_item__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`);

    CALL drop_constraints('reference_group');
    ALTER TABLE `reference_group` ADD CONSTRAINT `reference_group__section_bilan` FOREIGN KEY (`section_bilan_id`) REFERENCES `section_bilan` (`id`);

    CALL drop_constraints('saved_report');
    ALTER TABLE `saved_report`
    ADD CONSTRAINT  `saved_report__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    ADD CONSTRAINT  `saved_report__report` FOREIGN KEY (`report_id`) REFERENCES `report` (`id`);

    CALL drop_constraints('invoice');
    ALTER TABLE `invoice`
    ADD CONSTRAINT `invoice__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
    ADD CONSTRAINT `invoice__debtor` FOREIGN KEY (`debtor_uuid`) REFERENCES `debtor` (`uuid`),
    ADD CONSTRAINT `invoice__service` FOREIGN KEY (`service_uuid`) REFERENCES `service` (`uuid`),
    ADD CONSTRAINT `invoice__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

    CALL drop_constraints('invoice_invoicing_fee');
    ALTER TABLE `invoice_invoicing_fee`
    ADD CONSTRAINT `invoice_invoicing_fee__invoice` FOREIGN KEY (`invoice_uuid`) REFERENCES `invoice` (`uuid`) ON DELETE CASCADE,
    ADD CONSTRAINT `invoice_invoicing_fee__invoicing_fee` FOREIGN KEY (`invoicing_fee_id`) REFERENCES `invoicing_fee` (`id`);


    CALL drop_constraints('invoice_item');
    ALTER TABLE `invoice_item`
    ADD CONSTRAINT `invoice_item__invoice` FOREIGN KEY (`invoice_uuid`) REFERENCES `invoice` (`uuid`) ON DELETE CASCADE,
    ADD CONSTRAINT `invoice_item__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`);


    CALL drop_constraints('invoice_subsidy');
    ALTER TABLE `invoice_subsidy`
    ADD CONSTRAINT `invoice_subsidy__invoice` FOREIGN KEY (`invoice_uuid`) REFERENCES `invoice` (`uuid`) ON DELETE CASCADE,
    ADD CONSTRAINT `invoice_subsidy__subsidy` FOREIGN KEY (`subsidy_id`) REFERENCES `subsidy` (`id`);

    CALL drop_constraints('sector');
    ALTER TABLE `sector` ADD CONSTRAINT `sector__province` FOREIGN KEY (`province_uuid`) REFERENCES `province` (`uuid`);


    CALL drop_constraints('service');
    ALTER TABLE `service` ADD CONSTRAINT `service__enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES enterprise (`id`);


    CALL drop_constraints('ward');
    ALTER TABLE `ward` ADD  CONSTRAINT `ward__service` FOREIGN KEY (`service_uuid`) REFERENCES `service` (`uuid`);


    CALL drop_constraints('room');
    ALTER TABLE `room`
    ADD CONSTRAINT `room__ward` FOREIGN KEY (`ward_uuid`) REFERENCES ward (`uuid`),
    ADD CONSTRAINT `room__room_type` FOREIGN KEY (`room_type_id`) REFERENCES room_type (`id`);

    CALL drop_constraints('bed');
    ALTER TABLE `bed`
    ADD CONSTRAINT `bed__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
    ADD CONSTRAINT `bed__room` FOREIGN KEY (`room_uuid`) REFERENCES room (`uuid`);

    CALL drop_constraints('subsidy');
    ALTER TABLE `subsidy` ADD CONSTRAINT `subsidy__account`  FOREIGN KEY (`account_id`) REFERENCES `account` (`id`);

    CALL drop_constraints('supplier');
    ALTER TABLE `supplier` ADD CONSTRAINT `supplier__creditor` FOREIGN KEY (`creditor_uuid`) REFERENCES `creditor` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

    CALL drop_constraints('taxe_ipr');
    ALTER TABLE `taxe_ipr` ADD CONSTRAINT `taxe_ipr__currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON UPDATE CASCADE;


    CALL drop_constraints('taxe_ipr_configuration');
    ALTER TABLE `taxe_ipr_configuration` ADD CONSTRAINT `taxe_ipr_config__taxe_ipr` FOREIGN KEY (`taxe_ipr_id`) REFERENCES `taxe_ipr` (`id`) ON UPDATE CASCADE;

    CALL drop_constraints('role_actions');
    ALTER TABLE `role_actions` ADD CONSTRAINT `role_actions__action` FOREIGN KEY (`actions_id`) REFERENCES `actions` (`id`) ON UPDATE CASCADE,
    ADD CONSTRAINT `role_actions__role` FOREIGN KEY (`role_uuid`) REFERENCES `role` (`uuid`) ON UPDATE CASCADE  ON DELETE CASCADE;

    CALL drop_constraints('user_role');
    ALTER TABLE `user_role`
    ADD CONSTRAINT `user_role__role` FOREIGN KEY (`role_uuid`) REFERENCES `role` (`uuid`) ON UPDATE CASCADE,
    ADD CONSTRAINT `user_role__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

    CALL drop_constraints('role_unit');
    ALTER TABLE `role_unit`
    ADD CONSTRAINT `role_unit__role` FOREIGN KEY (`role_uuid`) REFERENCES `role` (`uuid`) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT `role_unit__unit`  FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON UPDATE CASCADE;


    CALL drop_constraints('village');
    ALTER TABLE `village`
     ADD CONSTRAINT `village__sector` FOREIGN KEY (`sector_uuid`) REFERENCES `sector` (`uuid`);

    CALL drop_constraints('voucher');
    ALTER TABLE `voucher`
    ADD CONSTRAINT `voucher__project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
    ADD CONSTRAINT `voucher__currency`  FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
    ADD CONSTRAINT `voucher__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

    CALL drop_constraints('voucher_item');
     ALTER TABLE `voucher_item`
    ADD CONSTRAINT `voucher_item__account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
    ADD CONSTRAINT `voucher_item__voucher` FOREIGN KEY (`voucher_uuid`) REFERENCES `voucher` (`uuid`) ON DELETE CASCADE;

    CALL drop_constraints('lot');
    ALTER TABLE `lot` ADD CONSTRAINT `lot__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`);

    CALL drop_constraints('stock_assign');
    ALTER TABLE `stock_assign`
    ADD CONSTRAINT `stock_assign__lot` FOREIGN KEY (`lot_uuid`) REFERENCES `lot` (`uuid`),
    ADD CONSTRAINT `stock_assign__entity` FOREIGN KEY (`entity_uuid`) REFERENCES `entity` (`uuid`),
    ADD CONSTRAINT `stock_assign__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`);

    CALL drop_constraints('stock_requisition');
    ALTER TABLE `stock_requisition` ADD CONSTRAINT `stock_requisition__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`);

    CALL drop_constraints('stock_requisition_item');
    ALTER TABLE `stock_requisition_item` ADD  CONSTRAINT `stock_req_item__stock_req_item` FOREIGN KEY (`requisition_uuid`) REFERENCES `stock_requisition` (`uuid`);


    CALL drop_constraints('stock_movement');
    ALTER TABLE `stock_movement`
    ADD CONSTRAINT `stock_movement__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`),
    ADD CONSTRAINT `stock_movement__lot` FOREIGN KEY (`lot_uuid`) REFERENCES `lot` (`uuid`),
    ADD CONSTRAINT `stock_movement__flux` FOREIGN KEY (`flux_id`) REFERENCES `flux` (`id`),
    ADD CONSTRAINT `stock_movement__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    ADD CONSTRAINT `stock_movement__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`);

    CALL drop_constraints('stock_consumption');
    ALTER TABLE `stock_consumption`
    ADD CONSTRAINT `stock_consumption__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`),
    ADD CONSTRAINT `stock_consumption__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`),
    ADD CONSTRAINT `stock_consumption__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`);

    CALL drop_constraints('transaction_history');
    ALTER TABLE `transaction_history` ADD  CONSTRAINT `transaction_history__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);


    CALL drop_constraints('depot_permission');
    ALTER TABLE `depot_permission`
    ADD CONSTRAINT `depot_permission__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`),
    ADD CONSTRAINT `depot_permission__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);


    CALL drop_constraints('cashbox_permission');
    ALTER TABLE `cashbox_permission`
    ADD CONSTRAINT `cashbox_permission__cashbox` FOREIGN KEY (`cashbox_id`) REFERENCES `cash_box` (`id`),
    ADD CONSTRAINT `cashbox_permission__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);


    CALL drop_constraints('config_employee_item');
    ALTER TABLE `config_employee_item`
    ADD CONSTRAINT `config_employee_item__config_employee` FOREIGN KEY (`config_employee_id`) REFERENCES `config_employee` (`id`),
    ADD CONSTRAINT `config_employee_item__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`);



    CALL drop_constraints('reference_fee_center');
    ALTER TABLE `reference_fee_center`
    ADD CONSTRAINT `reference_fee_center__fee_center` FOREIGN KEY (`fee_center_id`) REFERENCES `fee_center` (`id`),
    ADD CONSTRAINT `reference_fee_center__account_ref` FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`);

    CALL drop_constraints('fee_center_distribution');
    ALTER TABLE `fee_center_distribution`
    ADD CONSTRAINT `fee_center_distribution__general_ledger` FOREIGN KEY (`row_uuid`) REFERENCES `general_ledger` (`uuid`),
    ADD CONSTRAINT `fee_center_distribution__account`  FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
    ADD CONSTRAINT `fee_center_distribution__auxiliary_fee_center`  FOREIGN KEY (`auxiliary_fee_center_id`) REFERENCES `fee_center` (`id`),
    ADD CONSTRAINT `fee_center_distribution__principal_fee_center`  FOREIGN KEY (`principal_fee_center_id`) REFERENCES `fee_center` (`id`),
    ADD CONSTRAINT `fee_center_distribution__user`  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE;



    CALL drop_constraints('service_fee_center');
    ALTER TABLE `service_fee_center`
    ADD CONSTRAINT `service_fee_center__service` FOREIGN KEY (`service_uuid`) REFERENCES `service` (`uuid`),
    ADD CONSTRAINT `service_fee_center__fee_center`  FOREIGN KEY (`fee_center_id`) REFERENCES `fee_center` (`id`);


    CALL drop_constraints('distribution_key');
    ALTER TABLE `distribution_key`
    ADD CONSTRAINT `distribution_key__auxiliary_fc` FOREIGN KEY (`auxiliary_fee_center_id`) REFERENCES `fee_center` (`id`),
    ADD CONSTRAINT `distribution_key__principal_fc` FOREIGN KEY (`principal_fee_center_id`) REFERENCES `fee_center` (`id`),
    ADD CONSTRAINT `distribution_key__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

    CALL drop_constraints('indicator');
    ALTER TABLE `indicator`
    ADD CONSTRAINT `indicator__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`) ON UPDATE CASCADE,
    ADD CONSTRAINT `indicator__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
    ADD CONSTRAINT `indicator__indicator_status` FOREIGN KEY (`status_id`) REFERENCES `indicator_status` (`id`) ON UPDATE CASCADE,
    ADD CONSTRAINT `indicator__indicator_type` FOREIGN KEY (`type_id`) REFERENCES `indicator_type` (`id`) ON UPDATE CASCADE;


    CALL drop_constraints('hospitalization_indicator');
    ALTER TABLE `hospitalization_indicator` ADD   CONSTRAINT `hosp_indicator__indicator` FOREIGN KEY (`indicator_uuid`) REFERENCES `indicator` (`uuid`) ON UPDATE CASCADE;


    CALL drop_constraints('staff_indicator');
    ALTER TABLE `staff_indicator` ADD CONSTRAINT `staff_indicator__indicator` FOREIGN KEY (`indicator_uuid`) REFERENCES `indicator` (`uuid`) ON UPDATE CASCADE;


    CALL drop_constraints('finance_indicator');
    ALTER TABLE `finance_indicator` ADD CONSTRAINT `finance_indicator__indicator` FOREIGN KEY (`indicator_uuid`) REFERENCES `indicator` (`uuid`) ON UPDATE CASCADE;

    CALL drop_constraints('break_even_reference');
    ALTER TABLE `break_even_reference` ADD
    CONSTRAINT `break_even_ref__acc_ref` FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`);


    CALL drop_constraints('inventory_log');
    ALTER TABLE `inventory_log` ADD CONSTRAINT `inventory_log__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);



    CALL drop_constraints('staffing_indice');
    ALTER TABLE `staffing_indice`
    ADD CONSTRAINT `staffing_indice__employee` FOREIGN KEY (`employee_uuid`) REFERENCES `employee` (`uuid`),
    ADD CONSTRAINT `staffing_indice__fonction` FOREIGN KEY (`fonction_id`) REFERENCES `fonction` (`id`),
    ADD CONSTRAINT `staffing_indice__grade` FOREIGN KEY (`grade_uuid`) REFERENCES `grade` (`uuid`);


    CALL drop_constraints('staffing_grade_indice');
    ALTER TABLE `staffing_grade_indice` ADD CONSTRAINT `staffing_grade_indice__grade` FOREIGN KEY (`grade_uuid`) REFERENCES `grade` (`uuid`);


    CALL drop_constraints('staffing_function_indice');
     ALTER TABLE `staffing_function_indice`
     ADD CONSTRAINT `staffing_function_indice__fct`  FOREIGN KEY (`fonction_id`) REFERENCES `fonction` (`id`);

    CALL drop_constraints('staffing_indice_parameters');
     ALTER TABLE `staffing_indice_parameters`
     ADD  CONSTRAINT `staffing_indice_param__payroll_config` FOREIGN KEY (`payroll_configuration_id`) REFERENCES `payroll_configuration` (`id`);

    CALL drop_constraints('survey_form');
    ALTER TABLE `survey_form` ADD CONSTRAINT `survey_form__data_collector_management` FOREIGN KEY (`data_collector_management_id`) REFERENCES `data_collector_management` (`id`);

    CALL drop_constraints('survey_data');
    ALTER TABLE `survey_data`
    ADD  CONSTRAINT `survey_data__data_collector_management` FOREIGN KEY (`data_collector_management_id`) REFERENCES `data_collector_management` (`id`),
    ADD  CONSTRAINT `survey_data__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

    CALL drop_constraints('survey_data_item');
    ALTER TABLE `survey_data_item`
    ADD CONSTRAINT `survey_data_item__survey_form` FOREIGN KEY (`survey_form_id`) REFERENCES `survey_form` (`id`),
    ADD CONSTRAINT `survey_data_item__survey_data` FOREIGN KEY (`survey_data_uuid`) REFERENCES `survey_data` (`uuid`);

    CALL drop_constraints('survey_data_log');
    ALTER TABLE `survey_data_log`
    ADD CONSTRAINT `survey_data_log__survey_form` FOREIGN KEY (`survey_form_id`) REFERENCES `survey_form` (`id`),
    ADD CONSTRAINT `survey_data_log__survey_data` FOREIGN KEY (`survey_data_uuid`) REFERENCES `survey_data` (`uuid`);

    CALL drop_constraints('medical_sheet');
    ALTER TABLE `medical_sheet`
    ADD CONSTRAINT `medical_sheet__survey_data` FOREIGN KEY (`survey_data_uuid`) REFERENCES `survey_data` (`uuid`),
    ADD CONSTRAINT `medical_sheet__patient` FOREIGN KEY (`patient_uuid`) REFERENCES `patient` (`uuid`);


    CALL drop_constraints('configuration_analysis_tools');
    ALTER TABLE `configuration_analysis_tools`
    ADD CONSTRAINT `config_analysis_tools__acc_ref` FOREIGN KEY (`account_reference_id`) REFERENCES `account_reference` (`id`),
    ADD CONSTRAINT `config_analysis_tools__analysis_tool_type` FOREIGN KEY (`analysis_tool_type_id`) REFERENCES `analysis_tool_type` (`id`);

    SET foreign_key_checks = 1;




/*
@author : jeremielodi
@date : 2020-07-22
@subject : Stock expiration report
*/

INSERT INTO `report` (`report_key`, `title_key`) VALUES
('stock_expiration_report', 'REPORT.STOCK_EXPIRATION_REPORT.TITLE');

 INSERT INTO unit VALUES
(289, '[Stock] Expiration report','TREE.STOCK_EXPIRATION_REPORT','Stock expiration report', 282,'/reports/stock_expiration_report');

/*
 * @author: mbayopanda
 * @date: 2020-08-17
 * @description: rename collection capacity to recovery capacity
 */
UPDATE unit SET
  `name` = "Recovery Capacity",
  `key` = "TREE.RECOVERY_CAPACITY_REPORT",
  `description` = "Recovery Capacity Report",
  `path` = "/reports/recoveryCapacity"
WHERE id = 271;

UPDATE `report` SET
  `report_key` = "recoveryCapacity",
  `title_key` = "REPORT.RECOVERY_CAPACITY.TITLE"
WHERE report_key = "collectionCapacity";

/*
 * @author: mbayopanda
 * @date: 2020-08-17
 * @description: add address field in the enterprise table
 */
ALTER TABLE enterprise ADD COLUMN `address` VARCHAR(200) DEFAULT NULL;

/*
 * @author: mbayopanda
 * @date: 2020-07-20
 */
ALTER TABLE `tags` ADD COLUMN `color` VARCHAR(50) NULL;

DROP TABLE IF EXISTS `lot_tag`;
CREATE TABLE `lot_tag` (
  `lot_uuid`          BINARY(16) NOT NULL,
  `tag_uuid`          BINARY(16) NOT NULL,
  FOREIGN KEY (`lot_uuid`) REFERENCES `lot` (`uuid`),
  FOREIGN KEY (`tag_uuid`) REFERENCES `tags` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

/*
 * @author: jmcameron
 * @date: 2020-08-28
 * @description: add min_months_security_stock to enterprise and depot tables
 */
ALTER TABLE `depot` ADD COLUMN `min_months_security_stock` SMALLINT(5) NOT NULL DEFAULT 2;
ALTER TABLE `enterprise_setting` ADD COLUMN `min_months_security_stock` SMALLINT(5) NOT NULL DEFAULT 2;


/*
 * @author: jeremielodi
   on @jniles PR https://github.com/Third-Culture-Software/bhima/pull/4866
 * @date: 2020-08-31
 */
DROP TABLE IF EXISTS `stock_movement_status`;
CREATE TABLE  `stock_movement_status` (
    `uuid` BINARY(16) NOT NULL,
    `start_date` DATE,
    `end_date` DATE,
    `quantity` DECIMAL(19,4) NOT NULL,
    `in_quantity` DECIMAL(19,4) NOT NULL,
    `out_quantity` DECIMAL(19,4) NOT NULL,
    `inventory_uuid` BINARY(16) NOT NULL,
    `depot_uuid` BINARY(16) NOT NULL,
    PRIMARY KEY(`uuid`),
    KEY `depot_uuid` (`depot_uuid`),
    CONSTRAINT `stock_movement_status__depot` FOREIGN KEY (`depot_uuid`) REFERENCES `depot` (`uuid`),
    KEY `inventory_uuid` (`inventory_uuid`),
    CONSTRAINT `stock_movment_status__inventory` FOREIGN KEY (`inventory_uuid`) REFERENCES `inventory` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

/*
 * @author: mbayopanda
 * @date: 2020-09-07
 * @description: Add the importance level column in the inventory table
 *    the importance value can be :
 *    NULL -> The inventory doesn't need a particular focus for dashboards
 *    1 -> LOW
 *    2 -> MID
 *    3 -> HIGH
 */
ALTER TABLE inventory ADD COLUMN `importance` SMALLINT(5) NULL COMMENT 'Inventory level of importance : 1 -> LOW, 2 -> MID, 3 -> HIGH';


/*
 * @author: jniles
 * @date: 2020-09-10
 * @description: add enterprise setting for crediting supplier's invoice on stock
 * entry from purchase.
 */
ALTER TABLE `enterprise_setting` ADD COLUMN `enable_supplier_credit` TINYINT(1) NOT NULL DEFAULT 0;

/*
 * @author: mbayopanda
 * @date: 2020-09-16
 * @desc: add enterprise setting for strict depot permission which will restrict stock registries to depot owner
 */
 ALTER TABLE `enterprise_setting` ADD COLUMN `enable_strict_depot_permission` TINYINT(1) NOT NULL DEFAULT 0;

/*
 * @author: jeremielodi
 * @date: 2020-09-18
 * @desc: unpost transactions #4927
 */
INSERT INTO `actions`(`id`, `description`) VALUES
  (2, 'FORM.LABELS.CAN_UNPOST_TRANSACTIONS');


ALTER TABLE `transaction_history`  ADD COLUMN `action` VARCHAR(15) DEFAULT 'edit';



/*
@author : jeremielodi
@subjet : put indicator report into dashboard folder
@date : 2020-09-24
*/

UPDATE unit SET parent = 233 WHERE id = 238;
