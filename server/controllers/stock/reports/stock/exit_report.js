const {
  _, db, util, ReportManager, STOCK_EXIT_REPORT_TEMPLATE,
} = require('../common');

const Exchange = require('../../../finance/exchange');

const StockExitToPatient = require('./exit/exitToPatient');
const StockExitToService = require('./exit/exitToService');
const StockExitToDepot = require('./exit/exitToDepot');
const StockExitToLoss = require('./exit/exitToLoss');
const StockExitAggregateConsumption = require('./exit/exitAggregateConsumption');

/**
 * @method stockExitReport
 *
 * @description
 * This method builds the stock exit report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/stock/exit
 */
async function stockExitReport(req, res) {

  const params = util.convertStringToNumber(req.query);

  const optionReport = _.extend(params, {
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

  // exit to aggregate consumption
  collection.exitAggregateConsumption = formatAndCombine(exitCollection.exitAggregateConsumption);

  return collection;
}

function formatAndCombine(data, GROUP_BY_SERVICE) {
  const aggregate = _.chain(data)
    .groupBy(GROUP_BY_SERVICE ? 'service_display_name' : 'text')
    .map(formatExit)
    .map(newData => {
      if (!GROUP_BY_SERVICE) { return newData; }

      const newAggregate = _.chain(newData.inventory_stock_exit_data)
        .groupBy('text')
        .map(formatExit)
        .value();

      const cost = _.sumBy(newAggregate, 'inventory_stock_exit_cost');
      newData.subset = { data : newAggregate, isEmpty : _.size(newAggregate) === 0, cost };

      return newData;
    })
    .value();

  const cost = _.sumBy(aggregate, 'inventory_stock_exit_cost');
  return { data : aggregate, isEmpty : _.size(aggregate) === 0, cost };
}

/**
 * @function formatExit
 */
function formatExit(value, key) {
  return {
    inventory_name : key,
    inventory_unit : value && value[0] ? value[0].unit_text : '',
    inventory_stock_exit_data : value,
    inventory_stock_exit_quantity : _.sumBy(value, 'quantity'),
    inventory_stock_exit_cost : _.sumBy(value, 'cost'),
  };
}

/**
 * @function collect
 * @param {object} params query parameters
 * @return {promise} { exitToPatient: [], exitToService: [], exitToDepot: [], exitToLoss: [] }
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
    includeAggregateConsumption,
    exchangeRate,
  } = params;

  const data = { };

  // TODO(@jniles):
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

  // get stock exit for aggregate consumption
  if (includeAggregateConsumption) {
    data.exitAggregateConsumption = exchange(
      await StockExitAggregateConsumption.fetch(depotUuid, dateFrom, dateTo, showDetails),
    );
  }

  return data;
}

module.exports = stockExitReport;
