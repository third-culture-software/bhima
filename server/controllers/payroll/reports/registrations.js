/**
 * @overview reports/registrations
 *
 * @description
 * This file contains code to create a PDF report of all employee registrations,
 * matching query conditions passed from the employee registry UI grid.
 *
 * @requires lodash
 * @requires moment
 * @requires Employees
 * @requires ReportManager
 */

const moment = require('moment');

const ReportManager = require('../../../lib/ReportManager');
const db = require('../../../lib/db');
const shared = require('../../finance/reports/shared');

const Employees = require('../employees');

const TEMPLATE = './server/controllers/payroll/reports/registrations.handlebars';

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
async function build(req, res) {
  const options = {
    ...req.query,
    filename : 'EMPLOYEE.TITLE',
    csvKey : 'employees',
    orientation : 'landscape',
  };

  // set up the report with report manager
  const report = new ReportManager(TEMPLATE, req.session, options);
  delete options.orientation;

  const filters = shared.formatFilters(options);

  // enforce detailed columns
  options.detailed = 1;

  const sql = `
    SELECT COUNT(em.reference) AS numEmployees, SUM(p.sex = 'F') AS numFemales,
      ROUND(SUM(p.sex = 'F') / COUNT(em.reference) * 100) AS percentFemales,
      SUM(p.sex = 'M') AS numMales, ROUND(SUM(p.sex = 'M') / COUNT(em.reference) * 100) AS percentMales
    FROM employee AS em
    JOIN patient AS p ON p.uuid = em.patient_uuid
    WHERE em.uuid IN (?);
  `;

  const data = { filters };

  const employees = await Employees.find(options);

  // calculate ages with moment
  employees.forEach(employee => {
    employee.age = moment().diff(employee.dob, 'years');
  });

  data.employees = employees;

  // gather the ids for the aggregate queries
  const empsUuid = employees.map(p => db.bid(p.uuid));

  data.aggregates = await db.one(sql, [empsUuid]);
  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

module.exports = build;
