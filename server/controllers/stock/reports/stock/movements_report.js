const util = require('../../../../lib/util');
const {
  _, ReportManager, Stock, formatFilters, STOCK_MOVEMENTS_REPORT_TEMPLATE,
} = require('../common');

/**
 * @method stockMovementsReport
 *
 * @description
 * This method builds the stock movements report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/stock/movements
 */
async function stockMovementsReport(req, res) {
  let display = {};
  const optionReport = _.extend(req.query, {
    filename : 'TREE.STOCK_MOVEMENTS',
    csvKey : 'rows',
    renameKeys : false,
  });

  // set up the report with report manager
  if (req.query.displayNames) {
    display = JSON.parse(req.query.displayNames);
    delete req.query.displayNames;
  }

  const report = new ReportManager(STOCK_MOVEMENTS_REPORT_TEMPLATE, req.session, optionReport);

  const params = req.query;

  if (req.session.stock_settings.enable_strict_depot_permission) {
    params.check_user_id = req.session.user.id;
  }

  const rows = await Stock.getLotsMovements(null, params);
  rows.forEach(row => {
    row.cost = util.roundDecimal(row.quantity * row.unit_cost, 3);
  });

  const data = {
    rows,
    display,
    filters : formatFilters(req.query),
  };

  // group by depot
  let depots = _.groupBy(rows, d => d.depot_text);

  // make sure that they keys are sorted in alphabetical order
  depots = _.mapValues(depots, lines => {
    _.sortBy(lines, 'depot_text');
    return lines;
  });

  data.depots = depots;

  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

module.exports = stockMovementsReport;
