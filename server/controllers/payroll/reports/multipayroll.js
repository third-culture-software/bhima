/**
 * @overview reports/payroll/multipayroll
 *
 * @description
 * This file contains code to create a PDF report of all MultiPayroll registrations,
 * matching query conditions passed from the multi Payroll UI grid.
 *
 * @requires lodash
 * @requires Employees
 * @requires ReportManager
 */

const _ = require('lodash');
const ReportManager = require('../../../lib/ReportManager');
const shared = require('../../finance/reports/shared');
const Payroll = require('../multiplePayroll');
const PayrollConfig = require('../configuration');

const TEMPLATE = './server/controllers/payroll/reports/multipayroll.handlebars';

/**
 * @method build
 *
 * @description
 * This method builds the report of employee registrations to be shipped back to
 * the client.  This method will eventually use the Employees.search() method to
 * specify query conditions.
 *
 * GET /reports/payroll/employees
 */
function build(req, res, next) {
  const options = _.clone(req.query);

  // delete options.payroll_configuration_id;
  delete options.currency_id;

  _.extend(options, { filename : 'EMPLOYEE.TITLE' });

  let report;

  // set up the report with report manager
  try {
    report = new ReportManager(TEMPLATE, req.session, options);
    delete options.orientation;
  } catch (e) {
    next(e);
    return;
  }

  const filters = shared.formatFilters(options);
  const data = { filters };

  PayrollConfig.lookupPayrollConfig(options.payroll_configuration_id)
    .then(config => {
      data.payrollTitle = config.label;
      return Payroll.find(options);
    })
    .then(rows => {
      data.rows = rows;
      return report.render(data);
    })
    .then(result => {
      res.set(result.headers).send(result.report);
    })
    .catch(next)
    

}

module.exports = build;
