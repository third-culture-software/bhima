const {
  db, util, ReportManager, STOCK_EXIT_REPORT_TEMPLATE,
} = require('../common');

const Exchange = require('../../../finance/exchange');

const StockExitToPatient = require('./exit/exitToPatient');
const StockExitToService = require('./exit/exitToService');
const StockExitToDepot = require('./exit/exitToDepot');
const StockExitToLoss = require('./exit/exitToLoss');

/**
 * @param req
 * @param res
 * @function stockExitReport
 * @description
 * This method builds the stock exit report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/stock/exit
 */
async function stockExitReport(req, res) {

  const params = util.convertStringToNumber(req.query);

  const optionReport = Object.assign(params, {
    filename : 'REPORT.STOCK.EXIT_REPORT',
  });

  // set up the report with report manager
  const report = new ReportManager(STOCK_EXIT_REPORT_TEMPLATE, req.session, optionReport);

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
 * @param exitCollection
 * @function groupCollection
 * @description group collected data by inventory
 */
function groupCollection(exitCollection) {
  const collection = {};

  // exit to patient
  collection.exitToPatient = formatAndCombine(exitCollection.exitToPatient);

  // exit to service
  collection.exitToService = formatAndCombine(exitCollection.exitToService);

  // exit to service grouped
  collection.exitToServiceGrouped = formatAndCombine(exitCollection.exitToService, true);

  // exit to depot
  collection.exitToDepot = formatAndCombine(exitCollection.exitToDepot);

  // exit to loss
  collection.exitToLoss = formatAndCombine(exitCollection.exitToLoss);

  return collection;
}
/**
 * Formats and aggregates inventory stock exit data.
 *
 * Data is grouped either by service name or inventory item text. When grouped
 * by service, each service is further grouped by inventory item to produce a
 * nested subset.
 * @param {Array<object>} data - Inventory stock exit records.
 * @param {boolean} GROUP_BY_SERVICE - Whether to group records by service.
 * @returns {object} Aggregated inventory stock exit data.
 */
function formatAndCombine(data, GROUP_BY_SERVICE) {
  const groupKey = GROUP_BY_SERVICE ? 'service_display_name' : 'text';

  const aggregate = Object.values(groupBy(data, groupKey)).map(group => {
    const newData = formatExit(group);

    if (!GROUP_BY_SERVICE) {
      return newData;
    }

    const newAggregate = Object.values(
      groupBy(newData.inventory_stock_exit_data, 'text')
    ).map(formatExit);

    newData.subset = {
      data: newAggregate,
      isEmpty: newAggregate.length === 0,
      cost: sumBy(newAggregate, 'inventory_stock_exit_cost')
    };

    return newData;
  });

  return {
    data: aggregate,
    isEmpty: aggregate.length === 0,
    cost: sumBy(aggregate, 'inventory_stock_exit_cost')
  };
}

/**
 * Formats a grouped inventory stock exit into an aggregate object.
 * @param {Array<object>} exits - Inventory stock exit records.
 * @param {string} key - Group identifier (service or inventory name).
 * @returns {object} Formatted inventory stock exit summary.
 */
function formatExit(exits, key) {
  return {
    inventory_name: key,
    inventory_unit: exits[0]?.unit_text || '',
    inventory_stock_exit_data: exits,
    inventory_stock_exit_quantity: sumBy(exits, 'quantity'),
    inventory_stock_exit_cost: sumBy(exits, 'cost')
  };
}

/**
 * Groups an array of objects by a property.
 * @param {Array<object>} items - Items to group.
 * @param {string} key - Property name to group by.
 * @returns {Object<string, Array<object>>} Grouped items.
 */
function groupBy(items, key) {
  return items.reduce((groups, item) => {
    (groups[item[key]] ||= []).push(item);
    return groups;
  }, {});
}

/**
 * Calculates the sum of a numeric property across an array.
 * @param {Array<object>} items - Objects to sum.
 * @param {string} key - Property containing the numeric value.
 * @returns {number} Sum of the property values.
 */
function sumBy(items, key) {
  return items.reduce((sum, item) => sum + (item[key] || 0), 0);
}

/**
 * @function collect
 * @param {object} params query parameters
 * @returns {promise} { exitToPatient: [], exitToService: [], exitToDepot: [], exitToLoss: [] }
 */
async function collect(params) {
  const {
    depotUuid,
    dateFrom,
    dateTo,
    showDetails,
    includePatientExit,
    includeServiceExit,
    includeGroupedServiceExit,
    includeDepotExit,
    includeLossExit,
    exchangeRate,
  } = params;

  const data = { };

  // TODO(@jniles):
  /**
   *
   * @param rows
   */
  function exchange(rows) {
    rows.forEach(row => {
      row.cost *= exchangeRate;
      row.unit_cost *= exchangeRate;
    });

    return rows;
  }

  // get stock exit to patient
  if (includePatientExit) {
    data.exitToPatient = exchange(await StockExitToPatient.fetch(depotUuid, dateFrom, dateTo, showDetails));
  }

  // get stock exit to service
  if (includeServiceExit || includeGroupedServiceExit) {
    data.exitToService = exchange(await StockExitToService.fetch(depotUuid, dateFrom, dateTo, showDetails));
  }

  // get stock exit to other depot
  if (includeDepotExit) {
    data.exitToDepot = exchange(await StockExitToDepot.fetch(depotUuid, dateFrom, dateTo, showDetails));
  }

  // get stock exit to loss
  if (includeLossExit) {
    data.exitToLoss = exchange(await StockExitToLoss.fetch(depotUuid, dateFrom, dateTo, showDetails));
  }

  return data;
}

module.exports = stockExitReport;
