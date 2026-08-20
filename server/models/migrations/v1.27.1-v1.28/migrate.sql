-- v1.27.1 - next
/**
 * @author: lomamech
 * @description: Satisfaction rate report #7000
 * @date: 2023-04-04
 */
CALL add_column_if_missing('stock_setting', 'enable_requisition_validation_step', 'TINYINT(1) NOT NULL DEFAULT 0');

CALL add_column_if_missing('stock_requisition', 'validator_user_id', 'SMALLINT(5) UNSIGNED DEFAULT NULL');
CALL add_column_if_missing('stock_requisition', 'validation_date', 'DATETIME NULL');

CALL add_column_if_missing('stock_requisition_item', 'old_quantity', 'INT(11) NOT NULL DEFAULT 0');

INSERT IGNORE INTO actions (id, description) VALUES
(9, 'USERS.ACTIONS.VALIDATE_REQUISITION');

INSERT IGNORE INTO status VALUES
(8, 'partial_surpluses', 'FORM.LABELS.STATUS_TYPE.PARTIAL_SURPLUSES', 'label label-warning'),
(9, 'validated', 'FORM.LABELS.STATUS_TYPE.VALIDATED', 'label label-info');

INSERT INTO unit VALUES
(317, 'Satisfaction Rate Report', 'TREE.SATISFACTION_RATE_REPORT', 'Satisfaction Rate Report', 282, '/reports/satisfaction_rate_report');

-- core BHIMA reports
INSERT IGNORE INTO report (report_key, title_key) VALUES
('satisfaction_rate_report', 'TREE.SATISFACTION_RATE_REPORT');
