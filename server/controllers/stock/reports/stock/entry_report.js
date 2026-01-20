const {
  _, db, util, ReportManager, STOCK_ENTRY_REPORT_TEMPLATE,
} = require('../common');

const Exchange = require('../../../finance/exchange');

const StockEntryFromPurchase = require('./entry/entryFromPurchase');
const StockEntryFromIntegration = require('./entry/entryFromIntegration');
const StockEntryFromDonation = require('./entry/entryFromDonation');
const StockEntryFromTransfer = require('./entry/entryFromTransfer');

/**
   * @method stockEntryReport
   *
   * @description
   * This method builds the stock entry report as either a JSON, PDF, or HTML
   * file to be sent to the client.
   *
   * GET /reports/stock/entry
   */
// function stockEntryReport(req, res) {
async function stockEntryReport(req, res) {

  const params = util.convertStringToNumber(req.query);

  const optionReport = _.extend(params, {
    filename : 'REPORT.STOCK.ENTRY_REPORT',
  });

  // set up the report with report manager
  const report = new ReportManager(STOCK_ENTRY_REPORT_TEMPLATE, req.session, optionReport);

  const [depot, exchange] = await Promise.all([
    fetchDepotDetails(params.depotUuid),
    Exchange.getExchangeRate(req.session.enterprise.id, params.currencyId, new Date()),
  ]);

  params.exchangeRate = exchange.rate || 1;

  params.depotName = depot.text;
  const collection = await collect(params);
  const bundle = await groupCollection(collection);

  _.extend(bundle, params);

  const result = await report.render(bundle);
  res.set(result.headers).send(result.report);
}

/**
 * fetchDepotDetails
 * @param {number} depotUuid depot uuid
 */
function fetchDepotDetails(depotUuid) {
  const query = 'SELECT text FROM depot WHERE uuid = ?';
  return db.one(query, [db.bid(depotUuid)]);
}

/**
 * @function groupCollection
 * @description group collected data by inventory
 */
function groupCollection(entryCollection) {
  const collection = {};

  // entryFromPurchase: [], entryFromIntegration: [], entryFromDonation: [], entryFromTransfer

  // get stock entry from purchase
  collection.entryFromPurchase = formatAndCombine(entryCollection.entryFromPurchase);

  // get stock entry from integration
  collection.entryFromIntegration = formatAndCombine(entryCollection.entryFromIntegration);

  // get stock entry from donation
  collection.entryFromDonation = formatAndCombine(entryCollection.entryFromDonation);

  // get stock entry from transfer
  collection.entryFromTransfer = formatAndCombine(entryCollection.entryFromTransfer);

  return collection;
}

function formatAndCombine(data, GROUP_BY_SERVICE) {
  const aggregate = _.chain(data)
    .groupBy(GROUP_BY_SERVICE ? 'service_display_name' : 'text')
    .map(formatEntry)
    .map(newData => {
      if (!GROUP_BY_SERVICE) { return newData; }

      const newAggregate = _.chain(newData.inventory_stock_entry_data)
        .groupBy('text')
        .map(formatEntry)
        .value();

      const cost = _.sumBy(newAggregate, 'inventory_stock_entry_cost');
      newData.subset = { data : newAggregate, isEmpty : _.size(newAggregate) === 0, cost };

      return newData;
    })
    .value();

  const cost = _.sumBy(aggregate, 'inventory_stock_entry_cost');
  return { data : aggregate, isEmpty : _.size(aggregate) === 0, cost };
}

/**
 * @function formatEntry
 */
function formatEntry(value, key) {
  return {
    inventory_name : key,
    inventory_unit : value && value[0] ? value[0].unit_text : '',
    inventory_stock_entry_data : value,
    inventory_stock_entry_quantity : _.sumBy(value, 'quantity'),
    inventory_stock_entry_cost : _.sumBy(value, 'cost'),
  };
}

/**
 * @function collect
 * @param {object} params query parameters
 * @return {promise} { entryFromPurchase: [], entryFromIntegration: [], entryFromDonation: [], entryFromTransfer: [] }
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

  function exchange(rows) {
    rows.forEach(row => {
      row.cost *= exchangeRate;
      row.unit_cost *= exchangeRate;
    });

    return rows;
  }

  // get stock entry from purchase
  if (includePurchaseEntry) {
    data.entryFromPurchase = exchange(await StockEntryFromPurchase.fetch(depotUuid, dateFrom, dateTo, showDetails));
  }

  // get stock entry from integration
  if (includeIntegrationEntry) {
    data.entryFromIntegration = exchange(
      await StockEntryFromIntegration.fetch(depotUuid, dateFrom, dateTo, showDetails),
    );
  }

  // get stock entry from Donation
  if (includeDonationEntry) {
    data.entryFromDonation = exchange(await StockEntryFromDonation.fetch(depotUuid, dateFrom, dateTo, showDetails));
  }

  // get stock entry from transfer
  if (includeTransferEntry) {
    data.entryFromTransfer = exchange(await StockEntryFromTransfer.fetch(depotUuid, dateFrom, dateTo, showDetails));
  }

  return data;
}

module.exports = stockEntryReport;
