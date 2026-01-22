const _ = require('lodash');
const ReportManager = require('../../../../lib/ReportManager');
const ccAllocations = require('../../cost_center_allocation_registry');
const costCenterValueByAccounts = require('./accounts_report');
const costCenterIncomeAndExpense = require('./income_and_expense');

const TEMPLATE = './server/controllers/finance/reports/cost_center_step_down/report.handlebars';

// expose to the API
exports.report = document;
exports.costCenterValueByAccountsReport = costCenterValueByAccounts.report;
exports.incomeAndExpenseReport = costCenterIncomeAndExpense.report;

/**
 * @function reporting
 *
 * @description
 * Renders the cost center allocation report
 *
 * @param {*} options the report options
 * @param {*} session the session
 */
async function buildReport(params, session) {
  const options = _.extend(params, {
    filename : 'REPORT.COST_CENTER_STEPDOWN.TITLE',
    csvKey : 'rows',
    user : session.user,
  });

  const report = new ReportManager(TEMPLATE, session, options);

  const context = await ccAllocations.fetch(session, params);

  return report.render(context);
}

async function document(req, res) {
  const result = await buildReport(req.query, req.session);
  res.set(result.headers).send(result.report);
}
