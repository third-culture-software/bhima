const {
  db, util, ReportManager, STOCK_ENTRY_REPORT_TEMPLATE,
} = require('../common');

const debug = require('debug')('reports:stock:entry')
const Exchange = require('../../../finance/exchange');

const FromPurchase = require('./entry/entryFromPurchase');
const FromIntegration = require('./entry/entryFromIntegration');
const FromDonation = require('./entry/entryFromDonation');
const FromTransfer = require('./entry/entryFromTransfer');

const sumBy = (items, key) => items.reduce((sum, item) => sum + (item[key] || 0), 0);

/**
 * @param req
 * @param res
 * @function stockEntryReport
 * @description
 * This method builds the stock entry report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/stock/entry
 */
async function stockEntryReport(req, res) {
  const params = util.convertStringToNumber(req.query);
  const opts =  { ...params, filename : 'REPORT.STOCK.EXIT_REPORT' };

  // set up the report with report manager
  const report = new ReportManager(STOCK_ENTRY_REPORT_TEMPLATE, req.session, opts);

  const [depot, exchange] = await Promise.all([
    getDepot(params.depotUuid),
    Exchange.getExchangeRate(req.session.enterprise.id, params.currencyId, new Date()),
  ]);

  debug(`Loading entries for ${depot.text}`);

  params.exchangeRate = exchange.rate || 1;
  params.depotName = depot.text;

  const bundle = await collect(params);
  Object.assign(bundle, params);

  const result = await report.render(bundle);
  res.set(result.headers).send(result.report);
}

/**
 * getDepot
 * @param {number} depotUuid depot uuid
 */
function getDepot(depotUuid) {
  const query = 'SELECT text FROM depot WHERE uuid = ?';
  return db.one(query, [db.bid(depotUuid)]);
}

/**
 * Formats and aggregates inventory stock entry data.
 * @param {Array<object>} data - Inventory stock entry records.
 * @returns {object} Aggregated data with total cost and empty state.
 */
function formatAndCombine(data) {
  const groupedData = Object.groupBy(data, o => o.text);
  const aggregate = Object.entries(groupedData)
    .map(([key, group]) => formatEntryRow(group, key));

  return {
    data: aggregate,
    isEmpty: aggregate.length === 0,
    cost : sumBy(aggregate, 'entry_cost')
  };
}


const formatEntryRow = (entries, key) => ({
  inventory_name: key,
  inventory_unit: entries[0]?.unit_text || '',
  entry_data: entries,
  entry_quantity: sumBy(entries, 'quantity'),
  entry_cost: sumBy(entries, 'cost')
});

/**
 * @function collect
 * @param {object} params query parameters
 * @returns {promise} { entryFromPurchase: [], entryFromIntegration: [], entryFromDonation: [], entryFromTransfer: [] }
 */
async function collect(params) {
  const {
    depotUuid,
    dateFrom,
    dateTo,
    showDetails,
    includePurchaseEntry,
    includeIntegrationEntry,
    includeDonationEntry,
    includeTransferEntry,
    exchangeRate,
  } = params;

  const data = { };

  const exchange = (rows) => rows.map(row => ({
    ...row,
    cost: row.cost * exchangeRate,
    unit_cost: row.unit_cost * exchangeRate
  }));

  // get stock entry from purchase
  if (includePurchaseEntry) {
    data.entryFromPurchase = await FromPurchase.fetch(depotUuid, dateFrom, dateTo, showDetails);
    data.entryFromPurchase = formatAndCombine(exchange(data.entryFromPurchase));
  }

  // get stock entry from integration
  if (includeIntegrationEntry) {
    data.entryFromIntegration = await FromIntegration.fetch(depotUuid, dateFrom, dateTo, showDetails);
    data.entryFromIntegration = formatAndCombine(exchange(data.entryFromIntegration));
  }

  // get stock entry from Donation
  if (includeDonationEntry) {
    data.entryFromDonation = await FromDonation.fetch(depotUuid, dateFrom, dateTo, showDetails);
    data.entryFromDonation = formatAndCombine(exchange(data.entryFromDonation));
  }

  // get stock entry from transfer
  if (includeTransferEntry) {
    data.entryFromTransfer = await FromTransfer.fetch(depotUuid, dateFrom, dateTo, showDetails);
    data.entryFromTransfer = formatAndCombine(exchange(data.entryFromTransfer));
  }

  return data;
}

module.exports = stockEntryReport;
