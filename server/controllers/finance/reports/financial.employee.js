/**
 * @overview server/controllers/finance/reports/financial.employee.js
 *
 * @description
 * This file contains code to create a PDF report for financial activities of an employee
 *
 * @requires Employee
 * @requires Creditors
 * @requires Debtors
 * @requires db
 * @requires Exchange
 * @requires ReportManager
 */
const ReportManager = require('../../../lib/ReportManager');

const Employee = require('../../payroll/employees');
const Creditors = require('../creditors');
const Debtors = require('../debtors');
const db = require('../../../lib/db');
const Exchange = require('../exchange');

const TEMPLATE = './server/controllers/finance/reports/financial.employee.handlebars';

const PDF_OPTIONS = {
  filename : 'REPORT.EMPLOYEE_STANDING.REPORT',
};

/**
 * @method build
 *
 * @description
 * This method builds the report of financial activities of an Employee.
 *
 * GET /reports/finance/employee_standing/:uuid
 */
async function build(req, res) {
  let options = req.query;
  let dateExchangeRate;

  options.currency_id = (options.currency_id || req.session.enterprise.currency_id);

  options.limitTimeInterval = parseInt(options.limitTimeInterval, 10);

  if (!options.limitTimeInterval) {
    options.dateFrom = ``;
    options.dateTo = ``;

    dateExchangeRate = new Date();
  } else {
    dateExchangeRate = options.dateTo;
  }

  options = { ...options, ...PDF_OPTIONS };

  // set up the report with report manager
  const report = new ReportManager(TEMPLATE, req.session, options);

  const currencyId = Number(options.currency_id);

  const sql = `
    SELECT BUID(p.debtor_uuid) as debtor_uuid
    FROM patient p
    JOIN employee em ON p.uuid = em.patient_uuid
    WHERE em.uuid = ?`;

  const [employee, patient, exchange] = await Promise.all([
    Employee.lookupEmployee(options.employee_uuid),
    db.one(sql, db.bid(options.employee_uuid)),
    Exchange.getExchangeRate(
      req.session.enterprise.id,
      currencyId,
      dateExchangeRate,
    ),
  ]);

  const data = {
    currencyId,
    dateExchangeRate,
    exchangeRate : exchange.rate || 1,
  };

  // get debtor/creditor information
  const [creditorOperations, debtorOperations] = await Promise.all([
    Creditors.getFinancialActivity(employee.creditor_uuid, options.dateFrom, options.dateTo),
    Debtors.getFinancialActivity(patient.debtor_uuid, true),
  ]);

  Object.assign(data, {
    employee,
    creditorTransactions : creditorOperations.transactions,
    creditorAggregates : creditorOperations.aggregates,
    debtorTransactions : debtorOperations.transactions,
    debtorAggregates : debtorOperations.aggregates,
  });

  if (creditorOperations.openingBalance) {
    Object.assign(data, {
      creditorOpeningBalance : creditorOperations.openingBalance[0],
    });
  }

  // provides the latest element of the table,
  // as the request is ordered by date, the last line item will
  // also be the employee's balance for the search period
  if (options.limitTimeInterval) {
    const lastTxn = creditorOperations.transactions.at(-1);
    data.lastTransaction = lastTxn || { cumsum : 0 };
    data.extratCreditorText = data.lastTransaction.cumsum >= 0
      ? 'FORM.LABELS.CREDIT_BALANCE' : 'FORM.LABELS.DEBIT_BALANCE';

    data.dates = {
      dateFrom : options.dateFrom,
      dateTo : options.dateTo,
    };
  }

  // employee balance
  data.includeMedicalCare = parseInt(options.includeMedicalCare, 10) === 1;
  data.limitTimeInterval = options.limitTimeInterval === 1;
  data.employeeStandingReport = !data.limitTimeInterval;

  // For the Employee Standing report, it must be mentioned if the employee has a credit or debit balance
  data.balanceCreditorText = data.creditorAggregates.balance >= 0
    ? 'FORM.LABELS.CREDIT_BALANCE' : 'FORM.LABELS.DEBIT_BALANCE';

  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

exports.report = build;
