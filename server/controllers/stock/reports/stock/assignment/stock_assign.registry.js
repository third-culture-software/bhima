const {
  _, ReportManager, STOCK_ASSIGN_REGISTRY_TEMPLATE, formatFilters,
} = require('../../common');

const stockAssign = require('../../../assign');

/**
 * @method stockAssignRegistry
 *
 * @description
 * This method builds the stock assign registry document based on client filters.
 *
 * GET /reports/stock/assign
 */
async function stockAssignRegistry(req, res) {
  let display;

  const params = req.query;
  const optionReport = _.extend(req.query, {
    filename : 'ASSIGN.CURRENT_ASSIGNMENTS',
    csvKey : 'rows',
    renameKeys : false,
  });

  // set up the report with report manager
  if (req.query.displayNames) {
    display = JSON.parse(req.query.displayNames);
    delete req.query.displayNames;
  }

  const report = new ReportManager(STOCK_ASSIGN_REGISTRY_TEMPLATE, req.session, optionReport);

  const rows = await stockAssign.find(params);
  const filters = _.uniqBy(formatFilters(params), 'field');
  const data = {
    enterprise : req.session.enterprise,
    rows,
    display,
    filters,
  };
  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

module.exports = stockAssignRegistry;
