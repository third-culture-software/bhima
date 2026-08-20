/*
Migrate v1.10.1 - v1.10.2
 */
-- @lomamech 2020-03-24
ALTER TABLE enterprise_setting ADD COLUMN month_average_consumption SMALLINT(5) NOT NULL DEFAULT 6;

-- author: @jniles 2020-03-30
-- Update yearly cron syntax to 0-indexing rather than 1-indexing.
UPDATE cron SET value = '0 1 31 11 *'
WHERE label = 'CRON.YEARLY';

-- @lomamech 2020-03-30
INSERT INTO unit VALUES
(267, 'Monthly consumption report', 'TREE.MONTHLY_CONSUMPTION', 'Monthly consumption report', 144, '/modules/reports/monthlyConsumptionReport', '/reports/monthlyConsumptionReport');

INSERT INTO report (report_key, title_key) VALUES
('monthlyConsumptionReport', 'REPORT.MONTHLY_CONSUMPTION.TITLE');
