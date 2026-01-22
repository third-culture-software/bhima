const {
  _, db, ReportManager, STOCK_VALUE_REPORT_TEMPLATE,
} = require('../common');

const Exchange = require('../../../finance/exchange');

/**
 * @method stockInventoryReport
 *
 * @description
 * This method builds the stock value report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/stock/value
 */
async function stockValue(req, res) {
  const result = await reporting(req.query, req.session);
  res.set(result.headers).send(result.report);
}

async function reporting(_options, session) {
  const data = {};
  const enterpriseId = session.enterprise.id;

  const optionReport = _.extend(_options, {
    filename : 'REPORT.STOCK_VALUE.TITLE',
  });

  const report = new ReportManager(STOCK_VALUE_REPORT_TEMPLATE, session, optionReport);

  const options = (typeof (_options.params) === 'string') ? JSON.parse(_options.params) : _options;

  data.dateTo = options.dateTo;
  data.isEnterpriseCurrency = Number(options.currency_id) === session.enterprise.currency_id;

  const depot = await db.one('SELECT * FROM depot WHERE uuid = ?', [db.bid(options.depot_uuid)]);
  const exchangeRate = await Exchange.getExchangeRate(enterpriseId, options.currency_id, new Date());

  // get the current quantities in stock
  const currentQuantitiesInStockSQL = `
    SELECT sms.date, BUID(sms.inventory_uuid) AS uuid, sms.sum_quantity AS quantity,
      inventory.code, inventory.text, inventory.consumable,
      sv.wac, inventory.price,
      (sv.wac * sms.sum_quantity) AS total_value,
      (sv.wac * IFNULL(GetExchangeRate(${enterpriseId}, ?, NOW()), 1)) AS exchanged_wac,
      (sv.wac * sms.sum_quantity) * IFNULL(GetExchangeRate(${enterpriseId}, ?, NOW()), 1) AS exchanged_value,
      (inventory.price * IFNULL(GetExchangeRate(${enterpriseId}, ?, NOW()), 1)) AS exchanged_price,
      (inventory.price * IFNULL(GetExchangeRate(${enterpriseId}, ?, NOW()), 1)) * sms.sum_quantity
        AS exchanged_sales_value
    FROM stock_movement_status AS sms JOIN (
      SELECT inside.inventory_uuid, MAX(inside.date) AS date
      FROM stock_movement_status AS inside
      WHERE inside.depot_uuid = ?
        AND inside.date <= DATE(?)
      GROUP BY inside.inventory_uuid
    ) AS outside
    ON outside.date = sms.date
      AND sms.inventory_uuid = outside.inventory_uuid
    JOIN inventory ON inventory.uuid = sms.inventory_uuid
    JOIN stock_value sv ON sv.inventory_uuid = inventory.uuid
    WHERE sms.depot_uuid = ?
    ORDER BY inventory.text;
  `;

  const currentQuantitiesInStock = await db.exec(currentQuantitiesInStockSQL, [
    options.currency_id,
    options.currency_id,
    options.currency_id,
    options.currency_id,
    depot.uuid,
    options.dateTo,
    depot.uuid,
  ]);

  // filter out 0s if necessary
  const filtered = currentQuantitiesInStock.filter(row => {
    if (options.excludeZeroValue === '1') { return row.quantity !== 0; }
    return true;
  });

  const totals = filtered.reduce((agg, row) => {
    agg.stockTotalValue += row.exchanged_value;
    agg.stockTotalSaleValue += row.exchanged_sales_value;
    return agg;
  }, { stockTotalValue : 0, stockTotalSaleValue : 0 });

  data.stockValues = filtered;
  data.emptyResult = data.stockValues.length === 0;

  data.exchangeRate = exchangeRate.rate || 1;
  data.currency_id = options.currency_id;

  data.depotName = depot.text;

  return report.render({ ...data, totals });
}

module.exports.document = stockValue;
module.exports.reporting = reporting;
