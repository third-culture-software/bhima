/* Release 1.32.0 */

ALTER TABLE inventory_group DROP COLUMN donation_account;

/*
 * @author: lomamech
 * @date: 2024-07-16
 * @description: Final settlement management
 */
ALTER TABLE enterprise_setting ADD COLUMN enable_activate_pension_fund TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE enterprise_setting ADD COLUMN pension_transaction_type_id TINYINT(1) NOT NULL DEFAULT 6;

ALTER TABLE rubric_payroll ADD COLUMN is_linked_pension_fund TINYINT(1) NULL DEFAULT '0' AFTER indice_to_grap;

ALTER TABLE staffing_indice_parameters ADD COLUMN pension_fund DECIMAL(19, 4) UNSIGNED NOT NULL DEFAULT 0.00 AFTER pay_envelope;
