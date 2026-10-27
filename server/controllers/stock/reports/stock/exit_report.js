const {
  db, util, ReportManager, STOCK_EXIT_REPORT_TEMPLATE,
} = require('../common');

const Exchange = require('../../../finance/exchange');

const StockExitToPatient = require('./exit/exitToPatient');
const StockExitToService = require('./exit/exitToService');
const StockExitToDepot = require('./exit/exitToDepot');
const StockExitToLoss = require('./exit/exitToLoss');


const sumBy = (items, key) => items.reduce((sum, item) => sum + (item[key] || 0), 0);

/**
 * getDepot
 * @param {number} depotUuid depot uuid
 */
function getDepot(depotUuid) {
  const query = 'SELECT text FROM depot WHERE uuid = ?';
  return db.one(query, [db.bid(depotUuid)]);
}

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
  const opts =  { ...params, filename : 'REPORT.STOCK.EXIT_REPORT' };

  // set up the report with report manager
  const report = new ReportManager(STOCK_EXIT_REPORT_TEMPLATE, req.session, opts);

  const [depot, exchange] = await Promise.all([
    getDepot(params.depotUuid),
    Exchange.getExchangeRate(req.session.enterprise.id, params.currencyId, new Date()),
  ]);

  params.exchangeRate = exchange.rate || 1;
  params.depotName = depot.text;

  const bundle = await collect(params);
  Object.assign(bundle, params);

  const result = await report.render(bundle);
  res.set(result.headers).send(result.report);
}

const formatExitRow = (exits, key) => ({
  inventory_name: key,
  inventory_unit: exits[0]?.unit_text || '',
  exit_data: exits,
  exit_quantity: sumBy(exits, 'quantity'),
  exit_cost: sumBy(exits, 'cost')
});

const formatHeader = (array) => ({
  data: array,
  isEmpty: array.length === 0,
  cost: sumBy(array, 'exit_cost')
});

/**
 * Formats and aggregates inventory stock exit data.
 *
 * Data is grouped either by service name or inventory item text. When grouped
 * by service, each service is further grouped by inventory item to produce a
 * nested subset.
 * @param {Array<object>} data - Inventory stock exit records.
 * @returns {object} Aggregated inventory stock exit data.
 */
function formatAndCombine(data) {
  const groups = Object.groupBy(data, (o) => o.text);
  const aggregate = Object.entries(groups)
    .map(([key, values]) => formatExitRow(values, key));
  return formatHeader(aggregate);
}

/**
 *
 * @param data
 */
function formatAndCombineGroupedService(data) {
  const groups = Object.groupBy(data, (o) => o.service_display_name);
  const aggregate = Object.entries(groups)
    .map(([key, values]) => formatExitRow(values, key))
    .map(newData => {
      const newAggregate = Object.entries(
        Object.groupBy(newData.exit_data, o => o.text)
      ).map(([key, values]) => formatExitRow(values, key));

      newData.subset = formatHeader(newAggregate);
      return newData;
    });

  return formatHeader(aggregate);
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

  /**
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
    const records = showDetails ? 
      await StockExitToPatient.fetch(depotUuid, dateFrom, dateTo) : 
      await StockExitToPatient.fetchDetails(depotUuid, dateFrom, dateTo);
    data.exitToPatient = formatAndCombine(exchange(records));
  }

  // get stock exit to service
  if (includeServiceExit || includeGroupedServiceExit) {
    const records = showDetails ? 
      await StockExitToService.fetch(depotUuid, dateFrom, dateTo) :
      await StockExitToService.fetchDetails(depotUuid, dateFrom, dateTo);
    data.exitToService = formatAndCombine(exchange(records));
    if (includeGroupedServiceExit) {
      data.exitToServiceGrouped = formatAndCombineGroupedService(exchange(records), true);
    }
  }

  // get stock exit to other depot
  if (includeDepotExit) {
    const records = showDetails ? 
      await StockExitToDepot.fetch(depotUuid, dateFrom, dateTo) :
      await StockExitToDepot.fetchDetails(depotUuid, dateFrom, dateTo);
    data.exitToDepot = formatAndCombine(exchange(records));
  }

  // get stock exit to loss
  if (includeLossExit) {
    const records = showDetails ? 
      await StockExitToLoss.fetch(depotUuid, dateFrom, dateTo) :
      await StockExitToLoss.fetchDetails(depotUuid, dateFrom, dateTo);
    data.exitToLoss = formatAndCombine(exchange(records));
  }

  return data;
}

module.exports = stockExitReport;
