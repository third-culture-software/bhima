/*
 * Migration file from v1.21.5-v1.22.0
 */

/*
 * @author: jmcameron
 * @description: Add new menu item
 * @date: 2021-12-11
 */
INSERT IGNORE INTO unit VALUES
(305, 'Average Medical Costs Per Patient', 'TREE.AVERAGE_MED_COST_REPORT', 'Report of avg med costs', 282, '/reports/avg_med_costs_per_patient');

INSERT IGNORE INTO report (report_key, title_key) VALUES
('avg_med_costs_per_patient', 'TREE.AVERAGE_MED_COST_REPORT');

/*
 * @author: jmcameron
 * @description: Hide old cost center menu items
 * @date: 2021-12-09
 */
DELETE FROM role_unit
WHERE unit_id IN (220, 221, 222, 223, 230, 231, 232);
DELETE FROM report
WHERE report_key IN (
        'cost_center',
        'break_even',
        'break_even_cost_center'
    );
DELETE FROM unit
WHERE id IN (220, 221, 222, 223, 230, 231, 232);

/*
 * @author: jmcameron
 * @description: Increase precision of exchange rate
 * @date: 2021-12-16
 */
ALTER TABLE exchange_rate MODIFY rate DOUBLE NOT NULL;


/**
 * @author: jniles
 * @description: add realized_profit report if it doesn't exist
 * @date: 2021-12-21
*/
INSERT IGNORE INTO report (report_key, title_key) VALUES
('realized_profit', 'REPORT.REALIZED_PROFIT.TITLE');

UPDATE unit SET name = 'Stock Movement Report'
WHERE name = '[Stock] Movement Report';
UPDATE unit SET name = 'Stock Consumption Graph'
WHERE name = '[Stock] Consumption Graph';
UPDATE unit SET name = 'OHADA Bilan'
WHERE name = '[OHADA] Bilan';
UPDATE unit SET name = 'OHADA Compte de resultat'
WHERE name = '[OHADA] Compte de resultat';
UPDATE unit SET name = 'Stock Entry Report'
WHERE name = '[Stock] Stock Entry Report';
UPDATE unit SET name = 'Stock Consumption Graph'
WHERE name = '[Stock] Consumption Graph';
UPDATE unit SET name = 'Stock Expiration Report'
WHERE name = '[Stock] Expiration report';
UPDATE unit SET name = 'Stock Dashboard'
WHERE name = '[Stock] Dashboard';
UPDATE unit SET name = 'Stock Changes Report'
WHERE name = '[Stock] Changes Report';
