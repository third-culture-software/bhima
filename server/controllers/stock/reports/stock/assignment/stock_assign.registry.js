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
function stockAssignRegistry(req, res, next) {
  let report;
  let display;

  const params = req.query;
  const optionReport = _.extend(req.query, {
    filename : 'ASSIGN.CURRENT_ASSIGNMENTS',
    csvKey : 'rows',
    renameKeys : false,
  });

  // set up the report with report manager
  try {
    if (req.query.displayNames) {
      display = JSON.parse(req.query.displayNames);
      delete req.query.displayNames;
    }

    report = new ReportManager(STOCK_ASSIGN_REGISTRY_TEMPLATE, req.session, optionReport);
  } catch (e) {
    return next(e);
  }

  return stockAssign.find(params)
    .then(rows => {
      const filters = _.uniqBy(formatFilters(params), 'field');
      const data = {
        enterprise : req.session.enterprise,
        rows,
        display,
        filters,
      };
      return report.render(data);
    })
    .then((result) => {
      res.set(result.headers).send(result.report);
    })
    .catch(next)
    
}

module.exports = stockAssignRegistry;
