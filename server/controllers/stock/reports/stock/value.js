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

  const exchangeRateValue = exchangeRate.rate ? exchangeRate.rate : 1;

  // get the current quantities in stock
  const currentQuantitiesInStockSQL = `
    SELECT sms.date, BUID(sms.inventory_uuid) AS uuid, sms.sum_quantity AS quantity, sms.text, sms.code, sms.price,
      sv.wac,
      (sv.wac * sms.sum_quantity) AS total_value,
      (sv.wac * ?) AS exchanged_wac,
      (sv.wac * sms.sum_quantity) * ? AS exchanged_value,
      (sms.price * ?) AS exchanged_price,
      (sms.price * ?) * sms.sum_quantity AS exchanged_sales_value
    FROM (
    SELECT aggr.date, aggr.inventory_uuid, SUM(aggr.quantity) AS sum_quantity, aggr.code, aggr.text, aggr.consumable, aggr.price
    FROM (
      SELECT sm.date, l.inventory_uuid, sm.lot_uuid, IF(sm.is_exit, (sm.quantity * -1), sm.quantity) AS quantity,
      inv.code, inv.text, inv.consumable, inv.price
      FROM stock_movement AS sm
      JOIN lot AS l ON l.uuid = sm.lot_uuid
      JOIN inventory AS inv ON inv.uuid = l.inventory_uuid
      WHERE sm.date <= DATE(?) AND sm.depot_uuid = ?
    ) AS aggr
    GROUP BY aggr.inventory_uuid
    ) AS sms
    JOIN stock_value sv ON sv.inventory_uuid = sms.inventory_uuid
    ORDER BY sms.text ASC;
  `;

  const currentQuantitiesInStock = await db.exec(currentQuantitiesInStockSQL, [
    exchangeRateValue,
    exchangeRateValue,
    exchangeRateValue,
    exchangeRateValue,
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
