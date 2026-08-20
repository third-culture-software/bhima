/* migrate v1.11.0 to v1.12.0 */

/*
 * @author: mbayopanda
 * @date: 2020-04-20
 */
INSERT INTO unit VALUES
(269, 'Inventory Adjustment', 'TREE.INVENTORY_ADJUSTMENT', 'Inventory Adjustment', 160, '/modules/stock/inventory-adjustment/inventory-adjustment.html', '/stock/inventory-adjustment');

INSERT INTO flux VALUES
(14, 'STOCK_FLUX.INVENTORY_RESET'),
(15, 'STOCK_FLUX.INVENTORY_ADJUSTMENT');

ALTER TABLE enterprise_setting ADD COLUMN enable_daily_consumption SMALLINT(5) NOT NULL DEFAULT 0;


/*
 * @author: @lomamech
 * @date: 2020-04-29
 */
INSERT INTO unit VALUES
(270, 'compare invoiced to received', 'TREE.COMPARE_INVOICED_RECEIVED', 'Compare invoiced items to received stock', 144, '/modules/reports/invoicedReceivedStock', '/reports/invoicedReceivedStock');

INSERT INTO report (report_key, title_key) VALUES
('invoicedReceivedStock', 'REPORT.COMPARE_INVOICED_RECEIVED.TITLE');


/**
@author: jniles
@date: 2020-05-11
*/
ALTER TABLE purchase_item MODIFY COLUMN unit_price DECIMAL(19, 8) UNSIGNED NOT NULL DEFAULT 0.00;
ALTER TABLE purchase_item MODIFY COLUMN total DECIMAL(19, 8) UNSIGNED NULL DEFAULT 0.00;
