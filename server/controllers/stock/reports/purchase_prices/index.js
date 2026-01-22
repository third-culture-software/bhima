const db = require('../../../../lib/db');
const util = require('../../../../lib/util');
const ReportManager = require('../../../../lib/ReportManager');
const {
  FROM_PURCHASE,
  FROM_INTEGRATION,
} = require('../../../../config/constants').flux;

const TEMPLATE = './server/controllers/stock/reports/purchase_prices/report.handlebars';
exports.report = report;

// default report parameters
const DEFAULT_PARAMS = {
  csvKey : 'entries',
  filename : 'REPORT.PURCHASE_PRICES.TITLE',
  orientation : 'landscape',
};

/**
 * @function report
 *
 * @description
 * This function renders the purchase prices report.
 */
async function report(req, res) {
  let params = req.query;

  const inventorySQL = `SELECT code, text, price FROM inventory WHERE uuid = ?;`;

  const entriesSQL = `
    SELECT
      sm.date, dm.text AS hrReference,
      sm.unit_cost, sm.quantity,
      l.label AS lot_label,
      flux.label AS reason,
      SUM(sm.unit_cost * sm.quantity) OVER (ORDER BY sm.date ROWS UNBOUNDED PRECEDING) AS running_total,
      sm.user_id, user.display_name AS userName
    FROM stock_movement sm
      JOIN lot l ON l.uuid = sm.lot_uuid
      JOIN document_map dm ON dm.uuid = sm.document_uuid
      JOIN inventory inv ON inv.uuid = l.inventory_uuid
      JOIN user ON sm.user_id = user.id
      JOIN flux ON sm.flux_id = flux.id
    WHERE l.inventory_uuid = ?
     AND sm.is_exit = 0
     AND sm.flux_id IN (${FROM_PURCHASE}, ${FROM_INTEGRATION})
    ORDER BY sm.date;
  `;

  const totalsSQL = `
    SELECT
      SUM(sm.unit_cost * sm.quantity) AS cost,
      SUM(sm.quantity) AS quantity,
      AVG(sm.unit_cost) AS avg_unit_cost,
      MIN(sm.unit_cost) AS min_price,
      MAX(sm.unit_cost) AS max_price,
      COUNT(*) AS num_entries
    FROM stock_movement sm
      JOIN lot l ON l.uuid = sm.lot_uuid
      JOIN inventory inv ON inv.uuid = l.inventory_uuid
    WHERE l.inventory_uuid = ?
     AND sm.is_exit = 0
     AND sm.flux_id IN (${FROM_PURCHASE}, ${FROM_INTEGRATION})
    ORDER BY sm.date;
  `;

  params = { ...DEFAULT_PARAMS, ...params };

  const reporting = new ReportManager(TEMPLATE, req.session, params);

  const inventoryUuid = db.bid(params.inventory_uuid);

  const [inventory, totals, entries] = await Promise.all([
    db.one(inventorySQL, [inventoryUuid]),
    db.one(totalsSQL, [inventoryUuid]),
    db.exec(entriesSQL, [inventoryUuid]),
  ]);

  // Compute the median unit cost
  // Note: the median_price will be 'null' if there is no purchase history
  const unitCosts = entries.map(item => Number(item.unit_cost));
  totals.median_price = util.median(unitCosts);

  const result = await reporting.render({ inventory, entries, totals });
  res.set(result.headers).send(result.report);
}
