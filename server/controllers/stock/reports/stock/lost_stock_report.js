const {
  db, ReportManager, Stock, STOCK_LOST_STOCK_REPORT_TEMPLATE,
} = require('../common');

const Exchange = require('../../../finance/exchange');

/**
 * @method lostStockReport
 *
 * @description
 * This method builds the stock lots report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/stock/lost
 */
async function lostStockReport(req, res) {
  const params = req.query;
  const { depotRole } = req.query;
  const { enterprise } = req.session;
  const currencyId = Number(params.currencyId);
  const depot = await fetchDepotDetails(params.depot_uuid);

  const enterpriseId = enterprise.id;
  const exchangeRate = await Exchange.getExchangeRate(enterpriseId, currencyId, new Date());
  const rate = exchangeRate.rate || 1;

  // set up the report with report manager
  const optionReport = { ...params, filename : 'REPORT.LOST_STOCK_REPORT.TITLE' };
  const report = new ReportManager(STOCK_LOST_STOCK_REPORT_TEMPLATE, req.session, optionReport);
  const rows = await Stock.listLostStock(params);

  const data = {
    currencyId : Number(params.currencyId),
    exchangeRate : rate,
    dateTo : params.dateTo,
    dateFrom : params.dateFrom,
  };

  switch (depotRole) {
  case 'destination':
    data.destDepot = depot.name;
    break;
  case 'source':
    data.srcDepot = depot.name;
    break;
  default:
    data.depotName = depot.name;
  }

  let sumLosses = 0;
  let totalMissing = 0;

  rows.forEach(row => {
    row.unit_cost *= rate;
    totalMissing += row.quantityDifference;
    row.loss = row.quantityDifference * row.unit_cost;
    sumLosses += row.loss;
  });

  data.rows = rows;
  data.totalMissing = totalMissing;
  data.totalLoss = sumLosses;
  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

/**
 * fetchDepotDetails
 * @param {number} depotUuid depot uuid
 */
function fetchDepotDetails(depotUuid) {
  const query = 'SELECT text AS name FROM depot WHERE uuid = ?';
  return db.one(query, [db.bid(depotUuid)]);
}

module.exports = lostStockReport;
