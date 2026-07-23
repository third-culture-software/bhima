const {
  db, util, ReportManager, STOCK_ENTRY_REPORT_TEMPLATE,
} = require('../common');

const Exchange = require('../../../finance/exchange');

const StockEntryFromPurchase = require('./entry/entryFromPurchase');
const StockEntryFromIntegration = require('./entry/entryFromIntegration');
const StockEntryFromDonation = require('./entry/entryFromDonation');
const StockEntryFromTransfer = require('./entry/entryFromTransfer');

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
// function stockEntryReport(req, res) {
async function stockEntryReport(req, res) {

  const params = util.convertStringToNumber(req.query);

  const optionReport = Object.assign(params, {
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

  Object.assign(bundle, params);

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
 * @param entryCollection
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

/**
 * Formats and aggregates inventory stock entry data.
 *
 * Data is grouped either by service name or item text depending on
 * `GROUP_BY_SERVICE`. When grouping by service, each service is further
 * grouped by item text to create a nested subset.
 * @param {Array<object>} data - Inventory stock entry records.
 * @param {boolean} GROUP_BY_SERVICE - Whether to group entries by service.
 * @returns {object} Aggregated data with total cost and empty state.
 */
function formatAndCombine(data, GROUP_BY_SERVICE) {
  const groupKey = GROUP_BY_SERVICE ? 'service_display_name' : 'text';

  const groupedData = groupBy(data, groupKey);

  const aggregate = Object.values(groupedData).map(group => {
    const newData = formatEntry(group);

    if (!GROUP_BY_SERVICE) {
      return newData;
    }

    const groupedInventory = groupBy(
      newData.inventory_stock_entry_data,
      'text'
    );

    const newAggregate = Object.values(groupedInventory).map(formatEntry);

    const cost = sumBy(newAggregate, 'inventory_stock_entry_cost');

    newData.subset = {
      data: newAggregate,
      isEmpty: newAggregate.length === 0,
      cost
    };

    return newData;
  });

  const cost = sumBy(aggregate, 'inventory_stock_entry_cost');

  return {
    data: aggregate,
    isEmpty: aggregate.length === 0,
    cost
  };
}

/**
 * Groups an array of objects by a property.
 * @param {Array<object>} items - Items to group.
 * @param {string} key - Object property used as the grouping key.
 * @returns {Object<string, Array<object>>} Grouped items.
 */
function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const group = item[key];

    (groups[group] ||= []).push(item);

    return groups;
  }, {});
}

/**
 * Calculates the sum of a numeric property across an array.
 * @param {Array<object>} items - Objects to sum.
 * @param {string} key - Numeric property name.
 * @returns {number} Sum of values.
 */
function sumBy(items, key) {
  return items.reduce((sum, item) => sum + (item[key] || 0), 0);
}

/**
 * Formats a grouped inventory entry into an aggregate object.
 * @param {Array<object>} entries - Inventory records belonging to a group.
 * @param {string} key - Group identifier used as the inventory name.
 * @returns {object} Formatted inventory summary.
 */
function formatEntry(entries, key) {
  return {
    inventory_name: key,
    inventory_unit: entries[0]?.unit_text || '',
    inventory_stock_entry_data: entries,
    inventory_stock_entry_quantity: sumBy(entries, 'quantity'),
    inventory_stock_entry_cost: sumBy(entries, 'cost')
  };
}


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

   /**
    Applies the current exchange rate to inventory costs.
    
    Returns a new array and does not modify the input rows.
    * @param {Array<object>} rows - Inventory rows to convert.
    * @returns {Array<object>} Converted inventory rows.
    */
   function exchange(rows) {
     return rows.map(row => ({
       ...row,
       cost: row.cost * exchangeRate,
       unit_cost: row.unit_cost * exchangeRate
     }));
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
